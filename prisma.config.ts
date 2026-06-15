import "dotenv/config";
import { defineConfig } from "prisma/config";

// DATABASE_URL is only required at runtime (prisma migrate deploy / app start).
// During Docker build (prisma generate), it may not be available — that is expected.
const databaseUrl = process.env["DATABASE_URL"];

const config = {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --esm prisma/seed.ts",
  },
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
};

export default defineConfig(config);
