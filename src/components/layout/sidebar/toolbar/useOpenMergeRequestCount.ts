import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";

export function useOpenMergeRequestCount(activeWorkspaceId: string) {
  const [openMrCount, setOpenMrCount] = useState(0);

  useEffect(() => {
    const fetchMrs = async () => {
      if (!getAuthToken()) return;
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
