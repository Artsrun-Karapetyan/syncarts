import { useState } from 'react';
import { Braces, ChevronDown, ChevronUp, Maximize2, Minimize2, Play, Search, WrapText } from 'lucide-react';

import { Select } from '../ui/Select';
import type { ResponseLanguage } from './responseLanguage';
import type { BodyFormat } from './responseTypes';

interface ResponseBodyToolbarProps {
  bodyFormat: BodyFormat;
  effectiveLanguage: ResponseLanguage;
  hasJsonBody: boolean;
  jsonCollapsed: number | false;
  wrapLines: boolean;
  onBodyFormatChange: (format: BodyFormat) => void;
  onJsonCollapsedChange: (collapsed: number | false | ((prev: number | false) => number | false)) => void;
  onLanguageChange: (language: ResponseLanguage) => void;
  onWrapLinesChange: (wrapLines: boolean | ((prev: boolean) => boolean)) => void;
}

export function ResponseBodyToolbar(props: ResponseBodyToolbarProps) {
  const {
    bodyFormat,
    effectiveLanguage,
    hasJsonBody,
    jsonCollapsed,
    wrapLines,
    onBodyFormatChange,
    onJsonCollapsedChange,
    onLanguageChange,
    onWrapLinesChange
  } = props;

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (forward: boolean) => {
    if (!searchQuery) return;
    // window.find(aString, aCaseSensitive, aBackwards, aWrapAround)
    (window as any).find(searchQuery, false, !forward, true, false, false, false);
  };

  return (
    <div className="response-body-toolbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="response-language-icon"><Braces size={13} /></div>
          <Select
            value={effectiveLanguage}
            options={[
              { value: 'json', label: 'JSON' },
              { value: 'xml', label: 'XML' },
              { value: 'html', label: 'HTML' },
              { value: 'text', label: 'Text' },
            ]}
            onChange={(val) => onLanguageChange(val as ResponseLanguage)}
            variant="ghost"
            style={{ paddingLeft: 24, paddingRight: 4, minWidth: 80 }}
          />
        </div>

        <div className="response-toolbar-divider" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className={formatButtonClass(bodyFormat === 'pretty')} onClick={() => onBodyFormatChange('pretty')}>Pretty</button>
          <button className={formatButtonClass(bodyFormat === 'raw')} onClick={() => onBodyFormatChange('raw')}>Raw</button>
          <button className={formatButtonClass(bodyFormat === 'preview')} onClick={() => onBodyFormatChange('preview')}>
            <Play size={11} fill={bodyFormat === 'preview' ? 'currentColor' : 'none'} /> Preview
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', borderRadius: 6, padding: '2px 6px', height: 24, border: '1px solid var(--border-color)' }}>
          <Search size={11} color="var(--text-tertiary)" style={{ marginRight: 6 }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(!e.shiftKey);
              }
            }}
            placeholder="Search..."
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 11,
              outline: 'none',
              width: 120,
            }}
          />
          <button onClick={() => handleSearch(false)} style={{ background: 'transparent', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Previous (Shift+Enter)">
            <ChevronUp size={12} />
          </button>
          <button onClick={() => handleSearch(true)} style={{ background: 'transparent', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Next (Enter)">
            <ChevronDown size={12} />
          </button>
        </div>

        {hasJsonBody && bodyFormat === 'pretty' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className={toolButtonClass(wrapLines)} onClick={() => onWrapLinesChange(prev => !prev)}>
              <WrapText size={11} />
              {wrapLines ? 'Unwrap Lines' : 'Wrap Lines'}
            </button>
            <button className="response-tool-button" onClick={() => onJsonCollapsedChange(prev => prev === false ? 1 : false)}>
              {jsonCollapsed === false ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
              {jsonCollapsed === false ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatButtonClass(isActive: boolean) {
  return `response-format-button ${isActive ? 'active' : ''}`;
}

function toolButtonClass(isActive: boolean) {
  return `response-tool-button ${isActive ? 'active' : ''}`;
}
