import { FolderPlus } from 'lucide-react';

export function EmptyCollections() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 32, color: 'var(--text-tertiary)' }}>
      <FolderPlus size={28} style={{ opacity: 0.4 }} />
      <div style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.5 }}>
        No collections yet.<br />Click <strong>+</strong> to create one.
      </div>
    </div>
  );
}
