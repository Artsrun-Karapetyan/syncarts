import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Select({ value, options, onChange, disabled, className = '', style }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div 
      ref={containerRef} 
      className={`select-container ${className}`} 
      style={{ position: 'relative', ...style }}
    >
      <button
        type="button"
        className="input"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          background: isOpen ? 'rgba(0, 0, 0, 0.6)' : undefined,
          borderColor: isOpen ? 'var(--border-highlight)' : undefined,
        }}
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown size={14} style={{ opacity: 0.6, transition: 'transform var(--transition-fast)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>

      {isOpen && (
        <div
          className="animate-fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 50,
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
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
