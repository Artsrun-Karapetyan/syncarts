import { CheckCircle2, Play, Square, XCircle } from "lucide-react";

import type { Collection } from "../../../contexts/WorkspaceContext";
import { getCollectionRunItems } from "./collectionRunItems";
import { useCollectionRunner } from "./useCollectionRunner";

interface Props {
  collection: Collection;
  folderId?: string;
}

export function CollectionRunner({ collection, folderId }: Props) {
  const { currentIndex, isRunning, results, runCollection, stopCollection } =
    useCollectionRunner();
  const items = getCollectionRunItems(collection, folderId);
  const passed = results.filter((result) => result.status === "passed").length;
  const failed = results.filter((result) => result.status === "failed").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              color: "var(--text-primary)",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {folderId ? "Folder Runner" : "Collection Runner"}
          </div>
          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: 13,
              marginTop: 4,
            }}
          >
            Runs {items.length} requests sequentially.
          </div>
        </div>
        {isRunning ? (
          <button
            className="btn btn-secondary"
            onClick={stopCollection}
            style={{ alignItems: "center", display: "flex", gap: 8 }}
          >
            <Square size={14} />
            Stop
          </button>
        ) : (
          <button
            className="btn btn-primary"
            disabled={items.length === 0}
            onClick={() => void runCollection(collection.id, folderId)}
            style={{ alignItems: "center", display: "flex", gap: 8 }}
          >
            <Play size={14} />
            {folderId ? "Run Folder" : "Run Collection"}
          </button>
        )}
      </div>

      <div
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--border-color)",
          borderRadius: 6,
          padding: 14,
        }}
      >
        <div
          style={{
            color: "var(--text-secondary)",
            display: "flex",
            fontSize: 13,
            gap: 16,
          }}
        >
          <span>
            {isRunning
              ? `${currentIndex}/${items.length}`
              : `${results.length}/${items.length}`}{" "}
            completed
          </span>
          <span style={{ color: "var(--status-success)" }}>
            {passed} passed
          </span>
          <span style={{ color: "var(--status-delete)" }}>{failed} failed</span>
        </div>
      </div>

      {results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {results.map((result) => {
            const isPassed = result.status === "passed";
            return (
              <div
                key={result.item.request.id}
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 6,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    gap: 10,
                  }}
                >
                  {isPassed ? (
                    <CheckCircle2
                      size={15}
                      style={{ color: "var(--status-success)" }}
                    />
                  ) : (
                    <XCircle
                      size={15}
                      style={{ color: "var(--status-delete)" }}
                    />
                  )}
                  <span
                    style={{
                      color: `var(--status-${result.item.request.method.toLowerCase()})`,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {result.item.request.method}
                  </span>
                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {result.item.folderPath
                      ? `${result.item.folderPath} / `
                      : ""}
                    {result.item.request.name}
                  </span>
                  <span
                    style={{
                      color: "var(--text-tertiary)",
                      fontSize: 12,
                      marginLeft: "auto",
                    }}
                  >
                    {result.response?.status || "ERR"} · {result.durationMs}ms
                  </span>
                </div>
                {result.error && (
                  <div
                    style={{
                      color: "var(--status-delete)",
                      fontSize: 12,
                      marginTop: 8,
                    }}
                  >
                    {result.error}
                  </div>
                )}
                {result.testResults.length > 0 && (
                  <div
                    style={{
                      color: "var(--text-secondary)",
                      display: "flex",
                      flexDirection: "column",
                      fontSize: 12,
                      gap: 4,
                      marginTop: 8,
                      paddingLeft: 25,
                    }}
                  >
                    {result.testResults.map((test) => (
                      <span key={test.name}>
                        {test.passed ? "PASS" : "FAIL"} {test.name}
                        {test.error ? `: ${test.error}` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
