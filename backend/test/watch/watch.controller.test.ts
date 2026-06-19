import "reflect-metadata";

import { describe, expect, mock, test } from "bun:test";

import { WatchController } from "../../src/watch/watch.controller.js";
import type { WatchService } from "../../src/watch/watch.service.js";

describe("WatchController", () => {
  const req = { authUser: { id: "user-1" } };

  test("list delegates with workspace id", async () => {
    const service = {
      listWatches: mock(async () => [{ id: "watch-1" }]),
    } as unknown as WatchService;
    const controller = new WatchController(service);

    await expect(
      controller.list(req as any, { workspaceId: "ws" }),
    ).resolves.toEqual([{ id: "watch-1" }]);
    expect(service.listWatches).toHaveBeenCalledWith("user-1", "ws");
  });

  test("set delegates enabled state", async () => {
    const service = {
      setWatch: mock(async () => ({ enabled: true })),
    } as unknown as WatchService;
    const controller = new WatchController(service);
    const body = {
      workspaceId: "ws",
      entityType: "collection",
      entityId: "col",
      enabled: true,
    };

    await expect(controller.set(req as any, body)).resolves.toEqual({
      enabled: true,
    });
    expect(service.setWatch).toHaveBeenCalledWith(
      "user-1",
      {
        workspaceId: "ws",
        entityType: "collection",
        entityId: "col",
      },
      true,
    );
  });
});
