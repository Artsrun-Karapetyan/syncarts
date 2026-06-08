import React, { useState, useRef } from 'react';
import { X, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { importPostmanCollection, importPostmanEnvironment } from '../../utils/postmanParser';
import { parseCurlCommand } from '../../utils/curlParser';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportStatus = 'idle' | 'success' | 'error';

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const { addTab, importCollection, createEnvironment } = useWorkspace();
  const [inputText, setInputText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  if (!isOpen) return null;

  const handleClose = () => {
    setInputText('');
    setStatus('idle');
    setMessage('');
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
          showSuccess('cURL imported successfully as a new request.');
          return;
        }
      }

      // 2. Try JSON
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const data = JSON.parse(trimmed);

        // Check if it's an Environment
        if (data._postman_variable_scope === 'environment' || (data.name && Array.isArray(data.values))) {
          const envData = importPostmanEnvironment(trimmed);
          createEnvironment(envData.name || 'Imported Environment', envData.variables);
          showSuccess(`Environment "${envData.name}" imported successfully.`);
          return;
        }

        // Check if it's a Collection
        if (data.info && data.info.name) {
          const collectionData = importPostmanCollection(trimmed);
          importCollection(collectionData);
          showSuccess(`Collection "${collectionData.name}" imported successfully.`);
          return;
        }
      }

      throw new Error('Unrecognized format. Please provide valid cURL or Postman JSON.');
    } catch (err: any) {
      console.error('Import failed:', err);
      setStatus('error');
      setMessage(err.message || 'Failed to import data.');
    }
  };

  const showSuccess = (msg: string) => {
    setStatus('success');
    setMessage(msg);
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  const handlePasteOrSubmit = () => {
    if (!inputText.trim()) return;
    processContent(inputText);
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
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        processContent(event.target.result as string);
      }
    };
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
                disabled={!inputText.trim()}
              >
                Import Text
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>OR</div>
            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
          </div>

          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)',
              padding: 48,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              background: isDragging ? 'var(--bg-tertiary)' : 'transparent',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <UploadCloud size={32} style={{ color: isDragging ? 'var(--accent-primary)' : 'var(--text-tertiary)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Drop files here or click to browse</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Supports Postman Collection (.json) and Environment (.json)</div>
            </div>
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
          </div>

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

        </div>
      </div>
    </div>
  );
}
