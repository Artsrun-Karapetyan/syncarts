import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { api } from '../lib/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/invite/$token')({
  component: AcceptInviteView,
});

function AcceptInviteView() {
  const { token } = useParams({ from: '/invite/$token' });

  return (
    <AppShell>
      <AcceptInviteContent token={token} />
    </AppShell>
  );
}

function AcceptInviteContent({ token }: { token: string }) {
  const navigate = useNavigate();
  const { reloadWorkspaces, switchWorkspace } = useWorkspace();
  
  const [loading, setLoading] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    async function fetchInfo() {
      try {
        setLoading(true);
        const res = await api.get(`/invites/${token}`);
        setInviteInfo(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load invite info');
      } finally {
        setLoading(false);
      }
    }
    fetchInfo();
  }, [token]);

  const handleAccept = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/invites/${token}/accept`);
      await reloadWorkspaces();
      if (res.data?.workspaceIds?.[0]) {
        switchWorkspace(res.data.workspaceIds[0]);
      }
      setAccepted(true);
      setTimeout(() => {
        navigate({ to: '/' });
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept invite');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    navigate({ to: '/' });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-primary)' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: 40, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', width: 400, textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
          {loading && !inviteInfo && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Loading invite details...</p>
            </div>
          )}

          {error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <XCircle size={48} style={{ color: 'var(--status-delete)' }} />
              <h2 style={{ fontSize: 20, color: 'var(--text-primary)' }}>Invalid Invite</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
              <button className="btn" onClick={() => navigate({ to: '/' })} style={{ marginTop: 16 }}>
                Return to App
              </button>
            </div>
          )}

          {accepted && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <CheckCircle size={48} style={{ color: 'var(--status-success)' }} />
              <h2 style={{ fontSize: 20, color: 'var(--text-primary)' }}>Invite Accepted!</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Redirecting you to the workspace...</p>
            </div>
          )}

          {!loading && inviteInfo && !error && !accepted && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--bg-primary)', border: '1px solid var(--border-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--accent-primary)' }}>
                {(inviteInfo.workspaces?.[0]?.name || inviteInfo.workspace?.name || 'W').charAt(0).toUpperCase()}
              </div>
              
              <div>
                <h2 style={{ fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>Join Workspace</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
                  <strong>{inviteInfo.workspaces?.[0]?.owner?.name || inviteInfo.workspace?.owner?.name}</strong> has invited you to join {inviteInfo.workspaces?.length > 1 ? 'these workspaces' : 'the workspace'}.
                </p>
                {inviteInfo.invitedEmail && (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 12 }}>
                    This invite is specifically for {inviteInfo.invitedEmail}.
                  </p>
                )}
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
                  {(inviteInfo.workspaces || []).map((workspace: any) => (
                    <div
                      key={workspace.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{workspace.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        Owner: {workspace.owner?.name || 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
                <button className="btn" style={{ flex: 1, padding: '10px 0' }} onClick={handleDecline} disabled={loading}>
                  Decline
                </button>
                <button className="btn btn-primary" style={{ flex: 1, padding: '10px 0' }} onClick={handleAccept} disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Accept Invite'}
                </button>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
