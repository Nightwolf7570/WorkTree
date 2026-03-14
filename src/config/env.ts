import dotenv from "dotenv";
dotenv.config();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "sqlite:./dev.db",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  SERPAPI_API_KEY: process.env.SERPAPI_API_KEY ?? "",
  GITHUB_TOKEN: process.env.GITHUB_TOKEN ?? "",
  PORT: parseInt(process.env.PORT ?? "3000", 10),
  NODE_ENV: process.env.NODE_ENV ?? "development",

  // Stack Auth
  STACK_PROJECT_ID: process.env.STACK_PROJECT_ID ?? "",
  STACK_SECRET_SERVER_KEY: process.env.STACK_SECRET_SERVER_KEY ?? "",
} as const;

const REQUIRED_ALWAYS: Array<{ key: keyof typeof env; label: string }> = [
  { key: "DATABASE_URL", label: "DATABASE_URL" },
  { key: "OPENAI_API_KEY", label: "OPENAI_API_KEY" },
];

const REQUIRED_PROD: Array<{ key: keyof typeof env; label: string }> = [
  { key: "STACK_PROJECT_ID", label: "STACK_PROJECT_ID" },
  { key: "STACK_SECRET_SERVER_KEY", label: "STACK_SECRET_SERVER_KEY" },
];

export function validateEnv() {
  const checks = env.NODE_ENV === "production"
    ? [...REQUIRED_ALWAYS, ...REQUIRED_PROD]
    : REQUIRED_ALWAYS;
  const missing = checks.filter((r) => !env[r.key]).map((r) => r.label);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
