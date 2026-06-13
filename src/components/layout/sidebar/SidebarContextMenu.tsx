import {
  ArrowDownAZ,
  Download,
  Edit2,
  FilePlus2,
  FileText,
  FolderPlus,
  GitFork,
  GitPullRequest,
  ListOrdered,
  Trash2,
} from "lucide-react";
import { createPortal } from "react-dom";

import type { Collection } from "../../../contexts/WorkspaceContext";
import { MenuButton } from "./MenuButton";
import { MenuDivider } from "./MenuDivider";
import { NewFolderMenuInput } from "./NewFolderMenuInput";
import type {
  CtxMenuState,
  DeleteTarget,
  MenuRef,
  MergeRequestTarget,
} from "./types";

interface SidebarContextMenuProps {
  ctxMenu: CtxMenuState;
  menuRef: MenuRef;
  collections: Collection[];
  activeHasResponse: boolean;
  isCreatingFolder: boolean;
  newFolderName: string;
  setCtxMenu: (value: CtxMenuState | null) => void;
  setRenamingId: (value: string | null) => void;
  setRenameValue: (value: string) => void;
  setDeleteTarget: (value: DeleteTarget | null) => void;
  setMergeRequestTarget: (value: MergeRequestTarget | null) => void;
  setIsCreatingFolder: (value: boolean) => void;
  setNewFolderName: (value: string) => void;
  handleCreateFolder: () => void;
  handleFolderSubmit: () => void;
  handleCreateRequest: () => void;
  handleExportCollection: (collectionId: string) => void;
  handleExportFolder: (collectionId: string, folderId: string) => void;
  handleExportRequest: (collectionId: string, requestId: string) => void;
  addExample: (collectionId: string, requestId: string, name: string) => void;
  forkCollection: (collectionId: string) => void;
  sortItems: (
    collectionId: string,
    folderId: string | null,
    mode: "default" | "az",
  ) => void;
  showToast: (message: string) => void;
}

export function SidebarContextMenu(props: SidebarContextMenuProps) {
  const { ctxMenu } = props;
  const forkSource = props.collections.find(
    (collection) => collection.id === ctxMenu.collectionId,
  );

  return createPortal(
    <div
      ref={props.menuRef}
      className="animate-fade-in"
      style={{
        position: "fixed",
        zIndex: 99999,
        border: "1px solid var(--border-highlight)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-md)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        top: `${ctxMenu.y}px`,
        left: `${ctxMenu.x}px`,
        minWidth: 200,
        background: "rgba(15, 23, 42, 0.97)",
        backdropFilter: "blur(20px)",
        padding: 4,
      }}
    >
      {ctxMenu.itemId && (
        <MenuButton
          icon={Edit2}
          label="Rename"
          onClick={() => {
            props.setRenameValue(ctxMenu.itemName || "");
            props.setRenamingId(ctxMenu.itemId);
            props.setCtxMenu(null);
          }}
        />
      )}

      {ctxMenu.itemType === "request" && (
        <>
          <MenuDivider />
          <MenuButton
            icon={FileText}
            label="Add example"
            onClick={() => {
              if (ctxMenu.itemId)
                props.addExample(
                  ctxMenu.collectionId,
                  ctxMenu.itemId,
                  props.activeHasResponse ? "Example Response" : "New Example",
                );
              props.setCtxMenu(null);
            }}
          />
        </>
      )}

      {ctxMenu.itemType !== "request" && ctxMenu.itemType !== "example" && (
        <>
          <MenuButton
            icon={FolderPlus}
            label="New folder"
            iconColor="var(--accent-primary)"
            onClick={props.handleCreateFolder}
          />
          {props.isCreatingFolder && (
            <NewFolderMenuInput
              newFolderName={props.newFolderName}
              setNewFolderName={props.setNewFolderName}
              handleFolderSubmit={props.handleFolderSubmit}
              setIsCreatingFolder={props.setIsCreatingFolder}
              setCtxMenu={props.setCtxMenu}
            />
          )}
          <MenuButton
            icon={FilePlus2}
            label="New request"
            iconColor="var(--accent-primary)"
            onClick={props.handleCreateRequest}
          />
        </>
      )}

      {(ctxMenu.itemType === "collection" ||
        ctxMenu.itemType === "folder" ||
        ctxMenu.itemType === "request") && (
        <>
          <MenuDivider />
          <MenuButton
            icon={Download}
            label={`Export ${ctxMenu.itemType}`}
            onClick={() => {
              if (ctxMenu.itemType === "collection")
                props.handleExportCollection(ctxMenu.collectionId);
              if (ctxMenu.itemType === "folder" && ctxMenu.itemId)
                props.handleExportFolder(ctxMenu.collectionId, ctxMenu.itemId);
              if (ctxMenu.itemType === "request" && ctxMenu.itemId)
                props.handleExportRequest(ctxMenu.collectionId, ctxMenu.itemId);
              props.setCtxMenu(null);
            }}
          />
        </>
      )}

      {ctxMenu.itemType === "collection" && (
        <>
          <MenuDivider />
          <MenuButton
            icon={GitFork}
            label="Fork collection"
            iconColor="var(--accent-primary)"
            onClick={() => {
              props.forkCollection(ctxMenu.collectionId);
              props.setCtxMenu(null);
              props.showToast('Fork created in "My Workspace"');
            }}
          />
          {forkSource?.fork && (
            <>
              <MenuDivider />
              <MenuButton
                icon={GitPullRequest}
                label="Create Merge Request"
                iconColor="#b000ff"
                onClick={() => {
                  props.setMergeRequestTarget({
                    sourceCollectionId: forkSource.id,
                    targetWorkspaceId: forkSource.fork!.originalWorkspaceId,
                    targetCollectionId: forkSource.fork!.originalCollectionId,
                  });
                  props.setCtxMenu(null);
                }}
              />
            </>
          )}
        </>
      )}

      {(ctxMenu.itemType === "collection" || ctxMenu.itemType === "folder") && (
        <>
          <MenuDivider />
          <MenuButton
            icon={ListOrdered}
            label="Sort (Folders first)"
            onClick={() => {
              props.sortItems(
                ctxMenu.collectionId,
                ctxMenu.itemType === "folder" ? ctxMenu.itemId : null,
                "default",
              );
              props.setCtxMenu(null);
            }}
          />
          <MenuButton
            icon={ArrowDownAZ}
            label="Sort (A to Z)"
            onClick={() => {
              props.sortItems(
                ctxMenu.collectionId,
                ctxMenu.itemType === "folder" ? ctxMenu.itemId : null,
                "az",
              );
              props.setCtxMenu(null);
            }}
          />
        </>
      )}

      <MenuDivider />
      <MenuButton
        icon={Trash2}
        label={`Delete ${ctxMenu.itemType}`}
        destructive
        onClick={() => {
          if (ctxMenu.itemType === "collection")
            props.setDeleteTarget({
              id: ctxMenu.collectionId,
              type: "collection",
            });
          else if (
            ctxMenu.itemType === "example" &&
            ctxMenu.itemId &&
            ctxMenu.requestId
          )
            props.setDeleteTarget({
              id: ctxMenu.itemId,
              type: "example",
              collectionId: ctxMenu.collectionId,
              requestId: ctxMenu.requestId,
            });
          else if (ctxMenu.itemId)
            props.setDeleteTarget({
              id: ctxMenu.itemId,
              type: "item",
              collectionId: ctxMenu.collectionId,
            });
          props.setCtxMenu(null);
        }}
      />
    </div>,
    document.body,
  );
}
