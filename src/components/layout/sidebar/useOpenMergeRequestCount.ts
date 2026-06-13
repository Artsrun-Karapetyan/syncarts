import { useEffect, useState } from "react";

import { api } from "../../../lib/api";

export function useOpenMergeRequestCount(activeWorkspaceId: string) {
  const [openMrCount, setOpenMrCount] = useState(0);

  useEffect(() => {
    const fetchMrs = async () => {
      try {
        const res = await api.get(
          `/merge-requests/workspace/${activeWorkspaceId}`,
        );
        const mrs = res.data || [];
        setOpenMrCount(mrs.filter((mr: any) => mr.status === "OPEN").length);
      } catch (err) {
        console.error("Failed to fetch MRs for badge:", err);
      }
    };
    fetchMrs();
    const interval = setInterval(fetchMrs, 15000);
    return () => clearInterval(interval);
  }, [activeWorkspaceId]);

  return openMrCount;
}
