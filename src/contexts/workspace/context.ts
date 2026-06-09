import { createContext } from 'react';
import type { WorkspaceContextState } from './types';

export const WorkspaceContext = createContext<WorkspaceContextState | undefined>(undefined);
