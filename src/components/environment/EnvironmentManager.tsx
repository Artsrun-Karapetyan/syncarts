import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, CheckSquare, Square, Globe, Upload } from 'lucide-react';
import { useWorkspace, EnvironmentVariable } from '../../contexts/WorkspaceContext';
import { importPostmanEnvironment } from '../../utils/postmanParser';
import { VariableTextInput } from '../request/VariableTextInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function EnvironmentManager({ isOpen, onClose }: Props) {
  const { environments, globalVariables, createEnvironment, updateEnvironment, deleteEnvironment, updateGlobalVariables } = useWorkspace();
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>('globals');
  const [isCreatingEnv, setIsCreatingEnv] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !selectedEnvId) {
      setSelectedEnvId('globals');
    }
  }, [isOpen, selectedEnvId]);

  if (!isOpen) return null;

  const isGlobals = selectedEnvId === 'globals';
  const selectedEnv = isGlobals ? undefined : environments.find(e => e.id === selectedEnvId);
  const currentVariables = isGlobals ? globalVariables : (selectedEnv?.variables || []);

  const handleAddVariable = () => {
    const newVar: EnvironmentVariable = {
      id: crypto.randomUUID(),
      key: '',
      value: '',
      enabled: true
    };
    if (isGlobals) {
      updateGlobalVariables([...globalVariables, newVar]);
    } else if (selectedEnv) {
      updateEnvironment(selectedEnv.id, {
        variables: [...selectedEnv.variables, newVar]
      });
    }
  };

  const handleUpdateVariable = (varId: string, updates: Partial<EnvironmentVariable>) => {
    if (isGlobals) {
      updateGlobalVariables(globalVariables.map(v => v.id === varId ? { ...v, ...updates } : v));
    } else if (selectedEnv) {
      updateEnvironment(selectedEnv.id, {
        variables: selectedEnv.variables.map(v => v.id === varId ? { ...v, ...updates } : v)
      });
    }
  };

  const handleDeleteVariable = (varId: string) => {
    if (isGlobals) {
      updateGlobalVariables(globalVariables.filter(v => v.id !== varId));
    } else if (selectedEnv) {
      updateEnvironment(selectedEnv.id, {
        variables: selectedEnv.variables.filter(v => v.id !== varId)
      });
    }
  };

  const handleCreateEnv = () => {
    setIsCreatingEnv(true);
    setNewEnvName('');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const parsedEnv = importPostmanEnvironment(json);
        createEnvironment(parsedEnv.name, parsedEnv.variables);
      } catch (err) {
        console.error('Failed to import environment:', err);
        alert('Failed to import environment. Make sure it is a valid Postman Environment format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '90vw',
          maxWidth: 800,
          height: '85vh',
          maxHeight: 600,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Sidebar */}
        <div style={{ width: 240, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
          <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Environments</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".json" 
                onChange={handleImportFile} 
              />
              <button 
                className="tooltip-trigger" data-tooltip="Import Postman Environment"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >
                <Upload size={14} />
              </button>
              <button 
                className="tooltip-trigger" data-tooltip="New Environment"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={handleCreateEnv}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          
          {isCreatingEnv && (
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
              <input
                autoFocus
                className="input"
                style={{ width: '100%', fontSize: 13 }}
                placeholder="Environment name..."
                value={newEnvName}
                onChange={(e) => setNewEnvName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (newEnvName.trim()) {
                      const id = createEnvironment(newEnvName.trim());
                      setSelectedEnvId(id);
                      setNewEnvName('');
                      setIsCreatingEnv(false);
                    }
                  }
                  if (e.key === 'Escape') {
                    setIsCreatingEnv(false);
                    setNewEnvName('');
                  }
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => { setIsCreatingEnv(false); setNewEnvName(''); }}>Cancel</button>
                <button className="btn btn-primary" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => {
                  if (newEnvName.trim()) {
                    const id = createEnvironment(newEnvName.trim());
                    setSelectedEnvId(id);
                    setNewEnvName('');
                    setIsCreatingEnv(false);
                  }
                }}>Create</button>
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                background: selectedEnvId === 'globals' ? 'var(--bg-tertiary)' : 'transparent',
                color: selectedEnvId === 'globals' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: selectedEnvId === 'globals' ? 600 : 500,
                fontSize: 13,
                marginBottom: 8,
              }}
              onClick={() => setSelectedEnvId('globals')}
            >
              <Globe size={14} style={{ color: 'var(--accent-primary)' }} />
              Globals
            </div>

            {environments.map(env => (
              <div
                key={env.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: selectedEnvId === env.id ? 'var(--bg-tertiary)' : 'transparent',
                  color: selectedEnvId === env.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: selectedEnvId === env.id ? 600 : 500,
                  fontSize: 13,
                }}
                onClick={() => setSelectedEnvId(env.id)}
              >
                {env.name}
                <Trash2 
                  size={14} 
                  style={{ opacity: selectedEnvId === env.id ? 0.8 : 0, cursor: 'pointer' }} 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete environment "${env.name}"?`)) {
                      deleteEnvironment(env.id);
                      if (selectedEnvId === env.id) setSelectedEnvId(null);
                    }
                  }}
                />
              </div>
            ))}
            {environments.length === 0 && (
              <div style={{ padding: '16px 8px', fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                No environments
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
          <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {isGlobals && <Globe size={18} style={{ color: 'var(--accent-primary)' }} />}
              {isGlobals ? 'Globals' : selectedEnv ? selectedEnv.name : 'Select an environment'}
            </h2>
            <button
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
              onClick={onClose}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
            {(isGlobals || selectedEnv) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingTop: 1, paddingLeft: 1 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 1fr 40px',
                  gap: 0,
                  alignItems: 'center',
                  background: 'var(--bg-tertiary)',
                  borderTop: '1px solid var(--border-color)',
                  borderBottom: '1px solid var(--border-color)',
                  borderLeft: '1px solid var(--border-color)',
                  borderRight: '1px solid var(--border-color)',
                  borderRadius: '4px 4px 0 0',
                  margin: '-1px 0 0 -1px',
                }}>
                  <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}></div>
                  <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderLeft: '1px solid var(--border-color)' }}>Variable</div>
                  <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderLeft: '1px solid var(--border-color)' }}>Initial Value</div>
                  <div style={{ padding: '6px 12px', borderLeft: '1px solid var(--border-color)' }}></div>
                </div>

                {isGlobals && [
                  { key: '$guid', desc: 'Generated UUID (dynamic)' },
                  { key: '$timestamp', desc: 'Unix timestamp (dynamic)' },
                  { key: '$isoTimestamp', desc: 'ISO timestamp (dynamic)' }
                ].map(v => (
                  <div key={v.key} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '40px 1fr 1fr 40px', 
                    gap: 0, 
                    alignItems: 'center',
                    opacity: 0.6
                  }}>
                    <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                      <CheckSquare size={16} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <input
                      className="input"
                      style={{ width: '100%', fontSize: 13, background: 'var(--bg-secondary)', cursor: 'not-allowed', color: 'var(--accent-primary)', borderRadius: 0, margin: '-1px 0 0 -1px' }}
                      value={v.key}
                      disabled
                    />
                    <input
                      className="input"
                      style={{ width: '100%', fontSize: 13, background: 'var(--bg-secondary)', cursor: 'not-allowed', color: 'var(--text-tertiary)', borderRadius: 0, margin: '-1px 0 0 -1px' }}
                      value={v.desc}
                      disabled
                    />
                    <div style={{ width: 40 }}></div>
                  </div>
                ))}

                {currentVariables.map(v => (
                  <div key={v.id} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '40px 1fr 1fr 40px', 
                    gap: 0, 
                    alignItems: 'center',
                    opacity: v.enabled === false ? 0.45 : 1,
                  }}>
                    <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: v.enabled ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}
                        onClick={() => handleUpdateVariable(v.id, { enabled: !v.enabled })}
                        title={v.enabled ? 'Disable variable' : 'Enable variable'}
                      >
                        {v.enabled ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </div>
                    <VariableTextInput
                      className="input"
                      style={{ width: '100%', fontSize: 13, background: 'transparent', borderRadius: 0, margin: '-1px 0 0 -1px' }}
                      placeholder="Variable Key"
                      value={v.key}
                      onChange={(value) => handleUpdateVariable(v.id, { key: value })}
                    />
                    <VariableTextInput
                      className="input"
                      style={{ width: '100%', fontSize: 13, background: 'transparent', borderRadius: 0, margin: '-1px 0 0 -1px' }}
                      placeholder="Value"
                      value={v.value}
                      onChange={(value) => handleUpdateVariable(v.id, { value })}
                    />
                    <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                        onClick={() => handleDeleteVariable(v.id)}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--status-delete)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                        title="Remove Variable"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px',
                    border: '1px dashed var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    transition: 'all var(--transition-fast)',
                    marginTop: 12
                  }}
                  onClick={handleAddVariable}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-highlight)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Plus size={14} /> Add Variable
                </button>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                Select an environment or Globals to manage variables.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
