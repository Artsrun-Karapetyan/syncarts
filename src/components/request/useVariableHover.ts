import { useState, useRef, useEffect, RefObject } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { upsertActiveVariableValue } from './variableResolution';
import { upsertPathVariable } from '../../utils/pathVariables';
import { getRequestAncestors } from '../../contexts/workspace/requestHelpers';

export type HoveredUrlVariable = {
  kind: 'environment' | 'path';
  name: string;
  x: number;
  y: number;
  exists: boolean;
  hasValue: boolean;
  value?: string;
  source?: string;
};

export function useVariableHover(overlayRef: RefObject<HTMLElement | null>) {
  const {
    activeTab,
    updateActiveTab,
    activeEnvironmentId,
    activeEnvironment,
    updateEnvironment,
    collections,
    globalVariables,
    updateGlobalVariables,
    updateCollection,
    updateFolder,
    openCollectionTab,
    openFolderTab
  } = useWorkspace();

  const [hoveredVar, setHoveredVar] = useState<HoveredUrlVariable | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // const activeCollection = activeTab?.collectionId

  const ancestors = getRequestAncestors(activeTab, collections);
  const closestAncestor = ancestors.length > 0 ? ancestors[ancestors.length - 1] : undefined;

  const clearHideTimeout = () => {
    if (!hideTimeout.current) return;
    clearTimeout(hideTimeout.current);
    hideTimeout.current = null;
  };

  const scheduleHidePopover = () => {
    clearHideTimeout();
    hideTimeout.current = setTimeout(() => {
      setHoveredVar(null);
      hideTimeout.current = null;
    }, 120);
  };

  useEffect(() => clearHideTimeout, []);

  useEffect(() => {
    if (!hoveredVar) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (overlayRef.current?.parentElement?.contains(target)) return;
      setHoveredVar(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHoveredVar(null);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [hoveredVar, overlayRef]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!overlayRef.current) return;
    if (e.buttons !== 0) {
      if (hoveredVar) scheduleHidePopover();
      return;
    }
    
    const spans = overlayRef.current.querySelectorAll('.env-var-span, .path-var-span');
    let found = false;
    
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i] as HTMLSpanElement;
      const rect = span.getBoundingClientRect();
      
      if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        found = true;
        const varName = span.getAttribute('data-varname') || '';
        const kind = (span.getAttribute('data-kind') === 'path' ? 'path' : 'environment') as HoveredUrlVariable['kind'];
        const exists = span.getAttribute('data-exists') === 'true';
        const hasValue = span.getAttribute('data-has-value') === 'true';
        const value = span.getAttribute('data-value') || '';
        const source = span.getAttribute('data-source') || '';
        
        if (hoveredVar?.name !== varName || hoveredVar?.kind !== kind || hoveredVar?.hasValue !== hasValue) {
          clearHideTimeout();
          setHoveredVar({ kind, name: varName, x: rect.left, y: rect.bottom + 4, exists, hasValue, value, source });
        }
        break;
      }
    }
    
    if (!found && hoveredVar) scheduleHidePopover();
  };

  const handleMouseLeave = () => {
    if (hoveredVar) scheduleHidePopover();
  };

  const handleAddVar = (varName: string, value: string) => {
    if (hoveredVar?.kind === 'path') {
      updateActiveTab({ pathVariables: upsertPathVariable(activeTab?.pathVariables || [], varName, value) });
      setHoveredVar(null);
      return;
    }

    if (closestAncestor) {
      if ('type' in closestAncestor && closestAncestor.type === 'folder' && activeTab?.collectionId) {
        updateFolder(activeTab.collectionId, closestAncestor.id, { variables: upsertActiveVariableValue(closestAncestor.variables || [], varName, value) });
      } else {
        updateCollection(closestAncestor.id, { variables: upsertActiveVariableValue(closestAncestor.variables || [], varName, value) });
      }
      setHoveredVar(null);
      return;
    }

    if (activeEnvironmentId === 'globals') {
      updateGlobalVariables(upsertActiveVariableValue(globalVariables, varName, value));
      setHoveredVar(null);
      return;
    }

    if (!activeEnvironment) {
      alert("Please select an Environment or Globals first (top right corner).");
      return;
    }
    updateEnvironment(activeEnvironment.id, { variables: upsertActiveVariableValue(activeEnvironment.variables, varName, value) });
    setHoveredVar(null);
  };

  const handleAddCollectionVar = (varName: string, value: string) => {
    if (activeTab?.collectionId) {
      const collection = collections.find(c => c.id === activeTab.collectionId);
      if (collection) {
        updateCollection(collection.id, { variables: upsertActiveVariableValue(collection.variables || [], varName, value) });
      }
      setHoveredVar(null);
    }
  };

  const openCollectionVariables = () => {
    if (!closestAncestor || !activeTab?.collectionId) return;
    setHoveredVar(null);
    if ('type' in closestAncestor && closestAncestor.type === 'folder') {
      openFolderTab(activeTab.collectionId, closestAncestor.id);
      setTimeout(() => updateActiveTab({ collectionView: 'variables' }), 50);
    } else {
      openCollectionTab(closestAncestor.id, 'variables');
    }
  };

  const openPathVariables = () => {
    setHoveredVar(null);
    window.dispatchEvent(new CustomEvent('syncarts:open-request-tab', { detail: { tab: 'params' } }));
  };

  return {
    hoveredVar,
    popoverRef,
    closestAncestor,
    handleMouseMove,
    handleMouseLeave,
    handleAddVar,
    handleAddCollectionVar,
    clearHideTimeout,
    openCollectionVariables,
    openPathVariables
  };
}
