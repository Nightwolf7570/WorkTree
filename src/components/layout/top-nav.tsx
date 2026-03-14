"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TreePine, User } from "lucide-react";
import { UserButton, useUser } from "@stackframe/stack";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard-3d", label: "3D View" },
  { href: "/upload", label: "Upload" },
  { href: "/analysis", label: "Analysis" },
  { href: "/settings", label: "Settings" },
];

function AuthButtons() {
  const user = useUser();

  if (user) {
    return <UserButton />;
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/signin"
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          "text-muted-foreground hover:text-foreground"
        )}
      >
        Sign In
      </Link>
      <Link
        href="/signup"
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        Sign Up
      </Link>
    </div>
  );
}

function AuthButtonsFallback() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
      <User className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <TreePine className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold tracking-tight">WorkTree</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Suspense fallback={<AuthButtonsFallback />}>
            <AuthButtons />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}
