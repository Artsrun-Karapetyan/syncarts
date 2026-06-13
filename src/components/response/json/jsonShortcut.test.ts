import { describe, expect, it } from "bun:test";

import { getShortcutLabel } from "./jsonShortcut";

const originalNavigator = Object.getOwnPropertyDescriptor(
  globalThis,
  "navigator",
);

function setNavigatorPlatform(platform: string) {
  Object.defineProperty(globalThis, "navigator", {
    value: { platform },
    configurable: true,
  });
}

function restoreNavigator() {
  if (originalNavigator) {
    Object.defineProperty(globalThis, "navigator", originalNavigator);
    return;
  }

  delete (globalThis as { navigator?: Navigator }).navigator;
}

describe("jsonShortcut", () => {
  it("uses cmd on Apple platforms", () => {
    setNavigatorPlatform("MacIntel");

    expect(getShortcutLabel()).toBe("cmd");

    restoreNavigator();
  });

  it("uses ctrl on non-Apple platforms", () => {
    setNavigatorPlatform("Win32");

    expect(getShortcutLabel()).toBe("ctrl");

    restoreNavigator();
  });
});
