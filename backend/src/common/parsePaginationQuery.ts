import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

export type PaginationOptions = {
  skip?: number;
  take?: number;
};

const PaginationQuerySchema = z
  .object({
    limit: z.preprocess(
      toOptionalNumber,
      z.number().int().min(1).max(100).optional(),
    ),
    offset: z.preprocess(toOptionalNumber, z.number().int().min(0).optional()),
  })
  .passthrough();

export function parsePaginationQuery(query: unknown): PaginationOptions {
  const parsed = PaginationQuerySchema.safeParse(query ?? {});
  if (!parsed.success) {
    throw new BadRequestException(parsed.error.flatten());
  }

  return {
    take: parsed.data.limit,
    skip: parsed.data.offset,
  };
}

function toOptionalNumber(value: unknown) {
  if (Array.isArray(value)) {
    return toOptionalNumber(value[0]);
  }

  if (value === undefined || value === "") {
    return undefined;
  }

  return Number(value);
}
