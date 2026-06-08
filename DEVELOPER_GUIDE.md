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
  - Local collections are treated as the source of truth on reload when a workspace already has local data.
  - Empty backend workspaces hydrate local state; stale backend workspaces are pushed back up instead of wiping local collections.
  - Workspace sync now includes the workspace `name`, and the backend upserts missing workspaces so invites do not create empty shells.
  - Local default workspaces use a per-user id (`local-${userId}`) to avoid collisions with shared workspace ids from other accounts.
- **Invites (`src/components/workspace/InviteModal.tsx`, `backend/src/invite/`):**
  - Invites can target multiple selected workspaces.
  - Accepting an invite adds the user to every workspace in the invite payload.

*(This guide will be updated as new components and features are built).*
