import { describe, expect, test } from "bun:test";

import { createRequestErrorResponse } from "./createRequestErrorResponse";

describe("createRequestErrorResponse", () => {
  test("creates a valid error response object with custom message", () => {
    const errorMsg = "Connection timeout";
    const response = createRequestErrorResponse(errorMsg);

    expect(response).toEqual({
      status: 0,
      status_text: "Request Error",
      headers: {},
      body: errorMsg,
      time_ms: 0,
    });
  });

  test("handles empty string error message", () => {
    const response = createRequestErrorResponse("");
    expect(response.body).toBe("");
    expect(response.status).toBe(0);
  });

  test("returns new object reference every time", () => {
    const response1 = createRequestErrorResponse("err");
    const response2 = createRequestErrorResponse("err");
    expect(response1).not.toBe(response2);
  });
});
