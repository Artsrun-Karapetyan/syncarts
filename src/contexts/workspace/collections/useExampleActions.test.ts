import { describe, expect, test } from "bun:test";

import { useExampleActions } from "./useExampleActions";

describe("useExampleActions", () => {
  const getArgs = (updateWorkspaces: any) => ({
    activeTab: {} as any,
    activeWorkspaceId: "w-active",
    updateWorkspaces,
  });

  const defaultWorkspace = {
    id: "w-active",
    collections: [
      {
        id: "c1",
        items: [
          {
            type: "request",
            id: "r1",
            examples: [{ id: "ex1", name: "Example 1" }],
          },
        ],
      },
    ],
  };

  test("addExample appends example via addExampleToItems", () => {
    let updater: any = null;
    const actions = useExampleActions(
      getArgs((u: any) => {
        updater = u;
      }),
    );

    actions.addExample("c1", "r1", "New Example", "ex-new");
    const result = updater([defaultWorkspace]);
    expect(result[0].collections[0].items[0].examples).toHaveLength(2);
    expect(result[0].collections[0].items[0].examples[1].name).toBe(
      "New Example",
    );
  });

  test("deleteExample removes example via deleteExampleFromItems", () => {
    let updater: any = null;
    const actions = useExampleActions(
      getArgs((u: any) => {
        updater = u;
      }),
    );

    actions.deleteExample("c1", "r1", "ex1");
    const result = updater([defaultWorkspace]);
    expect(result[0].collections[0].items[0].examples).toHaveLength(0);
  });

  test("updateExample modifies example properties via updateExampleInItems", () => {
    let updater: any = null;
    const actions = useExampleActions(
      getArgs((u: any) => {
        updater = u;
      }),
    );

    actions.updateExample("c1", "r1", "ex1", { name: "Updated Example" });
    const result = updater([defaultWorkspace]);
    expect(result[0].collections[0].items[0].examples[0].name).toBe(
      "Updated Example",
    );
  });

  test("duplicateExample duplicates example via duplicateExampleInItems", () => {
    let updater: any = null;
    const actions = useExampleActions(
      getArgs((u: any) => {
        updater = u;
      }),
    );

    actions.duplicateExample("c1", "r1", "ex1");
    const result = updater([defaultWorkspace]);
    expect(result[0].collections[0].items[0].examples).toHaveLength(2);
    expect(result[0].collections[0].items[0].examples[1].name).toBe(
      "Example 1 Copy",
    );
  });
});
