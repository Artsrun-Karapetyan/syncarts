import { useEffect, useRef } from 'react';

export function useKeyboardShortcuts(activeTabId: string | null, closeTab: (id: string) => void) {
  const activeTabIdRef = useRef(activeTabId);
  const closeTabRef = useRef(closeTab);

  useEffect(() => {
    activeTabIdRef.current = activeTabId;
    closeTabRef.current = closeTab;
  }, [activeTabId, closeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTabIdRef.current) {
          closeTabRef.current(activeTabIdRef.current);
          setTimeout(() => {
            window.focus();
            document.body.focus();
          }, 0);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        window.location.reload();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
