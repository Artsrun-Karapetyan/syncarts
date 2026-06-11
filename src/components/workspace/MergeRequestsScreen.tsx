import { useState, useEffect } from 'react';
import { GitPullRequest, GitMerge, ArrowLeft, Ban } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { api } from '../../lib/api';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export function MergeRequestsScreen() {
  const [mrs, setMrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMr, setSelectedMr] = useState<any | null>(null);
  const [sourceCollection, setSourceCollection] = useState<any | null>(null);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { collections, updateCollection, activeWorkspaceId } = useWorkspace();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeWorkspaceId) {
      fetchMrs();
    }
  }, [activeWorkspaceId]);

  const fetchMrs = async () => {
    if (!activeWorkspaceId) return;
    try {
      setLoading(true);
      const res = await api.get(`/merge-requests/workspace/${activeWorkspaceId}`);
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
    
    const targetCol = collections.find(c => c.id === selectedMr.targetCollectionId);
    if (!targetCol) {
      setError('The target collection no longer exists in this workspace!');
      return;
    }

    try {
      setMerging(true);
      updateCollection(selectedMr.targetCollectionId, {
        items: sourceCollection.items,
        variables: sourceCollection.variables,
        authType: sourceCollection.authType,
        bearerToken: sourceCollection.bearerToken,
        preRequestScript: sourceCollection.preRequestScript,
        testScript: sourceCollection.testScript
      });

      await api.patch(`/merge-requests/${selectedMr.id}/status`, { status: 'MERGED' });
      await fetchMrs();
      setSelectedMr(null);
      
    } catch (err) {
      console.error('Merge failed:', err);
      setError('Merge failed! Check console for details.');
    } finally {
      setMerging(false);
    }
  };

  const handleReject = async () => {
    if (!selectedMr) return;
    setError(null);
    try {
      setMerging(true);
      await api.patch(`/merge-requests/${selectedMr.id}/status`, { status: 'REJECTED' });
      await fetchMrs();
      setSelectedMr(null);
    } catch (err) {
      console.error('Reject failed:', err);
      setError('Failed to reject merge request.');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-secondary)' }}>
      <style>{`
        .mr-btn {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .mr-btn:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }
        .mr-btn.mr-btn-approve {
          background: rgba(0, 255, 170, 0.1) !important;
          color: var(--status-success) !important;
          border: 1px solid rgba(0, 255, 170, 0.3) !important;
        }
        .mr-btn.mr-btn-approve:hover:not(:disabled) {
          background: rgba(0, 255, 170, 0.25) !important;
          border: 1px solid #00ffaa !important;
          box-shadow: 0 4px 12px rgba(0, 255, 170, 0.2) !important;
        }
        .mr-btn.mr-btn-reject {
          background: rgba(255, 80, 80, 0.1) !important;
          color: #ff5050 !important;
          border: 1px solid rgba(255, 80, 80, 0.3) !important;
        }
        .mr-btn.mr-btn-reject:hover:not(:disabled) {
          background: rgba(255, 80, 80, 0.25) !important;
          border-color: #ff5050 !important;
          box-shadow: 0 4px 12px rgba(255, 80, 80, 0.15) !important;
        }
      `}</style>

      {/* Top Bar */}
      <div className="topbar" data-tauri-drag-region style={{
        display: 'flex', alignItems: 'center', padding: '0 20px', height: 48, borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)'
      } as React.CSSProperties}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate({ to: '/' })}
            data-tauri-drag-region="false"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
              borderRadius: 6, color: 'var(--text-secondary)', cursor: 'pointer', WebkitAppRegion: 'no-drag'
            } as React.CSSProperties}
          >
            <ArrowLeft size={14} /> Back to Workspace
          </button>
          <div style={{ width: 1, height: 24, background: 'var(--border-color)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <GitPullRequest size={16} style={{ color: '#b000ff' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Merge Requests</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar List */}
        <div style={{ width: 320, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
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
                    padding: '16px',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    background: selectedMr?.id === mr.id ? 'var(--bg-tertiary)' : 'transparent',
                    transition: 'background var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {mr.status === 'MERGED' ? <GitMerge size={16} style={{ color: '#00ffaa' }} /> :
                       mr.status === 'REJECTED' ? <Ban size={16} style={{ color: '#ff5050' }} /> :
                       <GitPullRequest size={16} style={{ color: '#00f0ff' }} />}
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{mr.title}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>By {mr.author?.name}</span>
                    <span>{new Date(mr.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details View */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {selectedMr ? (
            <div style={{ padding: 40, width: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{selectedMr.title}</h3>
                <div style={{ 
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                  background: selectedMr.status === 'MERGED' ? 'rgba(0, 255, 170, 0.1)' : selectedMr.status === 'REJECTED' ? 'rgba(255, 80, 80, 0.1)' : 'rgba(0, 240, 255, 0.1)',
                  color: selectedMr.status === 'MERGED' ? '#00ffaa' : selectedMr.status === 'REJECTED' ? '#ff5050' : '#00f0ff'
                }}>
                  {selectedMr.status}
                </div>
              </div>
              
              {selectedMr.description && (
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32, padding: 20, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                  {selectedMr.description}
                </div>
              )}

              {selectedMr.status === 'OPEN' && (
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-primary)' }}>
                  <div style={{ padding: '16px 20px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', fontSize: 14, fontWeight: 600 }}>
                    Changes to be merged
                  </div>
                  <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {error && (
                      <div style={{ background: 'rgba(255, 80, 80, 0.1)', color: '#ff5050', padding: '12px 16px', borderRadius: 8, fontSize: 14, border: '1px solid #ff5050' }}>
                        {error}
                      </div>
                    )}
                    
                    {!sourceCollection && !error ? (
                      <div style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Loading changes...</div>
                    ) : sourceCollection ? (
                      (() => {
                        const targetCol = collections.find(c => c.id === selectedMr.targetCollectionId);
                        if (!targetCol) return <div style={{ color: '#ff5050' }}>Target collection not found!</div>;

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
                        const modified = sourceFlat.map(s => {
                          const t = targetFlat.find(t => t.id === s.id);
                          if (!t) return null;
                          const sCompare = { ...s, updatedAt: undefined, parentId: undefined, changedKeys: undefined };
                          const tCompare = { ...t, updatedAt: undefined, parentId: undefined, changedKeys: undefined };
                          const isDiff = JSON.stringify(sCompare) !== JSON.stringify(tCompare);
                          if (isDiff) {
                            const changedKeys = Object.keys(sCompare).filter(key => 
                              key !== 'changedKeys' && JSON.stringify(sCompare[key]) !== JSON.stringify(tCompare[key])
                            );
                            return { ...s, changedKeys };
                          }
                          return null;
                        }).filter(Boolean);

                        const allChanges = [
                          ...added.map(item => ({ ...item, diffType: 'added', diffSymbol: '+', diffColor: '#00ffaa' })),
                          ...modified.map(item => ({ ...item, diffType: 'modified', diffSymbol: '~', diffColor: '#ffaa00' })),
                          ...deleted.map(item => ({ ...item, diffType: 'deleted', diffSymbol: '-', diffColor: '#ff5050' }))
                        ];

                        const renderDiffItem = (item: any, symbol: string, color: string, idx: number) => (
                          <div key={`${item.id}-${idx}`} style={{ 
                            fontSize: 14, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12,
                            background: 'var(--bg-secondary)', padding: '10px 16px', borderRadius: 8, border: `1px solid ${color}33`,
                            borderLeft: `4px solid ${color}`
                          }}>
                            <span style={{ color, fontWeight: 800, width: 14, textAlign: 'center', fontSize: 16 }}>{symbol}</span>
                            {item.type === 'folder' ? (
                              <span style={{ color: 'var(--text-tertiary)', fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-tertiary)' }}>FOLDER</span>
                            ) : (
                              <span style={{ 
                                fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 4, 
                                color: item.method === 'GET' ? 'var(--method-get)' : item.method === 'POST' ? 'var(--method-post)' : item.method === 'PUT' ? 'var(--method-put)' : item.method === 'DELETE' ? 'var(--method-delete)' : 'var(--text-tertiary)',
                                background: item.method === 'GET' ? 'var(--method-get-bg)' : item.method === 'POST' ? 'var(--method-post-bg)' : item.method === 'PUT' ? 'var(--method-put-bg)' : item.method === 'DELETE' ? 'var(--method-delete-bg)' : 'var(--bg-tertiary)'
                              }}>
                                {item.method || 'REQ'}
                              </span>
                            )}
                            <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.name || item.url || 'Untitled Request'}</span>
                            {item.diffType === 'modified' && item.changedKeys && (
                              <div style={{ display: 'flex', gap: 6 }}>
                                {item.changedKeys.map((key: string) => (
                                  <span key={key} style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(255, 170, 0, 0.15)', color: '#ffaa00', borderRadius: 12, textTransform: 'uppercase', fontWeight: 700 }}>
                                    {key === 'queryParams' ? 'Query' : key}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );

                        return (
                          <>
                            <div style={{ display: 'flex', gap: 24, marginBottom: 16, padding: '0 8px' }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#00ffaa' }}>{added.length} Added</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#ffaa00' }}>{modified.length} Modified</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#ff5050' }}>{deleted.length} Deleted</span>
                            </div>

                            <div style={{ background: 'var(--bg-primary)', padding: 16, borderRadius: 10, border: '1px solid var(--border-color)', marginBottom: 24, maxHeight: 500, overflowY: 'auto' }}>
                              {allChanges.length === 0 ? <div style={{ fontSize: 14, color: 'var(--text-tertiary)', textAlign: 'center', padding: 40 }}>No changes found</div> : null}
                              {allChanges.map((item, idx) => renderDiffItem(item, item.diffSymbol, item.diffColor, idx))}
                            </div>

                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start' }}>
                              <button
                                className="mr-btn mr-btn-approve"
                                onClick={handleMerge}
                                disabled={merging}
                              >
                                <GitMerge size={18} />
                                {merging ? 'Processing...' : 'Approve & Merge'}
                              </button>
                              
                              <button
                                className="mr-btn mr-btn-reject"
                                onClick={handleReject}
                                disabled={merging}
                              >
                                <Ban size={18} />
                                <span>Reject</span>
                              </button>
                            </div>
                          </>
                        );
                      })()
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 15, flexDirection: 'column', gap: 16 }}>
              <GitPullRequest size={48} style={{ opacity: 0.2 }} />
              Select a merge request from the sidebar to review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
