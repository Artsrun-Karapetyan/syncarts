import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { describe, expect, test } from "bun:test";

import { WorkspaceRequestService } from "../../src/workspace/workspace-request.service.js";
import { createPrismaMock } from "../helpers/prismaMock";

describe("WorkspaceService request entity sync", () => {
  test("getRequestForUser returns one request payload", async () => {
    const service = new WorkspaceRequestService(
      createPrismaMock({
        workspace: {
          findFirst: async () => ({
            id: "workspace",
            ownerId: "owner",
            members: [],
          }),
        },
        workspaceRequest: {
          findFirst: async () => ({
            id: "request",
            workspaceId: "workspace",
            collectionId: "collection",
            folderId: null,
            name: "List Users",
            method: "GET",
            url: "/users",
            headers: [],
            body: "",
            version: 2,
            examples: [],
          }),
        },
      }),
    );

    await expect(
      service.getRequestForUser("workspace", "request", "owner"),
    ).resolves.toMatchObject({
      id: "request",
      type: "request",
      name: "List Users",
      version: 2,
    });
  });

  test("getRequestForUser rejects missing requests", async () => {
    const service = new WorkspaceRequestService(
      createPrismaMock({
        workspace: {
          findFirst: async () => ({
            id: "workspace",
            ownerId: "owner",
            members: [],
          }),
        },
        workspaceRequest: { findFirst: async () => null },
      }),
    );

    await expect(
      service.getRequestForUser("workspace", "missing", "owner"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  test("updateRequestForUser updates request row, examples, and workspace version", async () => {
    let updateManyInput: any;
    let workspaceUpdateInput: any;
    const createdExamples: any[] = [];
    const emittedEvents: any[] = [];
    const service = new WorkspaceRequestService(
      createPrismaMock({
        workspace: {
          findFirst: async () => ({
            id: "workspace",
            ownerId: "owner",
            members: [],
          }),
          update: async (input: any) => {
            workspaceUpdateInput = input;
            return {
              version: 10,
              updatedAt: new Date("2026-06-17T00:00:00.000Z"),
            };
          },
        },
        workspaceCollection: {
          findUnique: async () => ({ id: "collection" }),
        },
        workspaceRequest: {
          updateMany: async (input: any) => {
            updateManyInput = input;
            return { count: 1 };
          },
          findUnique: async () => ({
            id: "request",
            name: "Updated",
            method: "POST",
            url: "/users",
            headers: [],
            body: "{}",
            version: 3,
            examples: [
              {
                id: "example",
                name: "OK",
                code: 200,
                status: "OK",
                body: "{}",
                headers: [],
              },
            ],
          }),
        },
        requestExample: {
          deleteMany: async () => ({ count: 1 }),
          create: async ({ data }: any) => {
            createdExamples.push(data);
            return data;
          },
        },
      }),
      { emit: (event: any) => emittedEvents.push(event) } as any,
    );

    const result = await service.updateRequestForUser({
      workspaceId: "workspace",
      requestId: "request",
      userId: "owner",
      data: {
        collectionId: "collection",
        folderId: null,
        version: 2,
        name: "Updated",
        method: "POST",
        url: "/users",
        headers: [],
        body: "{}",
        examples: [
          {
            id: "example",
            name: "OK",
            code: 200,
            status: "OK",
            body: "{}",
            headers: [],
          },
        ],
      },
    });

    expect(updateManyInput.where).toEqual({
      id: "request",
      workspaceId: "workspace",
      version: 2,
    });
    expect(updateManyInput.data.version).toEqual({ increment: 1 });
    expect(createdExamples[0]).toMatchObject({
      id: "example",
      workspaceId: "workspace",
      requestId: "request",
    });
    expect(workspaceUpdateInput).toEqual({
      where: { id: "workspace" },
      data: { version: { increment: 1 } },
      select: { version: true, updatedAt: true },
    });
    expect(result).toMatchObject({ id: "request", version: 3 });
    expect(emittedEvents[0]).toMatchObject({
      type: "request.updated",
      workspaceId: "workspace",
      entityType: "request",
      entityId: "request",
      parentId: "collection",
      workspaceVersion: 10,
    });
  });

  test("updateRequestForUser rejects stale request versions", async () => {
    const service = new WorkspaceRequestService(
      createPrismaMock({
        workspace: {
          findFirst: async () => ({
            id: "workspace",
            ownerId: "owner",
            members: [],
          }),
        },
        workspaceCollection: {
          findUnique: async () => ({ id: "collection" }),
        },
        workspaceRequest: {
          updateMany: async () => ({ count: 0 }),
        },
      }),
    );

    await expect(
      service.updateRequestForUser({
        workspaceId: "workspace",
        requestId: "request",
        userId: "owner",
        data: { collectionId: "collection", version: 1 },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  test("updateRequestForUser rejects missing collections", async () => {
    const service = new WorkspaceRequestService(
      createPrismaMock({
        workspace: {
          findFirst: async () => ({
            id: "workspace",
            ownerId: "owner",
            members: [],
          }),
        },
        workspaceCollection: {
          findUnique: async () => null,
        },
      }),
    );

    await expect(
      service.updateRequestForUser({
        workspaceId: "workspace",
        requestId: "request",
        userId: "owner",
        data: { collectionId: "missing" },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  test("updateRequestForUser rejects folders outside collection", async () => {
    const service = new WorkspaceRequestService(
      createPrismaMock({
        workspace: {
          findFirst: async () => ({
            id: "workspace",
            ownerId: "owner",
            members: [],
          }),
        },
        workspaceCollection: {
          findUnique: async () => ({ id: "collection" }),
        },
        workspaceFolder: {
          findFirst: async () => null,
        },
      }),
    );

    await expect(
      service.updateRequestForUser({
        workspaceId: "workspace",
        requestId: "request",
        userId: "owner",
        data: { collectionId: "collection", folderId: "other-folder" },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  test("updateRequestForUser blocks viewers", async () => {
    const service = new WorkspaceRequestService(
      createPrismaMock({
        workspace: {
          findFirst: async () => ({
            id: "workspace",
            ownerId: "owner",
            members: [{ userId: "viewer", role: "VIEWER" }],
          }),
        },
      }),
    );

    await expect(
      service.updateRequestForUser({
        workspaceId: "workspace",
        requestId: "request",
        userId: "viewer",
        data: { collectionId: "collection" },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
