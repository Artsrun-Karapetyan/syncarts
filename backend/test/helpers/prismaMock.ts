export function createPrismaMock(overrides: Record<string, unknown> = {}) {
  return {
    $transaction: async (callback: (transaction: any) => unknown) =>
      callback(overrides),
    mergeRequest: {},
    session: {},
    user: {},
    workspace: {},
    workspaceInvite: {},
    workspaceMember: {},
    ...overrides,
  } as any;
}
