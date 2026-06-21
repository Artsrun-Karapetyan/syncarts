import { describe, expect, test } from "bun:test";
import { extractRequestVariables } from "./extractRequestVariables";

describe("extractRequestVariables extra cases", () => {
  test("extracts variables from formData", () => {
    const vars = extractRequestVariables({
      url: "",
      body: "",
      headers: [],
      formData: [
        { key: "field", value: "{{form_val}}", type: "text", enabled: true },
        { key: "{{form_key}}", value: "text", type: "text", enabled: true }
      ]
    } as any);

    expect(vars).toContain("form_val");
    expect(vars).toContain("form_key");
  });
});
