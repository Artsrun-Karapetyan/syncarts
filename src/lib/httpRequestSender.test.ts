import { describe, expect, test } from "bun:test";

import { toFetchBody } from "@/lib/httpRequestSender";

describe("httpRequestSender", () => {
  test("builds browser fetch bodies", () => {
    expect(toFetchBody(null)).toBeUndefined();
    expect(toFetchBody({ type: "None" })).toBeUndefined();
    expect(toFetchBody({ type: "Raw", content: "body" })).toBe("body");

    const urlEncoded = toFetchBody({
      type: "FormUrlEncoded",
      items: [{ key: "email", value: "a@test.com" }],
    });
    expect(String(urlEncoded)).toBe("email=a%40test.com");

    const formData = toFetchBody({
      type: "FormData",
      items: [{ key: "name", value: "Artsrun" }],
    });
    expect(formData).toBeInstanceOf(FormData);
  });
});
