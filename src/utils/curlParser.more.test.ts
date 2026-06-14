import { describe, expect, test } from "bun:test";

import { parseCurlCommand } from "./curlParser";

describe("parseCurlCommand extra cases", () => {
  test("parses user agent, cookie, and basic auth flags", () => {
    const parsed = parseCurlCommand(
      "curl -A SyncArts -b a=b -u user:pass https://api.test",
    );

    expect(parsed?.headers).toEqual([
      { key: "User-Agent", value: "SyncArts" },
      { key: "Cookie", value: "a=b" },
      { key: "Authorization", value: `Basic ${btoa("user:pass")}` },
    ]);
  });

  test("handles short explicit method attached to -X and --header=", () => {
    const parsed = parseCurlCommand(
      "curl -XPOST --header=Accept:application/json https://api.com",
    );
    expect(parsed?.method).toBe("POST");
    expect(parsed?.headers?.[0].key).toBe("Accept");
    expect(parsed?.headers?.[0].value).toBe("application/json");
  });

  test("handles various data flags", () => {
    const parsed = parseCurlCommand(
      "curl --data-raw 'rawbody' https://api.com",
    );
    expect(parsed?.body).toBe("rawbody");

    const parsedBinary = parseCurlCommand(
      "curl --data-binary 'binary' https://api.com",
    );
    expect(parsedBinary?.body).toBe("binary");

    const parsedAscii = parseCurlCommand(
      "curl --data-ascii 'ascii' https://api.com",
    );
    expect(parsedAscii?.body).toBe("ascii");

    const parsedDataEqual = parseCurlCommand(
      "curl --data=body https://api.com",
    );
    expect(parsedDataEqual?.body).toBe("body");

    const parsedDataRawEqual = parseCurlCommand(
      "curl --data-raw=body https://api.com",
    );
    expect(parsedDataRawEqual?.body).toBe("body");
  });

  test("handles double quotes and escapes", () => {
    const parsed = parseCurlCommand(
      `curl -d "hello\\"world\\n" https://api.com`,
    );
    expect(parsed?.body).toBe('hello"world\n');

    const parsedEscapes = parseCurlCommand(
      `curl -d "\\r\\t\\b\\f\\v\\'" https://api.com`,
    );
    expect(parsedEscapes?.body).toBe("\r\t\b\f\v'");

    const parsedDollarQuote = parseCurlCommand(
      `curl -d $'dollar\\nquote' https://api.com`,
    );
    expect(parsedDollarQuote?.body).toBe("dollar\nquote");
  });

  test("handles decoding errors in URL encoded body", () => {
    const parsed = parseCurlCommand(
      "curl -d 'bad=%E0%A4%A' -H 'Content-Type: application/x-www-form-urlencoded' https://api.com",
    );
    expect(parsed?.formData?.[0].value).toBe("%E0%A4%A");
  });

  test("handles unquoted escapes outside quotes", () => {
    const parsed = parseCurlCommand("curl -d unquoted\\ space https://api.com");
    expect(parsed?.body).toBe("unquoted space");
  });

  test("handles --form and multipart/form-data parsing", () => {
    const parsed = parseCurlCommand(
      `curl --url "https://api.com" --form 'name=Admin' -F "file=@image.png"`,
    );
    expect(parsed?.method).toBe("POST");
    expect(parsed?.url).toBe("https://api.com");
    expect(parsed?.bodyType).toBe("form-data");

    expect(parsed?.formData?.[0].key).toBe("name");
    expect(parsed?.formData?.[0].value).toBe("Admin");
    expect(parsed?.formData?.[0].type).toBe("text");

    // The current formFlagToMultipartPart doesn't extract filename for @, so it parses as text
    expect(parsed?.formData?.[1].key).toBe("file");
    expect(parsed?.formData?.[1].type).toBe("text");
    expect(parsed?.formData?.[1].value).toBe("@image.png");
  });

  test("parses raw multipart body with filename", () => {
    const rawBody =
      "------SyncartsCurlFormBoundary\r\n" +
      'Content-Disposition: form-data; name="upload"; filename="test.txt"\r\n\r\n' +
      "filecontent\r\n" +
      "------SyncartsCurlFormBoundary--\r\n";
    const parsed = parseCurlCommand(
      `curl -H "Content-Type: multipart/form-data; boundary=----SyncartsCurlFormBoundary" --data-raw '${rawBody}' https://api.com`,
    );
    expect(parsed?.formData?.[0].type).toBe("file");
    expect(parsed?.formData?.[0].files).toEqual(["test.txt"]);
  });
});
