import { describe, expect, test } from "bun:test";

import {
  buildPostmanPathVariables,
  parsePostmanPathVariables,
} from "./postmanPathVariables";

describe("postmanPathVariables", () => {
  test("parses Postman variable values and builds export variables", () => {
    const variables = parsePostmanPathVariables(
      {
        variable: [
          { key: "id", value: "42", description: "User id" },
          { key: "unused", value: "ignored" },
        ],
      },
      "https://api.test/users/:id/posts/:postId",
    );

    expect(variables).toMatchObject([
      { key: "id", value: "42", description: "User id" },
      { key: "postId", value: "" },
    ]);
    expect(buildPostmanPathVariables(variables)).toMatchObject([
      { key: "id", value: "42", description: "User id" },
      { key: "postId", value: "" },
    ]);
  });
});
