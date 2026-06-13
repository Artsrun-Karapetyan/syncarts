import { createPortal } from 'react-dom';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  requestName: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedChangesModal({
  isOpen,
  requestName,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onCancel}
    >
      <div
        className="animate-fade-in"
        style={{
          width: 420,
          maxWidth: 'calc(100vw - 32px)',
          background: 'linear-gradient(180deg, rgba(31, 31, 31, 0.98), rgba(22, 22, 22, 0.98))',
          border: '1px solid var(--border-highlight)',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h2 style={{ fontSize: 18, lineHeight: 1.2, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Save changes?
            </h2>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45, maxWidth: 320 }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{requestName || 'This request'}</span> has unsaved changes. Save before closing to avoid losing work.
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            style={{
              width: 26,
              height: 26,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: '26px',
              padding: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 2 }}>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              className="btn"
              style={{
                minWidth: 88,
                height: 34,
                padding: '0 12px',
                fontSize: 13,
                fontWeight: 500,
                background: 'transparent',
                border: '1px solid var(--border-highlight)',
              }}
              onClick={onDiscard}
            >
              Don't save
            </button>
            <button
              className="btn"
              style={{
                minWidth: 78,
                height: 34,
                padding: '0 12px',
                fontSize: 13,
                fontWeight: 500,
                background: 'transparent',
                border: '1px solid var(--border-highlight)',
              }}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              style={{
                minWidth: 122,
                height: 34,
                padding: '0 12px',
                fontSize: 13,
                fontWeight: 700,
              }}
              onClick={onSave}
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
