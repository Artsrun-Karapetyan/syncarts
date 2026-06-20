import { AlertTriangle } from "lucide-react";

import { DuplicateRequestGroupCard } from "@/components/request/duplicates/DuplicateRequestGroupCard";
import { findRequestDuplicateGroups } from "@/components/request/duplicates/requestDuplicateDetector";
import type { Collection } from "@/contexts/workspace/core/types";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface Props {
  collection: Collection;
}

export function CollectionDuplicateReport({ collection }: Props) {
  const { openRequestTab } = useWorkspace();
  const groups = findRequestDuplicateGroups(collection);
  if (groups.length === 0) return null;

  return (
    <section style={{ marginTop: 24 }}>
      <div
        style={{
          alignItems: "center",
          color: "var(--text-tertiary)",
          display: "flex",
          fontSize: 12,
          fontWeight: 700,
          gap: 8,
          letterSpacing: "0.05em",
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        <AlertTriangle size={14} style={{ color: "#eab308" }} />
        Duplicate Requests
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {groups.map((group) => (
          <DuplicateRequestGroupCard
            key={`${group.kind}:${group.key}`}
            collectionId={collection.id}
            group={group}
            onOpenRequest={openRequestTab}
          />
        ))}
      </div>
    </section>
  );
}
