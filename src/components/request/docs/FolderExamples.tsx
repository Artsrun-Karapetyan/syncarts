import { ChevronRight } from "lucide-react";

import { RequestExamplesList } from "@/components/request/docs/RequestExamplesList";
import type { Folder } from "@/contexts/workspace/core/types";

interface Props {
  folder: Folder;
  level: number;
}

export function FolderExamples({ folder, level }: Props) {
  return (
    <div style={{ marginLeft: level * 16 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginTop: 16,
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <ChevronRight size={12} />
        {folder.name}
      </div>
      {folder.items.map((item) =>
        item.type === "request" ? (
          <RequestExamplesList key={item.id} request={item} level={level + 1} />
        ) : (
          <FolderExamples key={item.id} folder={item} level={level + 1} />
        ),
      )}
    </div>
  );
}
