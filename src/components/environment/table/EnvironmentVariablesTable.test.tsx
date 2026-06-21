import { render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";
import React from "react";

mock.module("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => ({
    secrets: {},
    updateSecret: mock(),
    activeTab: {},
    collections: [],
    activeEnvironment: null,
    globalVariables: [],
    responseCache: {},
  }),
}));

import { EnvironmentVariablesTable } from "./EnvironmentVariablesTable";

describe("EnvironmentVariablesTable", () => {
  const dummyProps: any = {
    isGlobals: false,
    currentVariables: [
      { id: "v1", key: "url", value: "http://api", type: "string" },
    ],
    handleAddVariable: mock(),
    handleUpdateVariable: mock(),
    handleDeleteVariable: mock(),
  };

  test("renders variables rows and add button", () => {
    render(<EnvironmentVariablesTable {...dummyProps} />);
    expect(screen.getByText("Add Variable")).toBeDefined();
  });

  test("renders dynamic global variables when isGlobals is true", () => {
    render(<EnvironmentVariablesTable {...dummyProps} isGlobals={true} />);
    expect(screen.getByDisplayValue("$guid")).toBeDefined();
    expect(screen.getByDisplayValue("$timestamp")).toBeDefined();
  });
});
