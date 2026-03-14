import { createMiddleware } from "hono/factory";
import * as jose from "jose";
import { env } from "../../config/env.js";

// ── Types ─────────────────────────────────────────────────────────────
export interface AuthUser {
  userId: string;
  workspaceId: string;
  email: string;
  name: string;
}

// Hono env bindings — every authenticated route gets this on c.var
export type AuthEnv = {
  Variables: {
    user: AuthUser;
  };
};

// ── JWKS (cached automatically by jose) ───────────────────────────────
let _jwks: ReturnType<typeof jose.createRemoteJWKSet> | null = null;

function getJwks() {
  if (!_jwks) {
    _jwks = jose.createRemoteJWKSet(
      new URL(
        `https://api.stack-auth.com/api/v1/projects/${env.STACK_PROJECT_ID}/.well-known/jwks.json`,
      ),
    );
  }
  return _jwks;
}

// ── Middleware ─────────────────────────────────────────────────────────
/**
 * Hono middleware that verifies the Stack Auth access token,
 * extracts user + workspace (team) IDs, and sets them on c.var.user.
 *
 * The frontend sends the token as:
 *   Authorization: Bearer <accessToken>
 *
 * The JWT must contain `sub` (user id) and `selected_team_id` (workspace).
 */
export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  // ── Dev-mode bypass: skip JWT verification for local development ──
  if (env.NODE_ENV === "development") {
    const header = c.req.header("Authorization");
    if (!header?.startsWith("Bearer ")) {
      // No token in dev mode → use demo user
      c.set("user", {
        userId: "dev-user",
        workspaceId: "dev-workspace",
        email: "dev@worktree.local",
        name: "Dev User",
      });
      await next();
      return;
    }
  }

  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or malformed Authorization header" }, 401);
  }

  const token = header.slice(7);

  try {
    const { payload } = await jose.jwtVerify(token, getJwks(), {
      issuer: `https://api.stack-auth.com/api/v1/projects/${env.STACK_PROJECT_ID}`,
      audience: env.STACK_PROJECT_ID,
    });

    const userId = payload.sub;
    const workspaceId = payload.selected_team_id as string | undefined;

    if (!userId) {
      return c.json({ error: "Token missing user identity" }, 401);
    }
    if (!workspaceId) {
      return c.json(
        { error: "No workspace selected. Select a team in your Stack Auth client." },
        403,
      );
    }

    c.set("user", {
      userId,
      workspaceId,
      email: (payload.email as string) ?? "",
      name: (payload.name as string) ?? "",
    });

    await next();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token verification failed";
    return c.json({ error: "Invalid access token", detail: message }, 401);
  }
});

/**
 * Helper to pull the authenticated user off context in route handlers.
 * Only call this inside routes protected by requireAuth.
 */
export function getAuthUser(c: { var: { user: AuthUser } }): AuthUser {
  return c.var.user;
}
