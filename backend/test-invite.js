import { api } from '../src/lib/api.ts'; // Cannot do this because it's node.

// Let's just fetch it with node fetch
async function test() {
  const res = await fetch('http://localhost:4000/invites/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId: 'test' })
  });
  console.log(res.status);
  console.log(await res.text());
}
test();
