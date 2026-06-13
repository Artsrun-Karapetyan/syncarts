import { useEffect, useMemo, useState } from 'react';
import { Braces, ChevronDown, ChevronUp, Maximize2, Minimize2, Play, Search, WrapText } from 'lucide-react';

import { Select } from '../ui/Select';
import type { ResponseLanguage } from './responseLanguage';
import type { BodyFormat } from './responseTypes';

interface ResponseBodyToolbarProps {
  bodyFormat: BodyFormat;
  effectiveLanguage: ResponseLanguage;
  hasJsonBody: boolean;
  jsonCollapsed: number | false;
  searchText: string;
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
    searchText,
    wrapLines,
    onBodyFormatChange,
    onJsonCollapsedChange,
    onLanguageChange,
    onWrapLinesChange
  } = props;

  const [searchQuery, setSearchQuery] = useState('');
  const matchCount = useMemo(() => countMatches(searchText, searchQuery), [searchText, searchQuery]);
  const [currentMatch, setCurrentMatch] = useState(0);

  useEffect(() => {
    setCurrentMatch(0);
  }, [matchCount, searchQuery]);

  const handleSearch = (forward: boolean) => {
    if (!searchQuery || matchCount === 0) return;
    // window.find(aString, aCaseSensitive, aBackwards, aWrapAround)
    (window as any).find(searchQuery, false, !forward, true, false, false, false);
    setCurrentMatch(prev => getNextMatchIndex(prev, matchCount, forward));
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
          {searchQuery && (
            <span style={{ minWidth: 38, textAlign: 'right', fontSize: 11, color: matchCount ? 'var(--text-secondary)' : 'var(--status-delete)', fontFamily: 'var(--font-mono)' }}>
              {currentMatch}/{matchCount}
            </span>
          )}
          <button disabled={!matchCount} onClick={() => handleSearch(false)} style={{ background: 'transparent', border: 'none', padding: 2, cursor: matchCount ? 'pointer' : 'not-allowed', color: 'var(--text-tertiary)', opacity: matchCount ? 1 : 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Previous (Shift+Enter)">
            <ChevronUp size={12} />
          </button>
          <button disabled={!matchCount} onClick={() => handleSearch(true)} style={{ background: 'transparent', border: 'none', padding: 2, cursor: matchCount ? 'pointer' : 'not-allowed', color: 'var(--text-tertiary)', opacity: matchCount ? 1 : 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Next (Enter)">
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

function countMatches(text: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return 0;

  const normalizedText = text.toLowerCase();
  let count = 0;
  let index = 0;

  while (index < normalizedText.length) {
    const foundIndex = normalizedText.indexOf(normalizedQuery, index);
    if (foundIndex === -1) break;
    count += 1;
    index = foundIndex + normalizedQuery.length;
  }

  return count;
}

function getNextMatchIndex(current: number, total: number, forward: boolean) {
  if (total === 0) return 0;
  if (current === 0) return forward ? 1 : total;
  return forward
    ? (current % total) + 1
    : ((current + total - 2) % total) + 1;
}
