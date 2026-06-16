import { BadRequestException } from "@nestjs/common";
import { describe, expect, test } from "bun:test";
import { z } from "zod";

import { parseZodSchema } from "../../src/common/parseZodSchema.js";

describe("parseZodSchema", () => {
  test("returns parsed data", () => {
    const schema = z.object({ name: z.string().min(1) });

    expect(parseZodSchema(schema, { name: "API" })).toEqual({ name: "API" });
  });

  test("throws BadRequestException for invalid data", () => {
    const schema = z.object({ name: z.string().min(1) });

    expect(() => parseZodSchema(schema, { name: "" })).toThrow(
      BadRequestException,
    );
  });
});
