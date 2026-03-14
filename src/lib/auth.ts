import "server-only";
import { StackServerApp } from "@stackframe/stack";
import { NextResponse } from "next/server";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/signin",
    signUp: "/signup",
    afterSignIn: "/dashboard",
    afterSignUp: "/dashboard",
    afterSignOut: "/",
  },
});

/**
 * Get the current authenticated user or return an unauthorized response
 * Use this in API routes to protect them
 */
export async function requireAuth() {
  const user = await stackServerApp.getUser();
  
  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
  
  return { user, response: null };
}
