import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { importPostmanCollection, importPostmanEnvironment } from '../../utils/postmanParser';
import { parseCurlCommand } from '../../utils/curlParser';
import { ImportDuplicatePrompt, type DuplicateImportItem } from './ImportDuplicatePrompt';
import { ImportDropZone } from './ImportDropZone';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFile?: File | null;
}

type ImportStatus = 'idle' | 'success' | 'error';

export function ImportModal({ isOpen, onClose, initialFile }: ImportModalProps) {
  const { addTab, importCollection, updateCollection, createEnvironment, collections, environments } = useWorkspace();
  const [inputText, setInputText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const [duplicateItem, setDuplicateItem] = useState<DuplicateImportItem | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && initialFile) {
      readFile(initialFile);
    }
  }, [isOpen, initialFile]);

  if (!isOpen) return null;

  const handleClose = () => {
    setInputText('');
    setStatus('idle');
    setMessage('');
    setDuplicateItem(null);
    dragCounter.current = 0;
    setIsDragging(false);
    setIsProcessing(false);
    onClose();
  };

  const processContent = (content: string) => {
    try {
      const trimmed = content.trim();

      // 1. Try cURL
      if (trimmed.toLowerCase().startsWith('curl ')) {
        const parsedCurl = parseCurlCommand(trimmed);
        if (parsedCurl) {
          addTab({
            ...parsedCurl,
            name: 'Imported cURL',
            bodyType: parsedCurl.body ? 'raw' : 'none',
          });
          handleClose();
          return;
        }
      }

      // 2. Try JSON
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const data = JSON.parse(trimmed);

        // Check if it's an Environment
        if (data._postman_variable_scope === 'environment' || (data.name && Array.isArray(data.values))) {
          const envData = importPostmanEnvironment(trimmed);
          const envName = envData.name || 'Imported Environment';
          
          if (environments.some(e => e.name === envName)) {
            setDuplicateItem({
              type: 'environment',
              data: envData,
              originalName: envName,
              proposedName: `${envName} (Copy)`,
            });
            return;
          }

          createEnvironment(envName, envData.variables);
          handleClose();
          return;
        }

        // Check if it's a Collection
        if (data.info && data.info.name) {
          const collectionData = importPostmanCollection(trimmed);
          const existingCollection = collections.find(c => c.name === collectionData.name);
          if (existingCollection) {
            setDuplicateItem({
              type: 'collection',
              data: collectionData,
              originalName: collectionData.name,
              proposedName: `${collectionData.name} (Copy)`,
              existingId: existingCollection.id
            });
            return;
          }

          importCollection(collectionData);
          handleClose();
          return;
        }
      }

      throw new Error('Unrecognized format. Please provide valid cURL or Postman JSON.');
    } catch (err: any) {
      console.error('Import failed:', err);
      setStatus('error');
      setMessage(err.message || 'Failed to import data.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDuplicate = () => {
    if (!duplicateItem) return;
    
    if (duplicateItem.type === 'collection') {
      const newData = { ...duplicateItem.data, name: duplicateItem.proposedName };
      importCollection(newData);
    } else {
      createEnvironment(duplicateItem.proposedName, duplicateItem.data.variables);
    }
    
    handleClose();
  };

  const handleReplaceDuplicate = () => {
    if (!duplicateItem || duplicateItem.type !== 'collection' || !duplicateItem.existingId) return;
    updateCollection(duplicateItem.existingId, duplicateItem.data);
    handleClose();
  };

  const handlePasteOrSubmit = () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      processContent(inputText);
    }, 50);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const target = event.target;
      if (target && target.result) {
        setTimeout(() => {
          processContent(target.result as string);
        }, 50);
      } else {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => setIsProcessing(false);
    reader.readAsText(file);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={handleClose}
      />
      
      <div
        className="glass-panel animate-scale-in"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 600,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Import</h2>
          <button
            className="tooltip-trigger"
            data-tooltip="Close"
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              display: 'flex',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {duplicateItem ? (
            <ImportDuplicatePrompt
              duplicateItem={duplicateItem}
              onCancel={() => setDuplicateItem(null)}
              onChange={setDuplicateItem}
              onImportCopy={handleConfirmDuplicate}
              onReplace={handleReplaceDuplicate}
            />
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Paste cURL or Raw JSON
                </label>
                <textarea
                  className="input"
                  style={{
                    width: '100%',
                    height: 120,
                    padding: 12,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    resize: 'none',
                    borderRadius: 'var(--radius-md)',
                  }}
                  placeholder="Paste cURL command, Postman Collection, or Environment JSON..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handlePasteOrSubmit();
                    }
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-primary"
                    onClick={handlePasteOrSubmit}
                    disabled={!inputText.trim() || isProcessing}
                  >
                    {isProcessing ? 'Importing...' : 'Import Json'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>OR</div>
                <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
              </div>

              <ImportDropZone
                fileInputRef={fileInputRef}
                isDragging={isDragging}
                isProcessing={isProcessing}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleFileDrop}
                onFileSelect={handleFileSelect}
              />

              {status !== 'idle' && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    background: status === 'success' ? 'var(--status-get-bg)' : 'var(--status-delete-bg)',
                    color: status === 'success' ? 'var(--status-get)' : 'var(--status-delete)',
                  }}
                >
                  {status === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {message}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
