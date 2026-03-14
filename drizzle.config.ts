import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL ?? "sqlite:./dev.db";
const isSQLite = databaseUrl.startsWith("sqlite:");

export default defineConfig(
  isSQLite
    ? {
        schema: "./src/db/schema.sqlite.ts",
        out: "./drizzle-sqlite",
        dialect: "sqlite",
        dbCredentials: {
          url: databaseUrl.replace(/^sqlite:/, ""),
        },
      }
    : {
        schema: "./src/db/schema.ts",
        out: "./drizzle",
        dialect: "postgresql",
        dbCredentials: {
          url: databaseUrl,
        },
      },
);
