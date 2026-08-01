import { BadRequestException } from "@nestjs/common";
import { firstErrorMessage } from "@craftr/validation";
import { z } from "zod";

export function parseInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new BadRequestException(firstErrorMessage(result.error));
  }
  return result.data;
}
