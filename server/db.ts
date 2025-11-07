import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Override DATABASE_URL to use SQLite with absolute path
if (!process.env.DATABASE_URL?.startsWith("file:")) {
  const dbPath = join(projectRoot, "prisma", "dev.db");
  process.env.DATABASE_URL = `file:${dbPath}`;
}

import { PrismaClient } from "@prisma/client";
export const db = new PrismaClient();
