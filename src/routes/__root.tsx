import { createRootRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';

function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    async function setupDeepLink() {
      try {
        unlisten = await onOpenUrl((urls) => {
          for (const url of urls) {
            // Expected URL format: syncarts://invite/xyz123
            try {
              const parsed = new URL(url);
              if (parsed.protocol === 'syncarts:' && parsed.hostname === 'invite') {
                const token = parsed.pathname.replace(/^\//, '');
                if (token) {
                  navigate({ to: '/invite/$token', params: { token } });
                }
              }
            } catch (e) {
              console.error('Failed to parse deep link URL', url, e);
            }
          }
        });
      } catch (err) {
        console.error('Deep link setup failed', err);
      }
    }

    setupDeepLink();

    return () => {
      if (unlisten) unlisten();
    };
  }, [navigate]);

  return null;
}

export const Route = createRootRoute({
  component: () => (
    <>
      <DeepLinkHandler />
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
    </>
  ),
});
