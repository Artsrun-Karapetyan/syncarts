import "@uiw/react-textarea-code-editor/dist.css";

import CodeEditor from "@uiw/react-textarea-code-editor";
import { BookTemplate } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useWorkspace } from "../../../contexts/WorkspaceContext";
import { ScriptAutocompletePopover } from "./ScriptAutocompletePopover";
import { ScriptSnippetsDrawer } from "./ScriptSnippetsDrawer";
import { useScriptAutocomplete } from "./useScriptAutocomplete";

type HistoryState = {
  past: string[];
  future: string[];
};

export function ScriptsEditor() {
  const { activeTab, updateActiveTab } = useWorkspace();
  const [showSnippets, setShowSnippets] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"pre" | "post">("pre");
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const historyRef = useRef<Record<string, HistoryState>>({});
  const snippetsButtonRef = useRef<HTMLButtonElement | null>(null);
  const snippetsDrawerRef = useRef<HTMLDivElement | null>(null);

  const scriptField =
    activeSubTab === "pre" ? "preRequestScript" : "testScript";
  const scriptHistoryKey = `${activeTab?.id || "empty"}:${scriptField}`;
  const currentScript = activeTab?.[scriptField] || "";
  const getHistory = () => {
    historyRef.current[scriptHistoryKey] ||= { past: [], future: [] };
    return historyRef.current[scriptHistoryKey];
  };
  const updateScript = (value: string, trackHistory = true) => {
    if (!activeTab) return;
    if (value === currentScript) return;
    const history = getHistory();
    if (trackHistory) {
      const last = history.past[history.past.length - 1];
      if (last !== currentScript) history.past.push(currentScript);
      if (history.past.length > 100) history.past.shift();
      history.future = [];
    }
    updateActiveTab({ [scriptField]: value });
  };
  const autocomplete = useScriptAutocomplete(currentScript, (value) =>
    updateScript(value),
  );
  const undoScript = () => {
    const history = getHistory();
    const previous = history.past.pop();
    if (previous === undefined) return;
    history.future.push(currentScript);
    updateScript(previous, false);
  };
  const redoScript = () => {
    const history = getHistory();
    const next = history.future.pop();
    if (next === undefined) return;
    history.past.push(currentScript);
    updateScript(next, false);
  };
  const handleSnippetClick = (code: string) => {
    const newCode =
      currentScript.length > 0 && !currentScript.endsWith("\n")
        ? `${currentScript}\n${code}`
        : `${currentScript}${code}`;
    updateScript(newCode);
  };

  useEffect(() => {
    if (!showSnippets) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (snippetsDrawerRef.current?.contains(target)) return;
      if (snippetsButtonRef.current?.contains(target)) return;
      setShowSnippets(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showSnippets]);

  if (!activeTab) return null;

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Editor Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border-color)",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ display: "flex", gap: 16 }}>
            <button
              className="btn"
              style={{
                padding: "4px 8px",
                fontWeight: activeSubTab === "pre" ? 700 : 500,
                color:
                  activeSubTab === "pre"
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                background: "transparent",
              }}
              onClick={() => setActiveSubTab("pre")}
            >
              Pre-request
            </button>
            <button
              className="btn"
              style={{
                padding: "4px 8px",
                fontWeight: activeSubTab === "post" ? 700 : 500,
                color:
                  activeSubTab === "post"
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                background: "transparent",
              }}
              onClick={() => setActiveSubTab("post")}
            >
              Post-response
            </button>
          </div>
          <button
            ref={snippetsButtonRef}
            className="btn"
            style={{
              padding: "6px 12px",
              fontSize: 12,
              background: showSnippets ? "var(--bg-tertiary)" : "transparent",
            }}
            onClick={() => setShowSnippets(!showSnippets)}
          >
            <BookTemplate size={14} style={{ marginRight: 6 }} /> Snippets
          </button>
        </div>
        <div
          style={{
            padding: "8px 16px",
            background: "var(--bg-secondary)",
            fontSize: 12,
            color: "var(--text-tertiary)",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          {activeSubTab === "pre"
            ? "Scripts written here will be executed before a request is sent."
            : "Scripts written here will be executed after a response is received."}{" "}
          You can use the <code>pm</code> object to interact with the
          environment.
        </div>
        <div
          data-color-mode="dark"
          style={{
            flex: 1,
            background: "var(--bg-primary)",
            overflow: "auto",
          }}
          onClick={(e) => {
            const textarea = e.currentTarget.querySelector("textarea");
            if (textarea && e.target === e.currentTarget) {
              textarea.focus();
              const length = textarea.value.length;
              textarea.setSelectionRange(length, length);
            }
          }}
          onKeyDownCapture={(event) => {
            const target = event.target as HTMLElement;
            if (target.tagName !== "TEXTAREA") return;
            if (autocomplete.handleKeyDown(event as any)) return;
            if (
              !(event.metaKey || event.ctrlKey) ||
              event.key.toLowerCase() !== "z"
            )
              return;
            event.preventDefault();
            event.stopPropagation();
            if (event.shiftKey) {
              redoScript();
            } else {
              undoScript();
            }
          }}
        >
          <CodeEditor
            ref={editorRef}
            value={currentScript}
            language="js"
            placeholder="Write your scripts here... Example: pm.environment.set('token', pm.response.json().access_token);"
            onBlur={autocomplete.handleBlur}
            onChange={autocomplete.handleChange}
            onClick={autocomplete.handleClick}
            onFocus={autocomplete.handleFocus}
            onKeyUp={autocomplete.handleKeyUp}
            padding={24}
            style={{
              fontSize: 14,
              backgroundColor: "transparent",
              fontFamily:
                "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
              minHeight: "100%",
            }}
          />
          {autocomplete.state && (
            <ScriptAutocompletePopover
              activeIndex={autocomplete.activeIndex}
              suggestions={autocomplete.suggestions}
              x={autocomplete.state.x}
              y={autocomplete.state.y}
              onSelect={(suggestion) =>
                autocomplete.insertSuggestion(suggestion, editorRef.current)
              }
            />
          )}
        </div>
      </div>

      {/* Snippets Drawer */}
      {showSnippets && (
        <ScriptSnippetsDrawer
          drawerRef={snippetsDrawerRef}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onClose={() => setShowSnippets(false)}
          onSnippetClick={handleSnippetClick}
        />
      )}
    </div>
  );
}
