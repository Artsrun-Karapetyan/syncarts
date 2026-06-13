interface NewCollectionInputProps {
  newColName: string;
  setNewColName: (value: string) => void;
  handleAddCollection: () => void;
  setIsAdding: (value: boolean) => void;
}

export function NewCollectionInput({
  newColName,
  setNewColName,
  handleAddCollection,
  setIsAdding,
}: NewCollectionInputProps) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
      <input
        autoFocus
        className="input"
        style={{ fontSize: 13, flex: 1, padding: "6px 10px" }}
        placeholder="Collection name"
        value={newColName}
        onChange={(e) => setNewColName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAddCollection()}
        onBlur={() => {
          setTimeout(() => {
            if (newColName.trim()) handleAddCollection();
            else setIsAdding(false);
          }, 100);
        }}
      />
    </div>
  );
}
