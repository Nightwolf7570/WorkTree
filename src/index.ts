import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { env, validateEnv } from "./config/env.js";
import { api } from "./api/routes.js";

validateEnv();

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Mount API routes
app.route("/api", api);

// ── Serve frontend UI ───────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const htmlPath = join(__dirname, "frontend", "index.html");

let cachedHtml: string | null = null;
function getHtml(): string {
  if (env.NODE_ENV === "production" && cachedHtml) return cachedHtml;
  try {
    cachedHtml = readFileSync(htmlPath, "utf-8");
    return cachedHtml;
  } catch {
    // Fallback: try relative to cwd (for tsx dev mode)
    try {
      cachedHtml = readFileSync(join(process.cwd(), "src", "frontend", "index.html"), "utf-8");
      return cachedHtml;
    } catch {
      return "<html><body><h1>WorkTree</h1><p>Frontend not found.</p></body></html>";
    }
  }
}

app.get("/", (c) => {
  return c.html(getHtml());
});

console.log(`
╔══════════════════════════════════════════╗
║          WorkTree API Server             ║
║   AI Hiring Intelligence for Startups    ║
╠══════════════════════════════════════════╣
║  Port: ${String(env.PORT).padEnd(33)}║
║  Env:  ${env.NODE_ENV.padEnd(33)}║
║  UI:   http://localhost:${String(env.PORT).padEnd(20)}║
╚══════════════════════════════════════════╝
`);

serve({ fetch: app.fetch, port: env.PORT });
