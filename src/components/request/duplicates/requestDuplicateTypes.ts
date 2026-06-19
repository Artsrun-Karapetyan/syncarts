import type { SavedRequest } from "../../../contexts/workspace/core/types";

export type DuplicateKind = "exact" | "similar";

export interface DuplicateRequestMatch {
  folderId: string | null;
  folderPath: string;
  request: SavedRequest;
}

export interface DuplicateRequestGroup {
  key: string;
  kind: DuplicateKind;
  requests: DuplicateRequestMatch[];
}
