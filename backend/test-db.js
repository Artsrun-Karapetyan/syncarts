import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log('Users:', users);
  const sessions = await prisma.session.findMany();
  console.log('Sessions:', sessions);
}
main().catch(console.error);
