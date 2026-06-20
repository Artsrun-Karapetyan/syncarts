import { describe, expect, test } from "bun:test";

import { parsePostmanCollection } from "@/utils/postman/postmanImportParser";

describe("postmanImportParser extra cases", () => {
  test("throws on invalid collection", () => {
    expect(() => parsePostmanCollection("{}")).toThrow(
      "Invalid Postman Collection format",
    );
  });

  test("parses folders and folder variables", () => {
    const json = JSON.stringify({
      info: { name: "Test" },
      item: [
        {
          name: "Folder",
          item: [],
          variable: [{ key: "fvar", value: "fval", disabled: false }],
        },
      ],
    });
    const parsed = parsePostmanCollection(json);
    const folder = parsed.items[0] as any;
    expect(folder.type).toBe("folder");
    expect(folder.variables[0]).toMatchObject({ key: "fvar", value: "fval" });
  });

  test("parses shorthand request (req is string)", () => {
    const json = JSON.stringify({
      info: { name: "Test" },
      item: [{ request: "https://api.com" }],
    });
    const parsed = parsePostmanCollection(json);
    const req = parsed.items[0] as any;
    expect(req.url).toBe("https://api.com");
  });

  test("parses bearer auth", () => {
    const json = JSON.stringify({
      info: { name: "Test" },
      auth: { type: "bearer", bearer: [{ key: "token", value: "abc" }] },
    });
    const parsed = parsePostmanCollection(json);
    expect(parsed.authType).toBe("bearer");
    expect(parsed.bearerToken).toBe("abc");
  });

  test("parses collection variables", () => {
    const json = JSON.stringify({
      info: { name: "Test" },
      variable: [{ key: "cvar", value: "cval" }],
    });
    const parsed = parsePostmanCollection(json);
    expect(parsed.variables[0]).toMatchObject({ key: "cvar", value: "cval" });
  });

  test("parses url encoded and form-data body", () => {
    const json = JSON.stringify({
      info: { name: "Test" },
      item: [
        {
          request: {
            url: { raw: "http://api.com" },
            body: {
              mode: "formdata",
              formdata: [{ key: "f", value: "v", type: "text" }],
            },
          },
        },
        {
          request: {
            url: { raw: "http://api.com" },
            body: {
              mode: "urlencoded",
              urlencoded: [{ key: "u", value: "w", type: "text" }],
            },
          },
        },
      ],
    });
    const parsed = parsePostmanCollection(json);
    const req1 = parsed.items[0] as any;
    expect(req1.bodyType).toBe("form-data");
    expect(req1.formData[0].key).toBe("f");

    const req2 = parsed.items[1] as any;
    expect(req2.bodyType).toBe("x-www-form-urlencoded");
    expect(req2.formData[0].key).toBe("u");
  });

  test("parses original request inside example", () => {
    const json = JSON.stringify({
      info: { name: "Test" },
      item: [
        {
          request: { url: "http://api.com" },
          response: [
            {
              originalRequest: {
                url: "http://api.com/orig",
                method: "POST",
                header: [{ key: "hx", value: "vy" }],
                body: { mode: "raw", raw: "origbody" },
              },
            },
          ],
        },
      ],
    });
    const parsed = parsePostmanCollection(json);
    const req = parsed.items[0] as any;
    const example = req.examples[0];
    expect(example.originalRequest.url).toBe("http://api.com/orig");
    expect(example.originalRequest.body).toBe("origbody");
    expect(example.originalRequest.headers[0].key).toBe("hx");
  });
});
