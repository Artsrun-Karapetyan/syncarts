import { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, CheckSquare, Square, X, File } from 'lucide-react';
import { useWorkspace, BodyType, FormDataItem } from '../../contexts/WorkspaceContext';
import { Select } from '../ui/Select';
import { VariableTextInput } from './VariableTextInput';
import { VariableTextarea } from './VariableTextarea';

function FileValueEditor({ item, handleUpdateFormData }: { item: FormDataItem; handleUpdateFormData: (id: string, updates: Partial<FormDataItem>) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const updatePosition = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const fileCount = item.files?.length || 0;

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <button
        className="input"
        style={{
          width: '100%',
          minHeight: 32,
          fontSize: 13,
          background: 'transparent',
          textAlign: 'left',
          cursor: 'pointer',
          color: fileCount ? 'var(--text-primary)' : 'var(--text-tertiary)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          borderRadius: 0,
          margin: '-1px 0 0 -1px',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {fileCount ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <File size={12} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{fileCount} file{fileCount > 1 ? 's' : ''} selected</span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>Select files...</span>
        )}
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="animate-fade-in"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: Math.max(pos.width, 280),
            zIndex: 9999,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-highlight)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {fileCount > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
              {item.files?.map((file, idx) => {
                const fileName = file.split(/[/\\]/).pop() || file;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 8px',
                      fontSize: 12,
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file}>
                      {fileName}
                    </span>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'var(--text-tertiary)' }}
                      onClick={() => {
                        const newFiles = [...(item.files || [])];
                        newFiles.splice(idx, 1);
                        handleUpdateFormData(item.id, { files: newFiles });
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <button
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: 12,
              background: 'transparent',
              border: '1px dashed var(--border-highlight)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              gap: 6,
            }}
            onClick={async () => {
              try {
                const { open } = await import('@tauri-apps/plugin-dialog');
                const selected = await open({ multiple: true });
                if (selected) {
                  const fileArray = Array.isArray(selected) ? selected : [selected];
                  const newPaths = fileArray.map((f: any) => f.path || f);
                  handleUpdateFormData(item.id, { files: [...(item.files || []), ...newPaths] });
                }
              } catch (err) {
                console.error("Failed to open dialog", err);
              }
            }}
          >
            <Plus size={14} />
            New file from local machine
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

export function BodyEditor() {
  const { activeTab, updateActiveTab } = useWorkspace();

  const currentBodyType = activeTab?.bodyType || 'raw';
  
  const handleTypeChange = (type: BodyType) => {
    updateActiveTab({ bodyType: type });
  };

  const handleUpdateFormData = (id: string, updates: Partial<FormDataItem>) => {
    if (!activeTab) return;
    const newData = (activeTab.formData || []).map(item => item.id === id ? { ...item, ...updates } : item);
    updateActiveTab({ formData: newData });
  };

  const handleAddFormData = () => {
    if (!activeTab) return;
    const newData = [...(activeTab.formData || []), { id: crypto.randomUUID(), key: '', value: '', enabled: true, type: 'text' as const }];
    updateActiveTab({ formData: newData });
  };

  const handleDeleteFormData = (id: string) => {
    if (!activeTab) return;
    const newData = (activeTab.formData || []).filter(item => item.id !== id);
    updateActiveTab({ formData: newData });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Body Type Selector */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
        {(['none', 'form-data', 'x-www-form-urlencoded', 'raw'] as BodyType[]).map(type => (
          <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: currentBodyType === type ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            <input 
              type="radio" 
              name="bodyType" 
              checked={currentBodyType === type} 
              onChange={() => handleTypeChange(type)} 
              style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
            {type === 'none' ? 'none' : type === 'form-data' ? 'form-data' : type === 'x-www-form-urlencoded' ? 'x-www-form-urlencoded' : 'raw'}
          </label>
        ))}
      </div>

      {currentBodyType === 'none' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
          This request does not have a body
        </div>
      )}

      {currentBodyType === 'raw' && (
        <VariableTextarea
          className="input font-mono"
          style={{
            flex: 1,
            minHeight: 200,
            resize: 'none',
            padding: 16,
            fontSize: 13,
            lineHeight: 1.7,
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
          }}
          placeholder={'{\n  "key": "value"\n}'}
          value={activeTab?.body || ''}
          onChange={(value) => updateActiveTab({ body: value })}
          disabled={!activeTab}
        />
      )}

      {(currentBodyType === 'form-data' || currentBodyType === 'x-www-form-urlencoded') && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingTop: 1, paddingLeft: 1 }}>


          {(activeTab?.formData || []).map(item => (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr 40px', alignItems: 'center', gap: 0, marginBottom: 0, opacity: item.enabled === false ? 0.45 : 1 }}>
              <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.enabled ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}
                  onClick={() => handleUpdateFormData(item.id, { enabled: !item.enabled })}
                >
                  {item.enabled ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: 0 }}>
                <VariableTextInput
                  className="input"
                  style={{ width: '100%', fontSize: 13, background: 'transparent', paddingRight: currentBodyType === 'form-data' ? 60 : undefined, borderRadius: 0, margin: '-1px 0 0 -1px' }}
                  placeholder="Key"
                  value={item.key}
                  onChange={(value) => handleUpdateFormData(item.id, { key: value })}
                />
                {currentBodyType === 'form-data' && (
                  <div style={{ position: 'absolute', right: 4, zIndex: 5, display: 'flex', alignItems: 'center' }}>
                    <Select
                      value={item.type || 'text'}
                      options={[
                        { value: 'text', label: 'Text' },
                        { value: 'file', label: 'File' }
                      ]}
                      onChange={(val) => handleUpdateFormData(item.id, { type: val as 'text' | 'file' })}
                      variant="ghost"
                      style={{ minWidth: 70 }}
                    />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                {item.type === 'file' ? (
                  <FileValueEditor item={item} handleUpdateFormData={handleUpdateFormData} />
                ) : (
                  <VariableTextInput
                    className="input"
                    style={{ width: '100%', fontSize: 13, background: 'transparent', borderRadius: 0, margin: '-1px 0 0 -1px' }}
                    placeholder="Value"
                    value={item.value}
                    onChange={(value) => handleUpdateFormData(item.id, { value })}
                  />
                )}
              </div>
              <VariableTextInput
                className="input"
                style={{ width: '100%', fontSize: 13, background: 'transparent', borderRadius: 0, margin: '-1px 0 0 -1px' }}
                placeholder="Description"
                value={item.description || ''}
                onChange={(description) => handleUpdateFormData(item.id, { description })}
              />
              <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                  onClick={() => handleDeleteFormData(item.id)}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--status-delete)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          <button
            className="btn"
            style={{ alignSelf: 'flex-start', marginTop: 8 }}
            onClick={handleAddFormData}
          >
            <Plus size={14} />
            Add Field
          </button>
        </div>
      )}
    </div>
  );
}
