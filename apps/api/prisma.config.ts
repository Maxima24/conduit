import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 config surface (replaces the datasource `url` in schema.prisma and the old
 * package.json#prisma key). The db scripts run through dotenv-cli so the monorepo-root
 * .env is loaded into process.env regardless of cwd; the placeholder keeps commands that
 * don't connect (e.g. `prisma generate`) from throwing when DATABASE_URL is absent.
 */
const url =
  process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url,
  },
});
