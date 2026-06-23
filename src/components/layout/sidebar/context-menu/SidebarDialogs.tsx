import { SidebarToast } from "@/components/layout/sidebar/SidebarToast";
import type {
  DeleteTarget,
  MergeRequestTarget,
} from "@/components/layout/sidebar/types";
import { ConfirmModal } from "@/components/ui/ConfirmModal/ConfirmModal";
import { CreateMergeRequestModal } from "@/components/workspace/CreateMergeRequestModal";
import { ImportModal } from "@/components/workspace/ImportModal";

interface SidebarDialogsProps {
  isImportModalOpen: boolean;
  deleteTarget: DeleteTarget | null;
  mergeRequestTarget: MergeRequestTarget | null;
  toastMessage: string | null;
  onCloseImport: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onCloseMergeRequest: () => void;
  onMergeRequestSuccess: () => void;
}

export function SidebarDialogs({
  isImportModalOpen,
  deleteTarget,
  mergeRequestTarget,
  toastMessage,
  onCloseImport,
  onCancelDelete,
  onConfirmDelete,
  onCloseMergeRequest,
  onMergeRequestSuccess,
}: SidebarDialogsProps) {
  return (
    <>
      <ImportModal isOpen={isImportModalOpen} onClose={onCloseImport} />
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title={
          deleteTarget?.type === "collection"
            ? "Delete Collection"
            : deleteTarget?.type === "example"
              ? "Delete Example"
              : "Delete Item"
        }
        message={`Are you sure you want to delete this ${deleteTarget?.type}? ${deleteTarget?.type === "collection" || deleteTarget?.type === "item" ? "All contents inside it will be permanently lost." : ""} This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
      <CreateMergeRequestModal
        isOpen={!!mergeRequestTarget}
        onClose={onCloseMergeRequest}
        sourceCollectionId={mergeRequestTarget?.sourceCollectionId || ""}
        targetWorkspaceId={mergeRequestTarget?.targetWorkspaceId || ""}
        targetCollectionId={mergeRequestTarget?.targetCollectionId || ""}
        onSuccess={onMergeRequestSuccess}
      />
      {toastMessage && <SidebarToast message={toastMessage} />}
    </>
  );
}
