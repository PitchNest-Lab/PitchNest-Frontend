import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

/**
 * Live Pitch WebSocket connection.
 *
 * - Wakes the live service with an HTTP health ping before opening the socket.
 *   The live service can be asleep (free hosting tiers spin down when idle);
 *   once REST moved off it, nothing woke it before the founder reached the
 *   room, so the room sat "Offline" for ~40s.
 * - Reconnects with backoff after an unexpected drop. The room re-sends
 *   client_ready on every new socket, flagged as a resume, so the server
 *   rebuilds the session from the transcript.
 * - Never reconnects after an auth / account / quota rejection: those need
 *   the user to act, so the server's reason is surfaced instead.
 * - Logs every close code and reason.
 */

export type SocketStatus = 'connecting' | 'waking' | 'connected' | 'reconnecting' | 'failed';

interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  status: SocketStatus;
  /** Human-readable reason when status is 'failed'. */
  errorMessage: string | null;
  /** Bumps on every successful reconnect after the first connection. */
  reconnectCount: number;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  status: 'connecting',
  errorMessage: null,
  reconnectCount: 0,
});

export const useSocketContext = () => useContext(SocketContext);

// Server close codes (backend restSocket.ts) that must not be retried.
const TERMINAL_CLOSE_CODES = new Set([4001, 4002, 4005, 4006]);
// Server error codes that precede a close and must not be retried.
const TERMINAL_ERROR_CODES = new Set([
  'AUTH_REQUIRED',
  'AUTH_FAILED',
  'TOO_MANY_SESSIONS',
  'USER_DELETED',
  'EMAIL_NOT_VERIFIED',
  'PLAN_QUOTA_EXCEEDED',
  'PITCH_ATTEMPT_LIMIT',
]);

const MAX_RECONNECT_ATTEMPTS = 6;
const WAKE_HINT_AFTER_MS = 3000;
const WAKE_TIMEOUT_MS = 75000;

export function resolveLiveSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname;
  const isLocal =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    hostname.endsWith('.local');
  const explicitWs = import.meta.env.VITE_WS_BACKEND_URL as string | undefined;

  if (explicitWs) return explicitWs;
  if (isLocal) {
    // Vite dev server proxies /ws; the Express server on :3000 serves WS directly.
    return window.location.port === '3000'
      ? `${protocol}//${window.location.host}`
      : `${protocol}//${window.location.host}/ws`;
  }
  if (hostname.includes('onrender.com')) return `${protocol}//${window.location.host}`;
  return 'wss://pitchnest-live.onrender.com';
}

/** The live service's HTTP health URL, derived from the socket URL. */
function liveHealthUrl(wsUrl: string): string | null {
  try {
    const u = new URL(wsUrl);
    u.protocol = u.protocol === 'wss:' ? 'https:' : 'http:';
    u.pathname = '/api/health';
    u.search = '';
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget wake-up for the live service. Called from pages that lead
 * to the room (pitch setup) so the service is warm by the time the founder
 * clicks start.
 */
export function prewarmLiveService(): void {
  const url = liveHealthUrl(resolveLiveSocketUrl());
  if (!url) return;
  fetch(url, { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<SocketStatus>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const disposedRef = useRef(false);
  const attemptRef = useRef(0);
  const everConnectedRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    disposedRef.current = false;
    const baseUrl = resolveLiveSocketUrl();

    const wake = async () => {
      const health = liveHealthUrl(baseUrl);
      if (!health) return;
      const hint = setTimeout(() => {
        if (!disposedRef.current) setStatus('waking');
      }, WAKE_HINT_AFTER_MS);
      const ctrl = new AbortController();
      const cap = setTimeout(() => ctrl.abort(), WAKE_TIMEOUT_MS);
      try {
        await fetch(health, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal });
      } catch {
        // Health check unreachable: still try the socket; its close handler decides.
      } finally {
        clearTimeout(hint);
        clearTimeout(cap);
      }
    };

    const connect = async () => {
      if (disposedRef.current) return;
      await wake();
      if (disposedRef.current) return;

      // Read the token at connect time so a reconnect uses the current login.
      let url = baseUrl;
      const token = localStorage.getItem('token');
      if (token) url += `${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;

      console.log(`🔌 Connecting to PitchNest Brain (attempt ${attemptRef.current + 1})...`);
      const ws = new WebSocket(url);
      wsRef.current = ws;
      let serverError: { code?: string; message?: string } | null = null;

      ws.onopen = () => {
        if (disposedRef.current) return;
        console.log('✅ Connected to PitchNest Brain');
        if (everConnectedRef.current) setReconnectCount((n) => n + 1);
        everConnectedRef.current = true;
        attemptRef.current = 0;
        setErrorMessage(null);
        setStatus('connected');
        setSocket(ws);
      };

      // Remember the server's rejection reason; it arrives just before the close.
      ws.addEventListener('message', (ev) => {
        try {
          const data = JSON.parse(String(ev.data));
          if (data?.type === 'error' && TERMINAL_ERROR_CODES.has(data.code)) {
            serverError = { code: data.code, message: data.message };
          }
        } catch {
          // Non-JSON frames are not ours to inspect.
        }
      });

      ws.onclose = (ev) => {
        console.log(
          `❌ Disconnected from Brain (code ${ev.code}${ev.reason ? `, reason "${ev.reason}"` : ''}${
            serverError?.code ? `, server error ${serverError.code}` : ''
          }, clean=${ev.wasClean})`,
        );
        if (wsRef.current === ws) wsRef.current = null;
        setSocket((cur) => (cur === ws ? null : cur));
        if (disposedRef.current) return;

        if (serverError || TERMINAL_CLOSE_CODES.has(ev.code)) {
          setErrorMessage(serverError?.message || ev.reason || 'The live session was closed by the server.');
          setStatus('failed');
          return;
        }
        if (attemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setErrorMessage("We couldn't reach the AI panel. Check your connection and refresh the page.");
          setStatus('failed');
          return;
        }
        const delay = Math.min(15000, 1000 * 2 ** attemptRef.current);
        attemptRef.current += 1;
        setStatus(everConnectedRef.current ? 'reconnecting' : 'connecting');
        retryTimerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = (error) => {
        console.error('⚠️ WebSocket Error:', error);
      };
    };

    connect();

    return () => {
      // Leaving the room: stop retrying and close without triggering a reconnect.
      disposedRef.current = true;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      const ws = wsRef.current;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{ socket, isConnected: status === 'connected' && !!socket, status, errorMessage, reconnectCount }}
    >
      {children}
    </SocketContext.Provider>
  );
};
