import { describe, expect, test } from "bun:test";

import { POSTMAN_MEMBERS } from "@/components/request/scripts/scriptAutocompletePostmanMembers";
import { ROOT_SUGGESTIONS } from "@/components/request/scripts/scriptAutocompleteRoot";
import { STANDARD_MEMBERS } from "@/components/request/scripts/scriptAutocompleteStandardMembers";

describe("script autocomplete member data", () => {
  test("includes expected root and standard JavaScript suggestions", () => {
    expect(ROOT_SUGGESTIONS.map((suggestion) => suggestion.label)).toContain(
      "pm",
    );
    expect(STANDARD_MEMBERS.JSON.map((suggestion) => suggestion.label)).toEqual(
      ["parse", "stringify"],
    );
    expect(
      STANDARD_MEMBERS.Array.map((suggestion) => suggestion.label),
    ).toContain("isArray");
  });

  test("includes expected Postman response assertions", () => {
    expect(POSTMAN_MEMBERS.pm.map((suggestion) => suggestion.label)).toContain(
      "sendRequest",
    );
    expect(
      POSTMAN_MEMBERS["pm.response.to.have"].map(
        (suggestion) => suggestion.label,
      ),
    ).toEqual(["status", "body", "header"]);
  });
});
