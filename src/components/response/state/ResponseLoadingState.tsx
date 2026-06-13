import "./ResponseLoadingState.css";

import { Loader2 } from "lucide-react";

export function ResponseLoadingState() {
  return (
    <div className="loading-state">
      <div className="loading-state-spinner animate-spin">
        <Loader2 size={28} />
      </div>
      <div className="loading-state-text">Sending request…</div>

      <div className="loading-state-skeleton">
        <div
          className="loading-state-skeleton-line animate-shimmer"
          style={{ width: "100%" }}
        />
        <div
          className="loading-state-skeleton-line animate-shimmer"
          style={{ width: "80%", animationDelay: "0.15s" }}
        />
        <div
          className="loading-state-skeleton-line animate-shimmer"
          style={{ width: "60%", animationDelay: "0.3s" }}
        />
      </div>
    </div>
  );
}
