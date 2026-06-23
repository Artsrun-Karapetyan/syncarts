export function createPrismaMock(overrides: Record<string, unknown> = {}) {
  const emptyDelegate = {
    create: async () => ({}),
    deleteMany: async () => ({ count: 0 }),
    findMany: async () => [],
  };

  return {
    $transaction: async (callback: (transaction: any) => unknown) =>
      callback({
        workspaceCollection: emptyDelegate,
        workspaceEnvironment: emptyDelegate,
        workspaceGlobalVariable: emptyDelegate,
        workspaceFolder: emptyDelegate,
        workspaceRequest: emptyDelegate,
        workspaceWatch: emptyDelegate,
        requestExample: emptyDelegate,
        ...overrides,
      }),
    mergeRequest: {},
    notification: emptyDelegate,
    notificationPreference: emptyDelegate,
    requestExample: emptyDelegate,
    session: {},
    user: {},
    workspace: {},
    workspaceCollection: emptyDelegate,
    workspaceEnvironment: emptyDelegate,
    workspaceGlobalVariable: emptyDelegate,
    workspaceFolder: emptyDelegate,
    workspaceInvite: {},
    workspaceMember: {},
    workspaceRequest: emptyDelegate,
    workspaceWatch: emptyDelegate,
    ...overrides,
  } as any;
}
