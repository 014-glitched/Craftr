/** Safe internal redirect target from `?next=` query params. */
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/app",
): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  if (next.includes("://")) return fallback;
  return next;
}

/** Extract invite token from paths like `/invite/<token>`. */
export function inviteTokenFromPath(path: string | null | undefined): string | null {
  if (!path) return null;
  const match = path.match(/^\/invite\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export function emailsMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
