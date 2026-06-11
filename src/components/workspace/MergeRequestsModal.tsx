import { useState, useEffect } from 'react';
import { X, GitPullRequest, CheckCircle2, CircleDashed, GitMerge } from 'lucide-react';
import { api } from '../../lib/api';
import { useWorkspace } from '../../contexts/WorkspaceContext';

interface MergeRequestsModalProps {
  isOpen: boolean;
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function MergeRequestsModal({ isOpen, onClose, workspaceId }: MergeRequestsModalProps) {
  const [mrs, setMrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMr, setSelectedMr] = useState<any | null>(null);
  const [sourceCollection, setSourceCollection] = useState<any | null>(null);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { collections, updateCollection } = useWorkspace();

  useEffect(() => {
    if (isOpen) {
      fetchMrs();
    } else {
      setMrs([]);
      setSelectedMr(null);
      setSourceCollection(null);
      setError(null);
    }
  }, [isOpen, workspaceId]);

  const fetchMrs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/merge-requests/workspace/${workspaceId}`);
      setMrs(res.data);
    } catch (err) {
      console.error('Failed to fetch MRs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMr = async (mr: any) => {
    setSelectedMr(mr);
    setSourceCollection(null);
    setError(null);
    if (mr.status === 'OPEN') {
      try {
        const res = await api.get(`/merge-requests/${mr.id}/source-collection`);
        setSourceCollection(res.data);
      } catch (err) {
        console.error('Failed to fetch source collection:', err);
        setError('Could not load changes. The source workspace might have been deleted, or it was created before snapshots were added.');
      }
    }
  };

  const handleMerge = async () => {
    if (!selectedMr || !sourceCollection) return;
    setError(null);
    
    // Check if target collection still exists
    const targetCol = collections.find(c => c.id === selectedMr.targetCollectionId);
    if (!targetCol) {
      setError('The target collection no longer exists in this workspace!');
      return;
    }

    try {
      setMerging(true);
      
      // Update the collection in the frontend context (this will automatically sync to backend)
      updateCollection(selectedMr.targetCollectionId, {
        items: sourceCollection.items,
        variables: sourceCollection.variables,
        authType: sourceCollection.authType,
        bearerToken: sourceCollection.bearerToken,
        preRequestScript: sourceCollection.preRequestScript,
        testScript: sourceCollection.testScript
      });

      // Update MR status
      await api.patch(`/merge-requests/${selectedMr.id}/status`, { status: 'MERGED' });
      
      // Refresh list
      await fetchMrs();
      setSelectedMr(null);
      
    } catch (err) {
      console.error('Merge failed:', err);
      setError('Merge failed! Check console for details.');
    } finally {
      setMerging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', animation: 'fade-in 0.2s ease-out'
    }}>
      <div style={{
        width: 800, height: 600, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        borderRadius: 12, boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(176, 0, 255, 0.1)', color: '#b000ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GitPullRequest size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Merge Requests</h2>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Review and merge changes proposed by other users</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* MR List */}
          <div style={{ width: 300, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            {loading ? (
              <div style={{ padding: 20, color: 'var(--text-tertiary)', textAlign: 'center', fontSize: 13 }}>Loading...</div>
            ) : mrs.length === 0 ? (
              <div style={{ padding: 20, color: 'var(--text-tertiary)', textAlign: 'center', fontSize: 13 }}>No merge requests found.</div>
            ) : (
              <div style={{ overflow: 'auto', flex: 1 }}>
                {mrs.map(mr => (
                  <div
                    key={mr.id}
                    onClick={() => handleSelectMr(mr)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      background: selectedMr?.id === mr.id ? 'var(--bg-tertiary)' : 'transparent',
                      transition: 'background var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {mr.status === 'MERGED' ? <GitMerge size={14} style={{ color: '#b000ff' }} /> :
                       mr.status === 'CLOSED' ? <X size={14} style={{ color: 'var(--status-error)' }} /> :
                       <GitPullRequest size={14} style={{ color: 'var(--status-success)' }} />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{mr.title}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>By {mr.author?.name} • {new Date(mr.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MR Details */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', overflow: 'auto' }}>
            {selectedMr ? (
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{selectedMr.title}</h3>
                  <div style={{ 
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: selectedMr.status === 'MERGED' ? 'rgba(176, 0, 255, 0.1)' : selectedMr.status === 'OPEN' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
                    color: selectedMr.status === 'MERGED' ? '#b000ff' : selectedMr.status === 'OPEN' ? 'var(--status-success)' : 'var(--status-error)'
                  }}>
                    {selectedMr.status}
                  </div>
                </div>
                
                {selectedMr.description && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, padding: 16, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                    {selectedMr.description}
                  </div>
                )}

                {selectedMr.status === 'OPEN' && (
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', fontSize: 13, fontWeight: 600 }}>
                      Changes to be merged
                    </div>
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {error && (
                        <div style={{ background: 'var(--status-error-bg)', color: 'var(--status-error)', padding: '10px 14px', borderRadius: 6, fontSize: 13, border: '1px solid var(--status-error)' }}>
                          {error}
                        </div>
                      )}
                      
                      {!sourceCollection && !error ? (
                        <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Loading changes...</div>
                      ) : sourceCollection ? (
                        (() => {
                          const targetCol = collections.find(c => c.id === selectedMr.targetCollectionId);
                          if (!targetCol) return <div style={{ color: 'var(--status-error)' }}>Target collection not found!</div>;

                          // Simple recursive flattener
                          const flattenItems = (items: any[]): any[] => {
                            let flat: any[] = [];
                            for (const item of items) {
                              if (item.type === 'folder') {
                                flat.push({ ...item, items: undefined });
                                if (item.items) flat = flat.concat(flattenItems(item.items));
                              } else {
                                flat.push(item);
                              }
                            }
                            return flat;
                          };

                          const targetFlat = flattenItems(targetCol.items || []);
                          const sourceFlat = flattenItems(sourceCollection.items || []);

                          const added = sourceFlat.filter(s => !targetFlat.find(t => t.id === s.id));
                          const deleted = targetFlat.filter(t => !sourceFlat.find(s => s.id === t.id));
                          const modified = sourceFlat.filter(s => {
                            const t = targetFlat.find(t => t.id === s.id);
                            if (!t) return false;
                            // Simple diff, strip fields that might change naturally
                            const sCompare = { ...s, updatedAt: undefined, parentId: undefined };
                            const tCompare = { ...t, updatedAt: undefined, parentId: undefined };
                            return JSON.stringify(sCompare) !== JSON.stringify(tCompare);
                          });

                          return (
                            <>
                              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                <div style={{ flex: 1, background: 'var(--bg-primary)', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--status-success)', marginBottom: 8, textTransform: 'uppercase' }}>Added ({added.length})</div>
                                  {added.length === 0 ? <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No new items</div> : null}
                                  {added.map(item => (
                                    <div key={item.id} style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{ color: 'var(--status-success)' }}>+</span> {item.name || item.url}
                                    </div>
                                  ))}
                                </div>
                                <div style={{ flex: 1, background: 'var(--bg-primary)', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--status-warning)', marginBottom: 8, textTransform: 'uppercase' }}>Modified ({modified.length})</div>
                                  {modified.length === 0 ? <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No modified items</div> : null}
                                  {modified.map(item => (
                                    <div key={item.id} style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{ color: 'var(--status-warning)' }}>~</span> {item.name || item.url}
                                    </div>
                                  ))}
                                </div>
                                <div style={{ flex: 1, background: 'var(--bg-primary)', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--status-error)', marginBottom: 8, textTransform: 'uppercase' }}>Deleted ({deleted.length})</div>
                                  {deleted.length === 0 ? <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No deleted items</div> : null}
                                  {deleted.map(item => (
                                    <div key={item.id} style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{ color: 'var(--status-error)' }}>-</span> {item.name || item.url}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <button
                                onClick={handleMerge}
                                disabled={merging}
                                style={{
                                  background: 'linear-gradient(135deg, #b000ff 0%, #00f0ff 100%)',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '10px 16px',
                                  borderRadius: 6,
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: merging ? 'not-allowed' : 'pointer',
                                  opacity: merging ? 0.7 : 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 8,
                                  width: 'fit-content'
                                }}
                              >
                                <GitMerge size={16} />
                                {merging ? 'Merging...' : 'Approve & Merge'}
                              </button>
                            </>
                          );
                        })()
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                Select a merge request to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
