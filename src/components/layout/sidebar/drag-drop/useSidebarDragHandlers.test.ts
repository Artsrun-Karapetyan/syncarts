import { describe, expect, test, mock, beforeEach } from "bun:test";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useSidebarDragHandlers } from "./useSidebarDragHandlers";
import { SIDEBAR_DRAG_DATA_TYPE } from "./sidebarDragHelpers";

describe("useSidebarDragHandlers", () => {
  const defaultArgs = {
    collectionSearch: "",
    moveSidebarItem: mock(),
    setCtxMenu: mock(),
    setExpandedCollections: mock(),
    setExpandedFolders: mock(),
  };

  beforeEach(() => {
    defaultArgs.moveSidebarItem.mockClear();
    defaultArgs.setCtxMenu.mockClear();
    defaultArgs.setExpandedCollections.mockClear();
    defaultArgs.setExpandedFolders.mockClear();
  });

  test("disables drag if search is active", () => {
    const { result } = renderHook(() => useSidebarDragHandlers({ ...defaultArgs, collectionSearch: "test" }));
    expect(result.current.canDrag).toBe(false);
  });

  const createEvent = (props = {}) => ({
    preventDefault: mock(),
    stopPropagation: mock(),
    dataTransfer: {
      setData: mock(),
      getData: mock(),
    },
    ...props,
  } as any);

  test("handles drag start", () => {
    const { result } = renderHook(() => useSidebarDragHandlers(defaultArgs));
    const event = createEvent();
    const entity = { type: "folder" as const, collectionId: "c1", itemId: "f1" };
    
    act(() => {
      result.current.onDragStart(entity, event);
    });

    expect(defaultArgs.setCtxMenu).toHaveBeenCalledWith(null);
    expect(result.current.draggingEntity).toEqual(entity);
  });

  test("handles drag start ignored if disabled", () => {
    const { result } = renderHook(() => useSidebarDragHandlers({ ...defaultArgs, collectionSearch: "t" }));
    const event = createEvent();
    
    act(() => {
      result.current.onDragStart({} as any, event);
    });

    expect(defaultArgs.setCtxMenu).not.toHaveBeenCalled();
    expect(result.current.draggingEntity).toBeNull();
  });

  test("handles drag over", () => {
    const { result } = renderHook(() => useSidebarDragHandlers(defaultArgs));
    const event = createEvent({ clientY: 50, currentTarget: { getBoundingClientRect: () => ({ top: 0, height: 100 }) } });
    const entity = { type: "folder" as const, collectionId: "c1", itemId: "f1" };
    const target = { type: "folder" as const, collectionId: "c1", itemId: "f2" };
    
    act(() => {
      result.current.onDragStart(entity, event);
    });
    
    act(() => {
      result.current.onDragOver(target, event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(result.current.dropTarget).toEqual({ ...target, position: "inside" });
  });

  test("handles drop", () => {
    const { result } = renderHook(() => useSidebarDragHandlers(defaultArgs));
    const event = createEvent({ clientY: 50, currentTarget: { getBoundingClientRect: () => ({ top: 0, height: 100 }) } });
    const entity = { type: "folder" as const, collectionId: "c1", itemId: "f1" };
    const target = { type: "folder" as const, collectionId: "c1", itemId: "f2" };
    
    act(() => {
      result.current.onDragStart(entity, event);
    });
    
    act(() => {
      result.current.onDrop(target, event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(defaultArgs.moveSidebarItem).toHaveBeenCalledWith(entity, { ...target, position: "inside" });
    expect(result.current.draggingEntity).toBeNull();
  });

  test("handles drop with external data", () => {
    const { result } = renderHook(() => useSidebarDragHandlers(defaultArgs));
    const entity = { type: "folder" as const, collectionId: "c1", itemId: "f1" };
    const event = createEvent({
      dataTransfer: {
        setData: mock(),
        getData: (type: string) => type === SIDEBAR_DRAG_DATA_TYPE ? JSON.stringify(entity) : null
      },
      clientY: 50, 
      currentTarget: { getBoundingClientRect: () => ({ top: 0, height: 100 }) }
    });
    const target = { type: "folder" as const, collectionId: "c1", itemId: "f2" };
    
    act(() => {
      result.current.onDrop(target, event);
    });

    expect(defaultArgs.moveSidebarItem).toHaveBeenCalledWith(entity, { ...target, position: "inside" });
  });

  test("handles drop ignored if search active", () => {
    const { result } = renderHook(() => useSidebarDragHandlers({ ...defaultArgs, collectionSearch: "t" }));
    const event = createEvent();
    
    act(() => {
      result.current.onDrop({} as any, event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(defaultArgs.moveSidebarItem).not.toHaveBeenCalled();
  });

  test("handles drag end", () => {
    const { result } = renderHook(() => useSidebarDragHandlers(defaultArgs));
    const event = createEvent();
    const entity = { type: "folder" as const, collectionId: "c1", itemId: "f1" };
    
    act(() => {
      result.current.onDragStart(entity, event);
    });
    expect(result.current.draggingEntity).not.toBeNull();
    
    act(() => {
      result.current.onDragEnd();
    });
    expect(result.current.draggingEntity).toBeNull();
  });

  test("handles drag over collection and expands", () => {
    const { result } = renderHook(() => useSidebarDragHandlers(defaultArgs));
    const event = createEvent({ clientY: 50, currentTarget: { getBoundingClientRect: () => ({ top: 0, height: 100 }) } });
    const entity = { type: "folder" as const, collectionId: "c1", itemId: "f1" };
    const target = { type: "collection" as const, collectionId: "c2" };
    
    act(() => {
      result.current.onDragStart(entity, event);
    });
    
    act(() => {
      result.current.onDragOver(target, event);
    });

    expect(defaultArgs.setExpandedCollections).toHaveBeenCalled();
    const updater = defaultArgs.setExpandedCollections.mock.calls[0][0];
    expect(updater({})).toEqual({ c2: true });
  });

  test("handles drag over folder and expands", () => {
    const { result } = renderHook(() => useSidebarDragHandlers(defaultArgs));
    const event = createEvent({ clientY: 50, currentTarget: { getBoundingClientRect: () => ({ top: 0, height: 100 }) } });
    const entity = { type: "folder" as const, collectionId: "c1", itemId: "f1" };
    const target = { type: "folder" as const, collectionId: "c2", itemId: "f2" };
    
    act(() => {
      result.current.onDragStart(entity, event);
    });
    
    act(() => {
      result.current.onDragOver(target, event);
    });

    expect(defaultArgs.setExpandedFolders).toHaveBeenCalled();
    const updater = defaultArgs.setExpandedFolders.mock.calls[0][0];
    expect(updater({})).toEqual({ f2: true });
  });
});
