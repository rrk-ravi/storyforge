import { prisma } from "../config/prisma.js";

const run = async () => {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error("Usage: npm run make-admin --workspace server -- <email>");
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN", isEmailVerified: true },
    select: { id: true, email: true, name: true, role: true }
  });

  console.log("Admin updated:", user);
};

try {
  await run();
} catch (error) {
  console.error("Failed to update admin role", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
