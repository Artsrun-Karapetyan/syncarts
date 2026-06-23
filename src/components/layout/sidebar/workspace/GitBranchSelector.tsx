import { Cloud, GitBranch, Laptop, Loader2, Search, X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useWorkspaceGit } from "@/contexts/workspace/git/useWorkspaceGit";

import { BranchItem } from "./BranchItem";
import { GitSyncButton } from "./GitSyncButton";

export function GitBranchSelector({ mode }: { mode?: "sidebar" | "topbar" }) {
  const {
    isGitRepo,
    currentBranch,
    branches,
    isLoading,
    isCheckingOut,
    error,
    checkoutBranch,
  } = useWorkspaceGit();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!isOpen || !btnRef.current) return;

    const updatePosition = () => {
      const rect = btnRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDropdownPos({
        top: rect.bottom + 6,
        left: rect.left,
        // Give the popover a nice fixed width if it's in the topbar, or match if it's sidebar
        width: Math.max(rect.width, 280),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);

    // Auto-focus search
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 10);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  if (!isGitRepo) {
    return null;
  }

  // Filter and group branches
  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const localBranches = filteredBranches
    .filter((b) => !b.is_remote)
    .sort((a, b) => {
      if (a.name === currentBranch) return -1;
      if (b.name === currentBranch) return 1;
      return a.name.localeCompare(b.name);
    });

  const remoteBranches = filteredBranches
    .filter((b) => b.is_remote)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 8,
        marginTop: mode === "sidebar" ? 4 : 0,
        flexShrink: 0,
        position: "relative",
        width: mode === "topbar" ? "auto" : "100%",
      }}
    >
      <div
        ref={btnRef as any}
        role="button"
        tabIndex={0}
        onClick={() => !isCheckingOut && setIsOpen(!isOpen)}
        style={{
          flex: 1,
          userSelect: "none",
          width: mode === "topbar" ? 140 : "auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: isCheckingOut ? "wait" : "pointer",
          background: isOpen ? "var(--bg-tertiary)" : "var(--bg-secondary)",
          border: `1px solid ${isOpen ? "var(--border-highlight)" : "var(--border-color)"}`,
          padding: mode === "topbar" ? "0 12px" : "0 16px",
          height: mode === "topbar" ? 32 : 40,
          borderRadius: 8,
          fontSize: mode === "topbar" ? 12 : 13,
          fontWeight: 600,
          color: "var(--text-primary)",
          transition: "all var(--transition-fast)",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = "var(--bg-tertiary)";
            e.currentTarget.style.borderColor = "var(--border-highlight)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = "var(--bg-secondary)";
            e.currentTarget.style.borderColor = "var(--border-color)";
          }
        }}
      >
        <GitBranch
          size={14}
          style={{ flexShrink: 0, color: "var(--text-secondary)" }}
        />
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            textAlign: "left",
            marginRight: isCheckingOut ? 20 : 0,
          }}
        >
          {isLoading ? "Loading..." : currentBranch || "Select Branch"}
        </span>
        {isCheckingOut && (
          <Loader2
            size={13}
            className="animate-spin"
            style={{ position: "absolute", right: mode === "topbar" ? 12 : 16 }}
          />
        )}
      </div>

      <GitSyncButton mode={mode} />

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="animate-fade-in"
            style={{
              position: "fixed",
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              width: `${dropdownPos.width}px`,
              zIndex: 9999,
              background: "rgba(15, 15, 15, 0.98)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--border-highlight)",
              borderRadius: "10px",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.6)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              maxHeight: 400,
            }}
          >
            {/* Search Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 14px",
                borderBottom: "1px solid var(--border-color)",
                gap: 10,
              }}
            >
              <Search size={16} color="var(--text-secondary)" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search branches..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            {/* Error Banner */}
            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(239, 68, 68, 0.1)",
                  borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "#ef4444",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <X
                  size={14}
                  style={{ marginTop: 2, flexShrink: 0 }}
                  onClick={() => checkoutBranch(currentBranch!)}
                  cursor="pointer"
                />
                <span style={{ flex: 1 }}>{error}</span>
              </div>
            )}

            {/* Branch List */}
            <div style={{ overflowY: "auto", padding: "6px 0" }}>
              {localBranches.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      padding: "6px 14px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Laptop size={12} /> Local Branches
                  </div>
                  {localBranches.map((b) => (
                    <BranchItem
                      key={`local-${b.name}`}
                      branch={b.name}
                      isActive={b.name === currentBranch}
                      onClick={async () => {
                        if (b.name !== currentBranch) {
                          const success = await checkoutBranch(b.name);
                          if (success) setIsOpen(false);
                        } else {
                          setIsOpen(false);
                        }
                      }}
                    />
                  ))}
                </div>
              )}

              {remoteBranches.length > 0 && (
                <div>
                  <div
                    style={{
                      padding: "6px 14px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Cloud size={12} /> Remote Branches
                  </div>
                  {remoteBranches.map((b) => (
                    <BranchItem
                      key={`remote-${b.name}`}
                      branch={b.name}
                      isActive={b.name === currentBranch}
                      onClick={async () => {
                        if (b.name !== currentBranch) {
                          const success = await checkoutBranch(b.name);
                          if (success) setIsOpen(false);
                        } else {
                          setIsOpen(false);
                        }
                      }}
                    />
                  ))}
                </div>
              )}

              {filteredBranches.length === 0 && (
                <div
                  style={{
                    padding: "16px 14px",
                    textAlign: "center",
                    color: "var(--text-secondary)",
                    fontSize: 13,
                  }}
                >
                  No branches found
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
