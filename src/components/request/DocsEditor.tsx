import { useState } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export function DocsEditor() {
  const { activeTab, updateActiveTab } = useWorkspace();
  const [isEditing, setIsEditing] = useState(false);

  const description = activeTab?.description || '';

  if (!activeTab) return null;

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn"
          style={{ padding: '6px 12px', fontSize: 12 }}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Preview' : 'Edit'}
        </button>
      </div>
      
      <div style={{ flex: 1, minHeight: 0 }}>
        {isEditing ? (
          <textarea
            className="input"
            style={{
              width: '100%',
              height: '100%',
              resize: 'none',
              padding: 16,
              fontFamily: 'inherit',
              fontSize: 14,
              lineHeight: 1.6,
            }}
            placeholder="Write a description for this request... (Markdown is supported)"
            value={description}
            onChange={(e) => updateActiveTab({ description: e.target.value })}
          />
        ) : (
          <div 
            style={{ 
              padding: '0 8px', 
              color: description ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize: 14,
              lineHeight: 1.6,
              overflowY: 'auto',
              height: '100%'
            }}
          >
            {description ? (
              <div style={{ whiteSpace: 'pre-wrap' }}>{description}</div>
            ) : (
              'No description provided. Click Edit to add one.'
            )}
          </div>
        )}
      </div>
    </div>
  );
}
