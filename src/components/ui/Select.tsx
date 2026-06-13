import { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  badge?: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'default' | 'ghost' | 'pill';
}

export function Select({ value, options, onChange, disabled, className = '', style, variant = 'default' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!isOpen || !btnRef.current) return;

    const updatePosition = () => {
      const rect = btnRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
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

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div 
      ref={containerRef} 
      className={`select-container ${className}`} 
      style={{ position: 'relative', ...style }}
    >
      <button
        ref={btnRef}
        type="button"
        className={variant === 'default' ? 'input' : ''}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          background: variant === 'ghost' ? (isOpen ? 'var(--bg-tertiary)' : 'transparent') : variant === 'pill' ? 'var(--bg-primary)' : (isOpen ? 'rgba(0, 0, 0, 0.6)' : undefined),
          border: variant === 'ghost' ? 'none' : variant === 'pill' ? `1px solid ${isOpen ? 'var(--border-highlight)' : 'var(--border-color)'}` : undefined,
          borderColor: variant === 'ghost' ? 'transparent' : variant === 'pill' ? (isOpen ? 'var(--border-highlight)' : 'var(--border-color)') : (isOpen ? 'var(--border-highlight)' : undefined),
          padding: variant === 'ghost' ? '6px 12px' : variant === 'pill' ? '0 16px' : undefined,
          height: variant === 'pill' ? 46 : undefined,
          borderRadius: variant === 'ghost' ? '8px' : variant === 'pill' ? '9999px' : undefined,
          fontSize: variant === 'ghost' ? '14px' : variant === 'pill' ? '13px' : undefined,
          fontWeight: variant === 'ghost' ? 600 : variant === 'pill' ? 600 : undefined,
          color: 'var(--text-primary)',
          outline: 'none',
          transition: 'all var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          if (variant === 'ghost' && !isOpen) e.currentTarget.style.background = 'var(--bg-tertiary)';
          if (variant === 'pill') e.currentTarget.style.borderColor = 'var(--border-highlight)';
        }}
        onMouseLeave={(e) => {
          if (variant === 'ghost' && !isOpen) e.currentTarget.style.background = 'transparent';
          if (variant === 'pill' && !isOpen) e.currentTarget.style.borderColor = 'var(--border-color)';
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
          {selectedOption?.label}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {selectedOption?.badge && (
            <span
              style={{
                flexShrink: 0,
                border: '1px solid rgba(99, 102, 241, 0.34)',
                borderRadius: 999,
                padding: '2px 10px',
                background: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--text-secondary)',
                fontSize: 10,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown size={variant === 'pill' ? 14 : 16} style={{ opacity: 0.6, transition: 'transform var(--transition-fast)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
        </span>
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="syncarts-select-dropdown animate-fade-in"
          style={{
            position: 'fixed',
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`,
            width: `${dropdownPos.width}px`,
            zIndex: 9999,
            background: 'rgba(15, 15, 15, 0.98)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-highlight)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              style={{
                padding: '8px 12px',
                fontSize: 13,
                color: option.value === value ? 'var(--accent-primary)' : 'var(--text-primary)',
                background: option.value === value ? 'var(--bg-tertiary)' : 'transparent',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              onMouseEnter={(e) => {
                if (option.value !== value) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                if (option.value !== value) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{option.label}</span>
                {option.badge && (
                  <span
                    style={{
                      flexShrink: 0,
                      border: '1px solid rgba(99, 102, 241, 0.34)',
                      borderRadius: 999,
                      padding: '2px 7px',
                      background: 'rgba(99, 102, 241, 0.12)',
                      color: 'var(--text-secondary)',
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {option.badge}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
