import type { MutableRefObject, ReactNode, RefObject, MouseEvent } from 'react';

export interface HoveredVariable {
  name: string;
  x: number;
  y: number;
  exists: boolean;
  hasValue: boolean;
  value?: string;
  source?: string;
}

interface AuthTokenInputProps {
  disabled: boolean;
  hideTimeout: MutableRefObject<any>;
  hoveredVar: HoveredVariable | null;
  label: string;
  overlayRef: RefObject<HTMLDivElement | null>;
  renderHighlighted: () => ReactNode;
  setHoveredVar: (value: HoveredVariable | null) => void;
  token: string;
  onChange: (token: string) => void;
}

export function AuthTokenInput(props: AuthTokenInputProps) {
  const { disabled, hideTimeout, hoveredVar, label, overlayRef, renderHighlighted, setHoveredVar, token, onChange } = props;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;

    const spans = overlayRef.current.querySelectorAll('.env-var-span');
    let found = false;

    for (let i = 0; i < spans.length; i++) {
      const span = spans[i] as HTMLSpanElement;
      const rect = span.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        found = true;
        const varName = span.getAttribute('data-varname') || '';
        const exists = span.getAttribute('data-exists') === 'true';
        const hasValue = span.getAttribute('data-has-value') === 'true';
        const value = span.getAttribute('data-value') || '';
        const source = span.getAttribute('data-source') || undefined;

        if (hoveredVar?.name !== varName || hoveredVar?.value !== value || hoveredVar?.hasValue !== hasValue) {
          clearTimeout(hideTimeout.current);
          setHoveredVar({ name: varName, x: rect.left, y: rect.bottom + 4, exists, hasValue, value, source });
        }
        break;
      }
    }

    if (!found && hoveredVar) hideTimeout.current = setTimeout(() => setHoveredVar(null), 150);
  };

  return (
    <>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
      <div
        style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          hideTimeout.current = setTimeout(() => setHoveredVar(null), 150);
        }}
      >
        <div
          ref={overlayRef}
          className="input font-mono"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            color: token ? 'var(--text-primary)' : 'var(--text-tertiary)',
            opacity: token ? 1 : 0.6,
            overflow: 'hidden',
            whiteSpace: 'pre',
            zIndex: 1,
            fontSize: 13,
            padding: '10px 14px'
          }}
          aria-hidden="true"
        >
          {token ? renderHighlighted() : 'e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6...'}
        </div>

        <input
          className="input font-mono"
          style={{
            width: '100%',
            fontSize: 13,
            padding: '10px 14px',
            color: 'transparent',
            caretColor: 'var(--text-primary)',
            background: 'transparent',
            zIndex: 2,
            cursor: disabled ? 'default' : 'text',
          }}
          value={token}
          onChange={(e) => {
            if (!disabled) onChange(e.target.value);
          }}
          onScroll={(e) => {
            if (overlayRef.current) overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
          }}
          readOnly={disabled}
          aria-disabled={disabled}
          spellCheck={false}
        />
      </div>
    </>
  );
}
