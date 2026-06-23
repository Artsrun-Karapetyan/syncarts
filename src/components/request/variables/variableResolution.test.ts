import { describe, expect, test } from "bun:test";

import {
  resolveScopedVariable,
  upsertActiveVariableValue,
} from "@/components/request/variables/variableResolution";

describe("variableResolution", () => {
  test("resolves environment before collection, folder, and globals", () => {
    const resolved = resolveScopedVariable({
      activeEnvironment: {
        id: "env",
        name: "Dev",
        variables: [{ id: "env-url", key: "url", value: "env", enabled: true }],
      },
      ancestors: [
        {
          type: "collection",
          variables: [
            {
              id: "collection-url",
              key: "url",
              value: "collection",
              enabled: true,
            },
          ],
        },
      ],
      globalVariables: [
        { id: "global-url", key: "url", value: "global", enabled: true },
      ],
      varName: "url",
    });

    expect(resolved).toMatchObject({
      exists: true,
      hasValue: true,
      source: "Dev",
      sourceType: "Environment",
      value: "env",
    });
  });

  test("resolves nearest folder or collection ancestor before globals", () => {
    const resolved = resolveScopedVariable({
      ancestors: [
        {
          type: "collection",
          variables: [
            { id: "base", key: "token", value: "collection", enabled: true },
          ],
        },
        {
          type: "folder",
          variables: [
            { id: "folder", key: "token", value: "folder", enabled: true },
          ],
        },
      ],
      globalVariables: [
        { id: "global-token", key: "token", value: "global", enabled: true },
      ],
      varName: "token",
    });

    expect(resolved).toMatchObject({
      sourceType: "Folder",
      value: "folder",
    });
  });

  test("upserts active variable values without touching disabled duplicate", () => {
    expect(
      upsertActiveVariableValue(
        [
          {
            id: "disabled",
            key: "token",
            value: "old-disabled",
            enabled: false,
          },
          { id: "active", key: "token", value: "old", enabled: true },
        ],
        "token",
        "new",
      ),
    ).toEqual([
      { id: "disabled", key: "token", value: "old-disabled", enabled: false },
      { id: "active", key: "token", value: "new", enabled: true },
    ]);
  });
});
