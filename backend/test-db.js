import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log('Users:', users);
  const workspaces = await prisma.workspace.findMany();
  console.log('Workspaces:', workspaces.map(w => ({ id: w.id, name: w.name, ownerId: w.ownerId, dataSnippet: JSON.stringify(w.data).substring(0, 100) })));
}
main().catch(console.error);
