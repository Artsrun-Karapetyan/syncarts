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
  - **`MethodSelector.tsx`**: Dropdown for HTTP methods (GET, POST, PUT, DELETE, PATCH).
  - **`HeadersEditor.tsx`**: Dynamic key-value pair editor for HTTP headers.
  - **`BodyEditor.tsx`**: Textarea for raw JSON body payload.

*(This guide will be updated as new components and features are built).*
