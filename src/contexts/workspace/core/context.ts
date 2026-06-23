import { createContext } from "react";

import type { WorkspaceContextState } from "@/contexts/workspace/core/types";

export const WorkspaceContext = createContext<
  WorkspaceContextState | undefined
>(undefined);
