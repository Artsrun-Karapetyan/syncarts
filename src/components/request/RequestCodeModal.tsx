import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, X } from 'lucide-react';

import { useWorkspace } from '../../contexts/WorkspaceContext';
import { generateCurlCommand } from '../../utils/curlGenerator';

interface RequestCodeModalProps {
  onClose: () => void;
}

export function RequestCodeModal({ onClose }: RequestCodeModalProps) {
  const { activeEnvironment, activeTab, collections, globalVariables } = useWorkspace();
  const [copied, setCopied] = useState(false);
  const curlCommand = useMemo(() => {
    if (!activeTab) return '';
    return generateCurlCommand({ activeEnvironment, collections, globalVariables, request: activeTab });
  }, [activeEnvironment, activeTab, collections, globalVariables]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
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
          background: 'rgba(0, 0, 0, 0.62)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />
      <div
        className="glass-panel animate-scale-in"
        style={{
          position: 'relative',
          width: 'min(780px, calc(100vw - 40px))',
          maxHeight: 'min(680px, calc(100vh - 40px))',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(12, 12, 12, 0.98)',
          border: '1px solid var(--border-highlight)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Code</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Generated cURL for the current request.</div>
          </div>
          <button className="btn" style={{ padding: 8 }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>cURL</span>
            <button className="btn btn-primary" style={{ height: 32, fontSize: 12 }} onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <textarea
            className="input font-mono"
            readOnly
            value={curlCommand}
            style={{
              minHeight: 360,
              resize: 'none',
              padding: 16,
              fontSize: 13,
              lineHeight: 1.7,
              color: 'var(--text-primary)',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
