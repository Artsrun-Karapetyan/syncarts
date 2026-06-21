import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import {
  deleteWorkspaceSecrets,
  getWorkspaceSecrets,
  setWorkspaceSecrets,
} from "./secretsVault";

describe("secretsVault fallback", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("returns empty object if no secrets stored", async () => {
    const secrets = await getWorkspaceSecrets("w1");
    expect(secrets).toEqual({});
  });

  test("saves and retrieves workspace secrets in localStorage fallback", async () => {
    const mockSecrets = { api_key: "secret123" };
    await setWorkspaceSecrets("w1", mockSecrets);

    const retrieved = await getWorkspaceSecrets("w1");
    expect(retrieved).toEqual(mockSecrets);
  });

  test("deletes workspace secrets from localStorage fallback", async () => {
    const mockSecrets = { token: "abc" };
    await setWorkspaceSecrets("w2", mockSecrets);

    await deleteWorkspaceSecrets("w2");
    const retrieved = await getWorkspaceSecrets("w2");
    expect(retrieved).toEqual({});
  });

  test("handles multiple workspace secrets independently", async () => {
    await setWorkspaceSecrets("w1", { key: "v1" });
    await setWorkspaceSecrets("w2", { key: "v2" });

    const s1 = await getWorkspaceSecrets("w1");
    const s2 = await getWorkspaceSecrets("w2");

    expect(s1).toEqual({ key: "v1" });
    expect(s2).toEqual({ key: "v2" });
  });
});
