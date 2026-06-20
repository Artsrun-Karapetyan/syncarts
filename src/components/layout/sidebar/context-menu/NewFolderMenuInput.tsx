import type { CtxMenuState } from "@/components/layout/sidebar/types";

interface NewFolderMenuInputProps {
  newFolderName: string;
  setNewFolderName: (value: string) => void;
  handleFolderSubmit: () => void;
  setIsCreatingFolder: (value: boolean) => void;
  setCtxMenu: (value: CtxMenuState | null) => void;
}

export function NewFolderMenuInput({
  newFolderName,
  setNewFolderName,
  handleFolderSubmit,
  setIsCreatingFolder,
  setCtxMenu,
}: NewFolderMenuInputProps) {
  return (
    <div style={{ padding: "6px 12px" }}>
      <input
        autoFocus
        className="input"
        style={{ width: "100%", fontSize: 13, padding: "6px 10px" }}
        placeholder="Folder name"
        value={newFolderName}
        onChange={(e) => setNewFolderName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleFolderSubmit();
          if (e.key === "Escape") {
            setIsCreatingFolder(false);
            setCtxMenu(null);
          }
        }}
        onBlur={() => {
          setTimeout(() => {
            if (newFolderName.trim()) handleFolderSubmit();
            else {
              setIsCreatingFolder(false);
              setCtxMenu(null);
            }
          }, 100);
        }}
      />
    </div>
  );
}
