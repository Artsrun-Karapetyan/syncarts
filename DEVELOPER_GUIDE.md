# Syncarts Developer Guide

This guide documents the architecture, commands, and decisions made during the development of Syncarts.

## 1. Project Initialization
- **Frontend:** React + Vite + TypeScript.
- **Routing:** `@tanstack/react-router` (configured for file-based routing but currently manually initialized in `__root.tsx` and `index.tsx`).
- **Data Fetching:** `swr` for local UI state, `reqwest` in Rust for actual API requests.
- **Design:** Vanilla CSS with premium dark mode tokens (`variables.css`, `global.css`).
- **Backend:** Tauri + Rust with `reqwest` for executing HTTP requests to bypass CORS restrictions.

## 2. Rust Backend Architecture
- **`models.rs`:** Contains `HttpRequest` and `HttpResponse` structs.
- **`commands.rs`:** Contains `make_request` Tauri command which uses `reqwest` to send HTTP requests and returns the formatted response.

## 3. Frontend Architecture (React + Vite)
- **Routing Structure:** Uses TanStack router configured with `src/routes/index.tsx` acting as the main entry, rendering base Layout components.
- **Layout Components (`src/components/layout/`):**
  - **`Sidebar.tsx`:** Left-side navigation handling request history and saved collections.
  - **`Workspace.tsx`:** Main functional area containing the request/response layout.
- **Request Components (`src/components/request/`):**
  - **`UrlBar.tsx`**: URL input field.
  - **`MethodSelector.tsx`**: Dropdown for HTTP methods.
  - **`HeadersEditor.tsx`**: Dynamic key-value pair editor for HTTP headers.
  - **`BodyEditor.tsx`**: Textarea for raw JSON body payload.

## 4. State Management
- **Global Request State (`src/contexts/RequestContext.tsx`):**
  - Uses standard React Context (`createContext`, `useState`) to manage URL, Method, Headers, and Body.
  - Uses `useSWRMutation` (from `swr`) to handle the execution of requests to the Rust backend (`invoke('make_request')`), providing automatic loading (`isMutating`) and error states to the UI.
- **Workspace persistence (`src/contexts/WorkspaceContext.tsx`):**
  - Remote data is treated as the source of truth on initial load (when `lastSyncedSignature` is missing) if there is a signature mismatch, to prevent local stale data from reverting changes made by other users in shared workspaces.
  - Empty backend workspaces hydrate local state; stale backend workspaces are pushed back up instead of wiping local collections.
  - Workspace sync now includes the workspace `name`, and the backend upserts missing workspaces so invites do not create empty shells.
  - Local default workspaces use a per-user id (`local-${userId}`) to avoid collisions with shared workspace ids from other accounts.
  - The legacy `default` workspace is only mapped to `local-userId` if the user is the owner, preventing shared legacy workspaces from hijacking the user's primary workspace.
  - On the backend, owners can always sync their workspaces, even if they don't have an explicit `WorkspaceMember` record.
- **Invites (`src/components/workspace/InviteModal.tsx`, `backend/src/invite/`):**
  - Invites can target multiple selected workspaces.
  - Accepting an invite adds the user to every workspace in the invite payload.

## 5. UI & Component Architecture
- **Portals & Modals:**
  - Components rendered via `createPortal` (like the `Select` dropdown) exist outside the normal DOM tree.
  - To prevent Modals (like `SaveDialog`) from incorrectly closing due to 'click outside' events when a portal element is clicked, portal components must use identifiable classes (e.g., `.syncarts-select-dropdown`) which are explicitly ignored by the modal's pointerdown handlers.

## 6. Sidebar Keyboard Navigation
- **Hook:** `useSidebarKeyboardNavigation` (`src/components/layout/sidebar/hooks/useSidebarKeyboardNavigation.ts`)
- **Arrow keys (Up/Down):** Navigate between visible `.sidebar-row` elements with wrap-around.
- **Enter:** Triggers a click on the focused row (opens request, toggles folder/collection).
- **Search → ArrowDown:** Jumps focus from the search input to the first sidebar item.
- All sidebar rows (`CollectionRow`, `FolderSidebarItem`, `RequestSidebarItem`) have `tabIndex={0}` for focusability.
- Focused rows are highlighted via `.sidebar-row:focus` CSS in `global.css`.
- Test helpers (`createContainer`, `fireKey`) are extracted to `testHelpers.ts` per the one-function-per-file rule.

## 7. Sidebar Toggle Expand/Collapse
- Clicking a collection or folder row now **toggles** its expanded state (previously it only opened).
- `CollectionRow.onClick` toggles `expandedCollections[id]` instead of only setting it to `true`.
- `FolderSidebarItem.onClick` toggles `expandedFolders[id]` the same way.
- `RequestSidebarItem.onClick` toggles `isExamplesOpen` when examples exist.
- To prevent `useSidebarHighlight` from forcibly re-expanding a just-collapsed folder, `openCollectionTab` and `openFolderTab` in `useTabActions` now skip `updateCurrentTabs` if the `collectionView` hasn't changed.

## 8. Performance: Memoized Tab Helpers
- `findSavedRequestById` and `resolveTabSavedRequestId` in `useTabActions.ts` are wrapped in `useCallback` to prevent unnecessary re-renders of the sidebar highlight system.

## 9. Topbar Workspace Switcher Fix
- `GitBranchSelector` was taking `width: 100%` in topbar mode, pushing the workspace `Select` off-screen.
- Fixed by setting `width: "auto"` for topbar mode so both elements coexist side-by-side.

*(This guide will be updated as new components and features are built).*
