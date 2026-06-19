import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/auth";
import type { Role } from "@/generated/prisma";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, extra?: unknown) {
  return NextResponse.json({ error: message, details: extra }, { status });
}

/**
 * Resolve the authenticated user for an API route. Returns either the user or a
 * ready-to-return error response. Optionally enforces a minimum role.
 */
export async function requireUser(minRole?: Role) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: fail("ログインが必要です", 401) } as const;
  }
  if (minRole && !hasRole(user.role, minRole)) {
    return { error: fail("権限がありません", 403) } as const;
  }
  return { user } as const;
}
