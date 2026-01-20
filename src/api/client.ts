// src/api/client.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  console.warn("VITE_API_BASE_URL is not defined");
}

type ApiFetchOptions = RequestInit;

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { headers, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    credentials: "include", // IMPORTANT: send/receive HttpOnly session cookie
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
  });

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) message += `: ${body.detail}`;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  // handle empty responses safely
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null as unknown as T;
  }

  return res.json() as Promise<T>;
}
