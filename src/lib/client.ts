"use client";

export async function api<T = unknown>(
  url: string,
  options?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, headers, ...rest } = options ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { error?: string })?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export function classNames(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
