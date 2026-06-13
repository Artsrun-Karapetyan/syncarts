import { RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';

type HoveredUrlVariable = {
  kind: 'environment' | 'path';
  name: string;
  x: number;
  y: number;
  exists: boolean;
  hasValue: boolean;
  value?: string;
  source?: string;
};

interface UrlVariablePopoverProps {
  hoveredVar: HoveredUrlVariable;
  popoverRef: RefObject<HTMLDivElement | null>;
  onSave: (name: string, value: string) => void;
  onSaveCollection?: (name: string, value: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onOpenCollectionVariables: () => void;
  onOpenPathVariables: () => void;
  canOpenCollectionVariables: boolean;
  variableTargetLabel: string;
}

export function UrlVariablePopover(props: UrlVariablePopoverProps) {
  const {
    hoveredVar,
    popoverRef,
    onSave,
    onSaveCollection,
    onMouseEnter,
    onMouseLeave,
    onOpenCollectionVariables,
    onOpenPathVariables,
    canOpenCollectionVariables,
    variableTargetLabel
  } = props;
  const inputId = `url-var-input-${hoveredVar.kind}-${hoveredVar.name}`;
  const isPathVariable = hoveredVar.kind === 'path';
  const isDynamic = hoveredVar.source === 'Dynamic';

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        left: hoveredVar.x,
        top: hoveredVar.y,
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: 0,
        zIndex: 999999,
        boxShadow: 'var(--shadow-lg)',
        minWidth: 340,
        overflow: 'hidden',
        fontSize: 13,
        color: 'var(--text-primary)'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div style={{ padding: '14px 16px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          key={inputId}
          id={inputId}
          className="input"
          style={{ 
            fontSize: 13, 
            padding: '8px 10px', 
            height: 36,
            opacity: isDynamic ? 0.8 : 1,
            cursor: isDynamic ? 'not-allowed' : 'text'
          }}
          defaultValue={hoveredVar.value || ''}
          placeholder="Enter value"
          autoFocus={!isDynamic}
          disabled={isDynamic}
          onKeyDown={(e) => {
            if (!isDynamic && e.key === 'Enter') onSave(hoveredVar.name, e.currentTarget.value);
          }}
        />
        {!isDynamic && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              className="btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                const input = document.getElementById(inputId) as HTMLInputElement;
                onSave(hoveredVar.name, input?.value || '');
              }}
            >
              <Plus size={14} /> {hoveredVar.exists ? 'Update' : 'Add'} {isPathVariable ? 'Path' : variableTargetLabel} Variable
            </button>
            {variableTargetLabel === 'Folder' && onSaveCollection && (
              <button
                className="btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  const input = document.getElementById(inputId) as HTMLInputElement;
                  onSaveCollection(hoveredVar.name, input?.value || '');
                }}
              >
                <Plus size={14} /> {hoveredVar.exists ? 'Update' : 'Add'} Collection Variable
              </button>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={isDynamic ? undefined : (isPathVariable ? onOpenPathVariables : onOpenCollectionVariables)}
        disabled={isDynamic || (!isPathVariable && !canOpenCollectionVariables)}
        style={{
          width: '100%',
          border: 0,
          borderTop: '1px solid var(--border-color)',
          background: 'transparent',
          color: 'var(--text-secondary)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: isDynamic ? 'default' : (isPathVariable || canOpenCollectionVariables ? 'pointer' : 'default'),
          fontSize: 13
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ 
            width: 20, 
            height: 20, 
            borderRadius: 5, 
            background: isDynamic ? 'var(--accent-primary)' : (isPathVariable ? 'var(--bg-secondary)' : '#9b7200'), 
            color: isDynamic ? '#fff' : (isPathVariable ? 'var(--text-secondary)' : '#fff0a8'), 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: 700 
          }}>
            {isDynamic ? 'G' : (isPathVariable ? ':' : 'C')}
          </span>
          {isDynamic ? 'Dynamic variable' : (isPathVariable ? 'Path variable' : 'Collection')}
        </span>
        <span>{isDynamic ? 'Auto-generated' : 'Variables in request ->'}</span>
      </button>
    </div>,
    document.body
  );
}
