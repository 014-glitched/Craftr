import { z } from "zod";

export function fieldErrors<T extends string>(
  error: z.ZodError,
): Partial<Record<T, string>> {
  const out: Partial<Record<T, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) {
      out[key as T] = issue.message;
    }
  }
  return out;
}

export function firstErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

export function safeParseFields<T extends string>(
  schema: z.ZodTypeAny,
  data: unknown,
): { success: true; data: z.infer<typeof schema> } | { success: false; errors: Partial<Record<T, string>> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: fieldErrors<T>(result.error) };
}
