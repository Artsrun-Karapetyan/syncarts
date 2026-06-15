import { useEffect, useState } from "react";

import { useWorkspace } from "../../contexts/WorkspaceContext";
import { api } from "../../lib/api";
import { MergeRequestDetails } from "./merge-requests/MergeRequestDetails";
import { MergeRequestsSidebar } from "./merge-requests/MergeRequestsSidebar";
import { MergeRequestsTopBar } from "./merge-requests/MergeRequestsTopBar";

export function MergeRequestsScreen() {
  const [mrs, setMrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMr, setSelectedMr] = useState<any | null>(null);
  const [sourceCollection, setSourceCollection] = useState<any | null>(null);
  const [targetCollection, setTargetCollection] = useState<any | null>(null);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { collections, updateCollection, activeWorkspaceId } = useWorkspace();

  useEffect(() => {
    if (activeWorkspaceId) {
      fetchMrs();
    }
  }, [activeWorkspaceId]);

  async function fetchMrs() {
    if (!activeWorkspaceId) return;
    try {
      setLoading(true);
      const res = await api.get(
        `/merge-requests/workspace/${activeWorkspaceId}`,
      );
      setMrs(res.data);
    } catch (err) {
      console.error("Failed to fetch MRs:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectMr = async (mr: any) => {
    setSelectedMr(mr);
    setSourceCollection(null);
    setTargetCollection(null);
    setError(null);
    if (mr.status === "OPEN") {
      try {
        const [sourceRes, targetRes] = await Promise.all([
          api.get(`/merge-requests/${mr.id}/source-collection`),
          api.get(`/merge-requests/${mr.id}/target-collection`),
        ]);
        setSourceCollection(sourceRes.data);
        setTargetCollection(targetRes.data);
      } catch (err) {
        console.error("Failed to fetch MR collections:", err);
        setError(
          "Could not load changes. The source or target workspace might have been deleted, or it was created before snapshots were added.",
        );
      }
    }
  };

  const handleMerge = async () => {
    if (!selectedMr || !sourceCollection) return;
    setError(null);

    const targetCol = collections.find(
      (c) => c.id === selectedMr.targetCollectionId,
    );
    if (!targetCol) {
      setError("The target collection no longer exists in this workspace!");
      return;
    }

    try {
      setMerging(true);
      updateCollection(selectedMr.targetCollectionId, {
        items: sourceCollection.items,
        variables: sourceCollection.variables,
        authType: sourceCollection.authType,
        bearerToken: sourceCollection.bearerToken,
        preRequestScript: sourceCollection.preRequestScript,
        testScript: sourceCollection.testScript,
      });

      await api.patch(`/merge-requests/${selectedMr.id}/status`, {
        status: "MERGED",
      });
      await fetchMrs();
      setSelectedMr(null);
      setTargetCollection(null);
    } catch (err) {
      console.error("Merge failed:", err);
      setError("Merge failed! Check console for details.");
    } finally {
      setMerging(false);
    }
  };

  const handleReject = async () => {
    if (!selectedMr) return;
    setError(null);
    try {
      setMerging(true);
      await api.patch(`/merge-requests/${selectedMr.id}/status`, {
        status: "REJECTED",
      });
      await fetchMrs();
      setSelectedMr(null);
      setTargetCollection(null);
    } catch (err) {
      console.error("Reject failed:", err);
      setError("Failed to reject merge request.");
    } finally {
      setMerging(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-secondary)",
      }}
    >
      <style>{`
        .mr-btn {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .mr-btn:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }
        .mr-btn.mr-btn-approve {
          background: rgba(0, 255, 170, 0.1) !important;
          color: var(--status-success) !important;
          border: 1px solid rgba(0, 255, 170, 0.3) !important;
        }
        .mr-btn.mr-btn-approve:hover:not(:disabled) {
          background: rgba(0, 255, 170, 0.25) !important;
          border: 1px solid #00ffaa !important;
          box-shadow: 0 4px 12px rgba(0, 255, 170, 0.2) !important;
        }
        .mr-btn.mr-btn-reject {
          background: rgba(255, 80, 80, 0.1) !important;
          color: #ff5050 !important;
          border: 1px solid rgba(255, 80, 80, 0.3) !important;
        }
        .mr-btn.mr-btn-reject:hover:not(:disabled) {
          background: rgba(255, 80, 80, 0.25) !important;
          border-color: #ff5050 !important;
          box-shadow: 0 4px 12px rgba(255, 80, 80, 0.15) !important;
        }
      `}</style>

      <MergeRequestsTopBar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <MergeRequestsSidebar
          loading={loading}
          mrs={mrs}
          selectedMr={selectedMr}
          onSelectMr={handleSelectMr}
        />
        <MergeRequestDetails
          error={error}
          merging={merging}
          selectedMr={selectedMr}
          sourceCollection={sourceCollection}
          targetCollection={targetCollection}
          onMerge={handleMerge}
          onReject={handleReject}
        />
      </div>
    </div>
  );
}
