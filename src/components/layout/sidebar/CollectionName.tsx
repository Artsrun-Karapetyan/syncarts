import type { Collection } from '../../../contexts/WorkspaceContext';

interface CollectionNameProps {
  collection: Collection;
  renamingId: string | null;
  renameValue: string;
  setRenameValue: (value: string) => void;
  handleRenameSubmit: () => void;
  setRenamingId: (value: string | null) => void;
}

export function CollectionName({ collection, renamingId, renameValue, setRenameValue, handleRenameSubmit, setRenamingId }: CollectionNameProps) {
  if (renamingId === collection.id) {
    return (
      <input
        autoFocus
        className="input"
        style={{ fontSize: 13, flex: 1, padding: '2px 6px', margin: '-2px -6px' }}
        value={renameValue}
        onChange={(e) => setRenameValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleRenameSubmit();
          if (e.key === 'Escape') setRenamingId(null);
        }}
        onBlur={handleRenameSubmit}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, overflow: 'hidden' }}>
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{collection.name}</span>
      {collection.fork && (
        <span style={{ fontSize: 9, fontWeight: 800, color: '#000', background: 'linear-gradient(135deg, #00f0ff 0%, #00b8ff 100%)', borderRadius: 4, padding: '1px 5px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 2px 8px rgba(0, 240, 255, 0.25)' }} title="This is a forked collection">
          Fork
        </span>
      )}
    </div>
  );
}
