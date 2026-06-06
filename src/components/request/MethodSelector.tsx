import { useState, useRef, useEffect } from 'react';
import { useRequest } from '../../contexts/RequestContext';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

export function MethodSelector() {
  const { method, setMethod } = useRequest();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getMethodColor = (m: string) => `text-status-${m.toLowerCase()}`;

  return (
    <div className="relative" ref={ref}>
      <button 
        className={`input bg-transparent border-transparent font-bold cursor-pointer w-28 h-10 text-sm focus:border-transparent focus:shadow-none flex items-center justify-center gap-2 ${getMethodColor(method)}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{method}</span>
        <span className="text-[10px] opacity-50 text-secondary">▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-32 bg-secondary border border-color rounded-md shadow-lg flex flex-col p-1 z-50">
          {METHODS.map(m => (
            <div 
              key={m}
              className={`p-2 text-sm font-bold cursor-pointer hover:bg-tertiary rounded transition-fast text-center ${getMethodColor(m)} ${method === m ? 'bg-tertiary' : ''}`}
              onClick={() => {
                setMethod(m);
                setIsOpen(false);
              }}
            >
              {m}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
