export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
};

export type AuthenticatedRequest = {
  headers: {
    authorization?: string;
  };
  query?: {
    access_token?: string | string[];
  };
  authUser: AuthUser;
  authToken?: string;
  authSessionId?: string;
};
