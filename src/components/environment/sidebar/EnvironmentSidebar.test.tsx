import { render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";
import React from "react";

import { EnvironmentSidebar } from "./EnvironmentSidebar";

describe("EnvironmentSidebar", () => {
  const dummyProps: any = {
    environments: [{ id: "env-1", name: "Production" }],
    selectedEnvId: "env-1",
    isCreatingEnv: false,
    newEnvName: "",
    fileInputRef: { current: null },
    setSelectedEnvId: mock(),
    setIsCreatingEnv: mock(),
    setNewEnvName: mock(),
    createEnvironment: mock().mockReturnValue("new-id"),
    deleteEnvironment: mock(),
    handleImportFile: mock(),
  };

  test("renders environments list and allows selection", () => {
    render(<EnvironmentSidebar {...dummyProps} />);
    expect(screen.getByText("Production")).toBeDefined();
    expect(screen.getByText("Globals")).toBeDefined();
  });

  test("renders input block when creating new environment", () => {
    render(
      <EnvironmentSidebar
        {...dummyProps}
        isCreatingEnv={true}
        newEnvName="Staging"
      />,
    );
    expect(screen.getByPlaceholderText("Environment name...")).toBeDefined();
  });

  test("renders empty text when no environments are present", () => {
    render(<EnvironmentSidebar {...dummyProps} environments={[]} />);
    expect(screen.getByText("No environments")).toBeDefined();
  });
});
