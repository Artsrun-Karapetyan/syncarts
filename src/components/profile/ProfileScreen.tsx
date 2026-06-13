import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { type AuthUser, getMe, logout, updateMe } from "../../lib/api";
import { clearAuthToken, getAuthToken } from "../../lib/auth";
import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
} from "../../lib/session";

export function ProfileScreen() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      void navigate({ to: "/login" });
      return;
    }

    void getMe(token)
      .then((currentUser) => {
        setUser(currentUser);
        setStoredUser(currentUser);
        setName(currentUser.name ?? "");
      })
      .catch(() => {
        clearAuthToken();
        clearStoredUser();
        void navigate({ to: "/login" });
      });
  }, [navigate, token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;

    setBusy(true);
    setError("");

    try {
      const updated = await updateMe(token, { name: name.trim() });
      setUser(updated);
      setStoredUser(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    if (!token) return;

    try {
      await logout(token);
    } finally {
      clearAuthToken();
      clearStoredUser();
      await navigate({ to: "/login" });
    }
  }

  const initial = (
    user?.name?.trim()?.[0] ??
    user?.email?.[0] ??
    "A"
  ).toUpperCase();

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        overflow: "auto",
        padding: "24px 24px 32px",
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div
          className="glass-panel"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            padding: "24px 28px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-tertiary)",
                fontWeight: 600,
              }}
            >
              Settings
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Account
            </h1>
          </div>
          <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
            <button
              className="btn"
              type="button"
              onClick={() => void navigate({ to: "/" })}
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="btn"
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                borderColor: "rgba(239, 68, 68, 0.22)",
                color: "var(--text-primary)",
                padding: "0.7rem 1.15rem",
                minWidth: 116,
              }}
            >
              <LogOut size={14} style={{ opacity: 0.8 }} />
              Log out
            </button>
          </div>
        </div>

        <section
          className="glass-panel"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            padding: "28px 28px 30px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              paddingBottom: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text-primary)",
                flexShrink: 0,
                width: 58,
                height: 58,
                background:
                  "linear-gradient(180deg, rgba(99, 102, 241, 0.28), rgba(99, 102, 241, 0.12))",
                border: "2px solid rgba(99, 102, 241, 0.2)",
              }}
            >
              {initial}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.name?.trim() || "Unnamed user"}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--text-tertiary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginTop: 4,
                }}
              >
                {user?.email ?? "-"}
              </div>
            </div>
          </div>

          <form
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
            onSubmit={handleSubmit}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--text-tertiary)",
                  fontWeight: 600,
                }}
              >
                Display name
              </span>
              <input
                className="input"
                style={{ fontSize: 14 }}
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--text-tertiary)",
                  fontWeight: 600,
                }}
              >
                Email
              </span>
              <input
                className="input"
                style={{ fontSize: 14, opacity: 0.7, cursor: "not-allowed" }}
                value={user?.email ?? ""}
                disabled
              />
            </label>

            {error ? (
              <div style={{ fontSize: 14, color: "var(--status-delete)" }}>
                {error}
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
              <button
                className="btn btn-primary"
                style={{ height: 44, padding: "0 24px", borderRadius: 8 }}
                type="submit"
                disabled={busy}
              >
                {busy ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
