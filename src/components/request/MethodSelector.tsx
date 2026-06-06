import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

export function MethodSelector() {
  const { activeTab, updateActiveTab } = useWorkspace();
  const method = activeTab?.method || 'GET';
  
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!isOpen || !btnRef.current) return;

    const updatePosition = () => {
      const rect = btnRef.current?.getBoundingClientRect();
      if (!rect) return;

      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
      });
    };

    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        ref.current && !ref.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((open) => !open);
  };

  const getMethodColor = (m: string) => `text-status-${m.toLowerCase()}`;

  return (
    <div className="relative" ref={ref}>
      <button 
        ref={btnRef}
        type="button"
        className={`input bg-transparent border-transparent font-bold cursor-pointer w-28 h-10 text-sm focus:border-transparent focus:shadow-none flex items-center justify-center gap-2 ${getMethodColor(method)}`}
        onClick={handleToggle}
        disabled={!activeTab}
      >
        <span>{method}</span>
        <span className="text-[10px] opacity-50 text-secondary">▼</span>
      </button>
      
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed w-32 bg-secondary border border-color rounded-md shadow-lg flex flex-col p-1 z-50"
          style={{
            position: 'fixed',
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`,
          }}
        >
          {METHODS.map(m => (
            <div 
              key={m}
              className={`p-2 text-sm font-bold cursor-pointer hover:bg-tertiary rounded transition-fast text-center ${getMethodColor(m)} ${method === m ? 'bg-tertiary' : ''}`}
              onClick={() => {
                updateActiveTab({ method: m });
                setIsOpen(false);
              }}
            >
              {m}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
