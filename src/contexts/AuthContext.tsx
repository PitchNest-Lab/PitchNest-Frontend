import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export type UserRole = "Founder" | "Investor" | "Advisor";

interface User {
  id: number;
  name: string;
  email: string;
  role?: UserRole;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<any>;
  signup: (
    name: string,
    email: string,
    password: string,
    role?: UserRole,
  ) => Promise<any>;
  logout: () => void;
  isLoading: boolean;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (!storedUser || !storedToken) {
      setIsLoading(false);
      return;
    }

    // Verify token is still valid against the backend
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => {
        if (res.ok) {
          try {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
          } catch (e) {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
          }
        } else {
          // Token expired or invalid — clear everything
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      })
      .catch(() => {
        // Network error — trust local storage to avoid locking out offline users
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } catch (e) {}
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    role?: UserRole,
  ) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message||data.error || "Signup failed");

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
    return data;
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.error || "Google sign-in failed");

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  /**
   * Authenticated fetch wrapper — automatically attaches the JWT Bearer token
   * to all API requests. Use this instead of raw fetch() for protected endpoints.
   */
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const currentToken = token || localStorage.getItem("token");

      const headers = new Headers(options.headers || {});
      if (currentToken) {
        headers.set("Authorization", `Bearer ${currentToken}`);
      }

      const res = await fetch(url, { ...options, headers });

      // If token expired or invalid, force logout
      if (res.status === 401) {
        setUser(null);
        setToken(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }

      return res;
    },
    [token],
  );

  // Refetch user data when the window regains focus so pages show live data
  useEffect(() => {
    const onFocus = () => {
      const currentToken = localStorage.getItem("token");
      if (!currentToken) return;
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${currentToken}` },
      })
        .then((res) => {
          if (!res.ok) {
            setUser(null);
            setToken(null);
            localStorage.removeItem("user");
            localStorage.removeItem("token");
          }
        })
        .catch(() => {}); // Ignore network errors silently
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, login, loginWithGoogle, signup, logout, isLoading, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
