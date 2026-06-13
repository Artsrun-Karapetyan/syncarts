import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const workspaces = await prisma.workspace.findMany();
  console.log("WORKSPACES:");
  workspaces.forEach((w) => console.log(w.id, w.name, w.ownerId));
  const users = await prisma.user.findMany();
  console.log("\nUSERS:");
  users.forEach((u) => console.log(u.id, u.email));
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
