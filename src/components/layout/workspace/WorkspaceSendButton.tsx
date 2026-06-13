import { ChevronDown, Loader2, Send } from "lucide-react";

interface WorkspaceSendButtonProps {
  isMutating: boolean;
  sendRequest: () => void;
  setShowSendMenu: (value: boolean | ((current: boolean) => boolean)) => void;
}

export function WorkspaceSendButton({
  isMutating,
  sendRequest,
  setShowSendMenu,
}: WorkspaceSendButtonProps) {
  return (
    <>
      <button
        className="btn-success"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontSize: 13,
          padding: "0 20px 0 24px",
          borderRadius: "9999px 0 0 9999px",
          height: 34,
          fontWeight: 700,
          letterSpacing: "0.03em",
          border: "none",
          cursor: isMutating ? "not-allowed" : "pointer",
          opacity: isMutating ? 0.7 : 1,
          transition: "all var(--transition-fast)",
        }}
        onClick={() => {
          void sendRequest();
        }}
        disabled={isMutating}
      >
        {isMutating ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send size={14} />
            SEND
          </>
        )}
      </button>
      <button
        className="btn-success"
        style={{
          width: 34,
          height: 34,
          borderRadius: "0 9999px 9999px 0",
          borderLeft: "1px solid rgba(255, 255, 255, 0.24)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: isMutating ? 0.7 : 1,
          cursor: isMutating ? "not-allowed" : "pointer",
        }}
        disabled={isMutating}
        onClick={() => setShowSendMenu((current) => !current)}
        title="More send actions"
      >
        <ChevronDown size={15} />
      </button>
    </>
  );
}
