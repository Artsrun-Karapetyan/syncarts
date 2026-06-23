import { GitPullRequest, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { api } from "@/lib/api";

interface CreateMergeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceCollectionId: string;
  targetWorkspaceId: string;
  targetCollectionId: string;
  onSuccess: () => void;
}

export function CreateMergeRequestModal({
  isOpen,
  onClose,
  sourceCollectionId,
  targetWorkspaceId,
  targetCollectionId,
  onSuccess,
}: CreateMergeRequestModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { collections, activeWorkspaceId } = useWorkspace();

  useEffect(() => {
    if (!isOpen) return;
    setTitle("");
    setDescription("");
    setError(null);
  }, [isOpen, sourceCollectionId, targetCollectionId, targetWorkspaceId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const sourceCollection = collections.find(
        (c) => c.id === sourceCollectionId,
      );
      if (!sourceCollection)
        throw new Error("Source collection not found locally");

      // Fetch target collection snapshot from the server
      let targetCollectionSnapshot: any = undefined;
      try {
        const wsRes = await api.get(`/workspaces/${targetWorkspaceId}`);
        const wsData = wsRes.data?.data;
        if (wsData) {
          const cols = wsData.collections || [];
          targetCollectionSnapshot =
            cols.find((c: any) => c.id === targetCollectionId) || undefined;
        }
      } catch {
        // Server-side will handle snapshotting as fallback
      }

      await api.post("/merge-requests", {
        title,
        description,
        sourceCollectionId,
        targetWorkspaceId,
        targetCollectionId,
        sourceWorkspaceId: activeWorkspaceId,
        data: sourceCollection,
        targetData: targetCollectionSnapshot,
      });

      onSuccess();
      setTitle("");
      setDescription("");
      setError(null);
      onClose();
    } catch (err: any) {
      console.error("Failed to create MR:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create Merge Request",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        animation: "fade-in 0.2s ease-out",
      }}
    >
      <div
        style={{
          width: 480,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: 12,
          boxShadow: "var(--shadow-xl)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-color)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(0, 240, 255, 0.1)",
                color: "var(--accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GitPullRequest size={16} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  margin: 0,
                  color: "var(--text-primary)",
                }}
              >
                Create Merge Request
              </h2>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-tertiary)",
                  marginTop: 2,
                }}
              >
                Propose changes to the original collection
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          {error && (
            <div
              style={{
                background: "var(--status-error-bg)",
                color: "var(--status-error)",
                padding: "10px 14px",
                borderRadius: 6,
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}
          <form
            id="mr-form"
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}
              >
                Title
              </label>
              <input
                autoFocus
                className="input"
                style={{ width: "100%", fontSize: 14, padding: "10px 12px" }}
                placeholder="e.g. Added new user endpoints"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}
              >
                Description (Optional)
              </label>
              <textarea
                className="input"
                style={{
                  width: "100%",
                  fontSize: 14,
                  padding: "10px 12px",
                  minHeight: 80,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
                placeholder="Describe what changed..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            padding: "16px 20px",
            borderTop: "1px solid var(--border-color)",
            background: "var(--bg-tertiary)",
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="mr-form"
            className="btn btn-primary"
            disabled={!title.trim() || isSubmitting}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            {isSubmitting ? "Creating..." : "Create Merge Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
