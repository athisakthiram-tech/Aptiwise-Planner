// Section 13/23 — a thin, progressively-enhanced wrapper around the Web
// Share API. Not every browser supports navigator.share at all; of
// those that do, not every one supports sharing files (`canShare` with
// a `files` payload) — this adapter checks both, falls back to a
// text-only share when file sharing isn't supported, and tells the
// caller apart a user cancelling (AbortError) from a genuine failure so
// the UI never shows an error message for a deliberate cancel.

export interface ShareInput {
  title: string;
  text: string;
  files?: File[];
}

export type ShareOutcome =
  | { status: "unsupported" }
  | { status: "shared"; usedFiles: boolean }
  | { status: "cancelled" }
  | { status: "failed"; message: string };

function isAbort(err: unknown): boolean {
  if (typeof DOMException !== "undefined" && err instanceof DOMException) {
    return err.name === "AbortError";
  }
  return typeof err === "object" && err !== null && "name" in err && (err as { name?: unknown }).name === "AbortError";
}

export async function shareViaWebShare(input: ShareInput): Promise<ShareOutcome> {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (!nav || typeof nav.share !== "function") {
    return { status: "unsupported" };
  }

  const filesRequested = !!input.files && input.files.length > 0;
  const canUseFiles = filesRequested && typeof nav.canShare === "function" && nav.canShare({ files: input.files });

  const payload: ShareData = canUseFiles
    ? { title: input.title, text: input.text, files: input.files }
    : { title: input.title, text: input.text };

  try {
    await nav.share(payload);
    return { status: "shared", usedFiles: !!canUseFiles };
  } catch (err) {
    if (isAbort(err)) return { status: "cancelled" };
    return { status: "failed", message: err instanceof Error ? err.message : "Share failed." };
  }
}
