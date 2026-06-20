import { describe, expect, test } from "bun:test";

import { formatApiError, shouldClearAuthSession } from "@/lib/api";

describe("formatApiError", () => {
  test("formats zod field errors from Nest bad requests", () => {
    const message = formatApiError(
      JSON.stringify({
        statusCode: 400,
        message: {
          formErrors: [],
          fieldErrors: {
            name: ["Name must be at least 2 characters."],
          },
        },
        error: "Bad Request",
      }),
      400,
    );

    expect(message).toBe("Name must be at least 2 characters.");
  });

  test("formats direct zod field errors", () => {
    const message = formatApiError(
      JSON.stringify({
        formErrors: [],
        fieldErrors: {
          password: ["Password must be at least 8 characters."],
        },
      }),
      400,
    );

    expect(message).toBe("Password must be at least 8 characters.");
  });

  test("clears auth session only for authenticated unauthorized requests", () => {
    expect(shouldClearAuthSession(401, "token")).toBe(true);
    expect(shouldClearAuthSession(401)).toBe(false);
    expect(shouldClearAuthSession(400, "token")).toBe(false);
  });
});
