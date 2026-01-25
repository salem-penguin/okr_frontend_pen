// // src/api/client.ts
// const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// if (!BASE_URL) {
//   console.warn("VITE_API_BASE_URL is not defined");
// }

// type ApiFetchOptions = RequestInit;

// export async function apiFetch<T>(
//   path: string,
//   options: ApiFetchOptions = {}
// ): Promise<T> {
//   const { headers, ...rest } = options;

//   const res = await fetch(`${BASE_URL}${path}`, {
//     ...rest,
//     credentials: "include", // IMPORTANT: send/receive HttpOnly session cookie
//     headers: {
//       "Content-Type": "application/json",
//       ...(headers || {}),
//     },
//   });

//   if (!res.ok) {
//     let message = `API error ${res.status}`;
//     try {
//       const body = await res.json();
//       if (body?.detail) message += `: ${body.detail}`;
//     } catch {
//       // ignore
//     }
//     throw new Error(message);
//   }

//   // handle empty responses safely
//   const contentType = res.headers.get("content-type") || "";
//   if (!contentType.includes("application/json")) {
//     return null as unknown as T;
//   }

//   return res.json() as Promise<T>;
// }


// src/api/client.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) console.warn("VITE_API_BASE_URL is not defined");

type ApiFetchOptions = RequestInit;

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { headers, body, method, ...rest } = options;

  // Normalize method
  const m = (method || (body ? "POST" : "GET")).toUpperCase();

  // Build headers without forcing JSON for GET
  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string> | undefined),
  };

  // Only set Content-Type when we actually send a JSON body
  const hasBody = body !== undefined && body !== null;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (hasBody && !isFormData && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    method: m,
    body: hasBody ? (isFormData ? body : (typeof body === "string" ? body : JSON.stringify(body))) : undefined,
    credentials: "include",
    headers: finalHeaders,
  });

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const b = await res.json();
        if (b?.detail) message += `: ${b.detail}`;
      } else {
        const txt = await res.text();
        message += `: ${txt.slice(0, 200)}`;
      }
    } catch {}
    throw new Error(message);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null as unknown as T;
  }

  return res.json() as Promise<T>;
}

