import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Bootstraps the one login. Idempotent: if the username already exists it is left untouched, so
// re-running (docker compose up) never resets a password someone has since changed.
async function main() {
  const prisma = new PrismaClient();
  try {
    const username = process.env.SEED_USERNAME?.trim().toLowerCase();
    const password = process.env.SEED_PASSWORD;
    if (!username || !password) {
      console.log("SEED_USERNAME/SEED_PASSWORD not set, skipping user seed.");
      return;
    }
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      console.log(`User ready: ${username} (already existed)`);
      return;
    }
    await prisma.user.create({ data: { username, passwordHash: await bcrypt.hash(password, 12) } });
    console.log(`User ready: ${username} (created)`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
