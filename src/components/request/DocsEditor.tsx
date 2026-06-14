import { useState } from "react";

import type { Folder, SavedRequest } from "../../contexts/workspace/core/types";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { findRequestInItems } from "./docs/findRequestInItems";
import { FolderExamples } from "./docs/FolderExamples";
import { RequestExamplesList } from "./docs/RequestExamplesList";

type CollectionItem = Folder | SavedRequest;

export function DocsEditor() {
  const { activeTab, collections, updateActiveTab } = useWorkspace();
  const [isEditing, setIsEditing] = useState(false);

  const description = activeTab?.description || "";

  if (!activeTab) return null;

  const isCollection = activeTab.type === "collection";
  const isRequest = activeTab.type === "request" || !!activeTab.savedRequestId;

  const collection = collections.find((c) => c.id === activeTab.collectionId);

  let collectionItemsForExamples: CollectionItem[] = [];
  let requestForExamples: SavedRequest | null = null;

  if (isCollection && collection) {
    collectionItemsForExamples = collection.items;
  } else if (isRequest && collection && activeTab.savedRequestId) {
    requestForExamples = findRequestInItems(
      collection.items,
      activeTab.savedRequestId,
    );
  }

  return (
    <div
      style={{
        padding: "24px 32px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          className="btn"
          style={{ padding: "6px 12px", fontSize: 12 }}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Preview" : "Edit"}
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {isEditing ? (
          <textarea
            className="input"
            style={{
              width: "100%",
              height: "100%",
              resize: "none",
              padding: 16,
              fontFamily: "inherit",
              fontSize: 14,
              lineHeight: 1.6,
            }}
            placeholder="Write a description for this request... (Markdown is supported)"
            value={description}
            onChange={(e) => updateActiveTab({ description: e.target.value })}
          />
        ) : (
          <div style={{ padding: "0 8px" }}>
            {description ? (
              <div
                style={{
                  color: "var(--text-primary)",
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {description}
              </div>
            ) : (
              <div style={{ color: "var(--text-tertiary)", fontSize: 14 }}>
                No description provided. Click Edit to add one.
              </div>
            )}

            {isCollection && collectionItemsForExamples.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--text-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 8,
                  }}
                >
                  Saved Examples
                </div>
                {collectionItemsForExamples.map((item) =>
                  item.type === "request" ? (
                    <RequestExamplesList
                      key={item.id}
                      request={item}
                      level={0}
                    />
                  ) : (
                    <FolderExamples key={item.id} folder={item} level={0} />
                  ),
                )}
              </div>
            )}

            {isRequest && requestForExamples && (
              <RequestExamplesList request={requestForExamples} level={0} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
