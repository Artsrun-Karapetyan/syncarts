import { AlertCircle } from 'lucide-react';

export interface DuplicateImportItem {
  type: 'collection' | 'environment';
  data: any;
  originalName: string;
  proposedName: string;
  existingId?: string;
}

interface ImportDuplicatePromptProps {
  duplicateItem: DuplicateImportItem;
  onCancel: () => void;
  onChange: (item: DuplicateImportItem) => void;
  onImportCopy: () => void;
  onReplace: () => void;
}

export function ImportDuplicatePrompt(props: ImportDuplicatePromptProps) {
  const { duplicateItem, onCancel, onChange, onImportCopy, onReplace } = props;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.2s ease' }}>
      <div style={{ 
        padding: 16, 
        borderRadius: 'var(--radius-md)', 
        background: 'var(--status-put-bg)',
        color: 'var(--status-put)',
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <AlertCircle size={20} />
        <span>
          A {duplicateItem.type} named <strong>"{duplicateItem.originalName}"</strong> already exists.
          Import it as a copy or replace the existing one?
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          Import as
        </label>
        <input
          type="text"
          className="input"
          value={duplicateItem.proposedName}
          onChange={(e) => onChange({ ...duplicateItem, proposedName: e.target.value })}
          style={{ width: '100%' }}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onImportCopy();
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        {duplicateItem.type === 'collection' && (
          <button
            className="btn"
            onClick={onReplace}
            style={{ color: 'var(--status-delete)', borderColor: 'rgba(239, 68, 68, 0.35)' }}
          >
            Replace Existing
          </button>
        )}
        <button className="btn btn-primary" onClick={onImportCopy}>
          Import Copy
        </button>
      </div>
    </div>
  );
}
