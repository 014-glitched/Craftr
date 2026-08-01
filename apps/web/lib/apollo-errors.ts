/** Best-effort short message from an Apollo mutation/query failure. */
export function apolloErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!error || typeof error !== "object") return fallback;

  const maybe = error as {
    message?: string;
    errors?: Array<{ message?: string }>;
    graphQLErrors?: Array<{ message?: string }>;
    networkError?: { message?: string };
    cause?: unknown;
  };

  // Apollo Client 4 CombinedGraphQLErrors uses `.errors`
  const fromErrors =
    maybe.errors?.find((e) => e.message)?.message ??
    maybe.graphQLErrors?.find((e) => e.message)?.message;

  if (fromErrors) return sanitizeMessage(fromErrors, fallback);

  if (maybe.networkError?.message) {
    return "Unable to reach the server. Make sure the API is running.";
  }

  if (maybe.message === "Failed to fetch") {
    return "Unable to reach the server. Make sure the API is running.";
  }

  // Prefer cause message when Apollo wraps GraphQL errors
  if (maybe.cause) {
    return apolloErrorMessage(maybe.cause, fallback);
  }

  if (maybe.message) return sanitizeMessage(maybe.message, fallback);

  return fallback;
}

function sanitizeMessage(message: string, fallback: string): string {
  const trimmed = message.trim();
  // Avoid dumping huge CombinedGraphQLErrors / JSON blobs into the UI
  if (!trimmed || trimmed.length > 280 || trimmed.startsWith("{")) {
    return fallback;
  }
  // Strip Apollo's "N errors:" prefixes when present
  const singleLine = trimmed.split("\n")[0]?.trim() ?? trimmed;
  return singleLine.length > 0 ? singleLine : fallback;
}
