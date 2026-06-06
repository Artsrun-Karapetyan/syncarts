# Project Rules & Coding Standards

1. **File Size Limit:** No file should exceed 300 lines of code. If a file grows larger, it must be refactored into smaller, logical pieces.
2. **Component Architecture:** Strictly one React component per file.
3. **Folder Structure:** Everything must be heavily structured with folders. Code organization is critical.
4. **Code Quality:** All code must be beautiful, highly readable, and written at a senior developer level.
5. **Top-Level Quality:** Whether it's React, Tauri, or Rust, every layer of the stack must adhere to the highest standard of quality and best practices.
6. **Terminal Commands:** The AI assistant must NOT execute terminal commands (like installations) automatically. Instead, provide the command code to the user so they can run it manually.
7. **Communication:** The AI assistant must ALWAYS answer briefly and strictly to the point. Do not give long explanations unless explicitly requested by the user. Do not explore unnecessary files when answering a simple question.
8. **Latest Versions:** All technologies (Rust, Tauri, React, TanStack, Vite) must strictly use their absolute latest versions. Always verify the latest API and syntax before writing code to avoid deprecated methods.

## Tech Stack
- **Frontend:** React + Vite
- **Routing:** TanStack Router (file-based routing)
- **Data Fetching:** SWR (for local state and UI data)
- **Backend:** Rust + Tauri (IPC)
