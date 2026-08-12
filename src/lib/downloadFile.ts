/**
 * Fetches a PDF (authenticated) and hands it to the browser in a way that
 * works on desktop AND mobile.
 *
 * Why not the plain anchor-click pattern everywhere:
 * - Mobile browsers pick blob downloads up asynchronously — revoking the
 *   object URL right after `a.click()` cancels the download mid-flight.
 * - iOS Safari and in-app webviews ignore the anchor `download` attribute for
 *   blob URLs; the reliable path there is opening the blob in a tab, where
 *   Safari's PDF viewer offers share/save.
 *
 * The iOS tab must be opened synchronously (before the first await) so it
 * still counts as the user's tap — otherwise the popup blocker eats it.
 *
 * Throws on failure so callers keep their own error UI. The thrown error
 * carries the HTTP `status`, so a caller can distinguish a paywall (402) from
 * a genuine failure and respond with an upgrade prompt rather than an alert.
 */
export class PdfDownloadError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "PdfDownloadError";
  }
}

export async function downloadPdf(
  fetcher: () => Promise<Response>,
  filename: string,
): Promise<void> {
  const isIOS =
    /iP(hone|od|ad)/.test(navigator.userAgent) ||
    // iPadOS 13+ reports as MacIntel but is touch-first.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const viewerTab = isIOS ? window.open("", "_blank") : null;

  try {
    const res = await fetcher();
    if (!res.ok) {
      // Surface the server's own message when it sent one (the paywall does).
      const body = await res.json().catch(() => null);
      throw new PdfDownloadError(
        body?.message || body?.error || "Failed to generate PDF",
        res.status,
      );
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    if (viewerTab && !viewerTab.closed) {
      viewerTab.location.href = url;
    } else {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    viewerTab?.close();
    throw err;
  }
}
