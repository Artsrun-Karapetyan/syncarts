import { BadRequestException } from "@nestjs/common";
import { describe, expect, test } from "bun:test";

import { parsePaginationQuery } from "../../src/common/parsePaginationQuery.js";

describe("parsePaginationQuery", () => {
  test("parses numeric strings into Prisma pagination options", () => {
    expect(parsePaginationQuery({ limit: "25", offset: "10" })).toEqual({
      take: 25,
      skip: 10,
    });
  });

  test("allows missing pagination values", () => {
    expect(parsePaginationQuery({})).toEqual({
      take: undefined,
      skip: undefined,
    });
  });

  test("rejects invalid pagination values", () => {
    expect(() => parsePaginationQuery({ limit: "0" })).toThrow(
      BadRequestException,
    );
    expect(() => parsePaginationQuery({ offset: "-1" })).toThrow(
      BadRequestException,
    );
  });
});
