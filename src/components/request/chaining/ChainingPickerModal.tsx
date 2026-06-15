import JsonView from "@uiw/react-json-view";
/* eslint-disable max-lines */
import { FileJson, Search, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

import {
  type Folder,
  type SavedRequest,
  useWorkspace,
} from "../../../contexts/WorkspaceContext";
import { responseJsonThemes } from "../../response/shared/responseJsonThemes";

interface ChainingPickerModalProps {
  onClose: () => void;
  onSelect: (chainString: string) => void;
}

export function ChainingPickerModal({
  onClose,
  onSelect,
}: ChainingPickerModalProps) {
  const { collections, responseCache } = useWorkspace();
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<SavedRequest | null>(
    null,
  );

  const flatRequests: SavedRequest[] = [];
  const traverse = (items: (Folder | SavedRequest)[]) => {
    for (const item of items) {
      if (item.type === "request") flatRequests.push(item);
      else if (item.type === "folder") traverse(item.items);
    }
  };
  for (const c of collections) traverse(c.items);

  const filteredRequests = flatRequests.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  const cachedResponse = selectedRequest
    ? responseCache[selectedRequest.id]
    : null;
  let parsedBody = null;
  if (cachedResponse?.body) {
    try {
      parsedBody = JSON.parse(cachedResponse.body);
    } catch {
      // Not JSON
    }
  }

  // To let user pick a path, we can customize JsonView value formatting or just provide an input for the path
  const [selectedPath, setSelectedPath] = useState("body");

  const handlePick = () => {
    if (selectedRequest) {
      onSelect(`{{$chain:${selectedRequest.id}:${selectedPath}}}`);
      onClose();
    }
  };

  const modalContent = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 800,
          height: 600,
          background: "var(--bg-primary)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-xl)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileJson size={18} style={{ color: "var(--accent-primary)" }} />
            <span style={{ fontSize: 15, fontWeight: 600 }}>
              Visual Request Chaining
            </span>
          </div>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-tertiary)",
            }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left panel: Requests list */}
          <div
            style={{
              width: 300,
              borderRight: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              background: "var(--bg-secondary)",
            }}
          >
            <div style={{ padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--bg-tertiary)",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <Search size={14} style={{ color: "var(--text-tertiary)" }} />
                <input
                  autoFocus
                  placeholder="Search requests..."
                  style={{
                    background: "none",
                    border: "none",
                    outline: "none",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    width: "100%",
                  }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: "0 8px" }}>
              {filteredRequests.map((req) => {
                const hasCache = !!responseCache[req.id];
                return (
                  <div
                    key={req.id}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      marginBottom: 2,
                      background:
                        selectedRequest?.id === req.id
                          ? "var(--bg-tertiary)"
                          : "transparent",
                      color:
                        selectedRequest?.id === req.id
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                    onClick={() => setSelectedRequest(req)}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: `var(--status-${req.method.toLowerCase()})`,
                          width: 35,
                        }}
                      >
                        {req.method}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 160,
                        }}
                      >
                        {req.name}
                      </span>
                    </div>
                    {hasCache && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--status-success)",
                          background: "var(--status-success-bg)",
                          padding: "2px 6px",
                          borderRadius: 10,
                        }}
                      >
                        Cached
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Response picker */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              background: "var(--bg-primary)",
            }}
          >
            {selectedRequest ? (
              cachedResponse ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: 16,
                      borderBottom: "1px solid var(--border-color)",
                      background: "var(--bg-secondary)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-tertiary)",
                          marginBottom: 4,
                        }}
                      >
                        SELECTED PATH
                      </div>
                      <input
                        value={selectedPath}
                        onChange={(e) => setSelectedPath(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: "var(--bg-primary)",
                          border: "1px solid var(--accent-primary)",
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          fontFamily: "var(--font-mono)",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div
                      style={{ fontSize: 12, color: "var(--text-tertiary)" }}
                    >
                      Tip: Type the path like `body.data.token` or
                      `headers.authorization`.
                    </div>
                  </div>
                  <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                    {parsedBody ? (
                      <div
                        style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}
                      >
                        <JsonView
                          value={parsedBody}
                          style={responseJsonThemes["syncarts"]}
                          displayDataTypes={false}
                          displayObjectSize={false}
                          enableClipboard={false}
                        >
                          <JsonView.KeyName
                            render={(props, { keyName, keys }) => {
                              const pathStr =
                                keys && keys.length
                                  ? `body.${keys.join(".")}`
                                  : `body.${keyName}`;
                              return (
                                <span
                                  {...(props as any)}
                                  style={{
                                    ...((props as any).style || {}),
                                    cursor: "pointer",
                                    borderBottom:
                                      "1px dashed var(--w-rjv-key-string, inherit)",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPath(pathStr);
                                  }}
                                  title={`Select path: ${pathStr}`}
                                >
                                  {keyName}
                                </span>
                              );
                            }}
                          />
                        </JsonView>
                      </div>
                    ) : (
                      <pre
                        style={{
                          fontSize: 13,
                          fontFamily: "var(--font-mono)",
                          color: "var(--text-secondary)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {cachedResponse.body}
                      </pre>
                    )}
                  </div>
                  <div
                    style={{
                      padding: 16,
                      borderTop: "1px solid var(--border-color)",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={handlePick}
                      style={{
                        padding: "8px 16px",
                        background: "var(--accent-primary)",
                        color: "white",
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      Insert Link 🔗
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                    No cached response for this request.
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-tertiary)",
                      maxWidth: 300,
                      textAlign: "center",
                      lineHeight: 1.5,
                    }}
                  >
                    You need to send this request at least once to cache its
                    response and enable visual chaining.
                  </div>
                </div>
              )
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 14, color: "var(--text-tertiary)" }}>
                  Select a request from the left to link its response.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
