import "@/components/response/state/ResponseEmptyState.css";

import { Send } from "lucide-react";

export function ResponseEmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon animate-pulse-soft">
        <Send size={24} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div className="empty-state-title">No response yet</div>
        <div className="empty-state-hint">
          Hit <span className="empty-state-accent">Send</span> to fire the
          request
        </div>
      </div>
    </div>
  );
}
