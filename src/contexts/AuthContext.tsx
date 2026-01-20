// import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
// import { User, AuthContextType } from "@/types";
// import { apiFetch } from "@/api/client";

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// const LS_EMAIL_KEY = "currentUserEmail";

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     // Check for existing session on mount
//     const checkAuth = async () => {
//       const email = localStorage.getItem(LS_EMAIL_KEY);

//       if (!email) {
//         setIsLoading(false);
//         return;
//       }

//       try {
//         // Backend: /me uses X-User-Email header
//         const currentUser = await apiFetch<User>("/me", { userEmail: email });
//         setUser(currentUser);
//       } catch (error) {
//         console.error("Auth check failed:", error);
//         localStorage.removeItem(LS_EMAIL_KEY);
//         setUser(null);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     checkAuth();
//   }, []);

//   const login = useCallback(async (email: string, _password: string) => {
//     try {
//       // For now we ignore password; backend auth will come later.
//       const currentUser = await apiFetch<User>("/me", { userEmail: email });

//       localStorage.setItem(LS_EMAIL_KEY, email);
//       setUser(currentUser);

//       return { success: true };
//     } catch (error: any) {
//       const msg =
//         typeof error?.message === "string" ? error.message : "Login failed";
//       return { success: false, error: msg };
//     }
//   }, []);

//   const logout = useCallback(async () => {
//     localStorage.removeItem(LS_EMAIL_KEY);
//     setUser(null);
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, isLoading, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// }

// import React, {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   useCallback,
// } from "react";
// import type { User, AuthContextType , LoginResult} from "@/types";
// import { apiFetch } from "@/api/client";



// // Normalize backend /me shape to your UI User shape (teamId is used in your UI)
// function normalizeUser(apiUser: any): User {
//   return {
//     ...apiUser,
//     teamId: apiUser?.team?.id ?? null,
//   };
// }

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   // On mount: if session cookie exists, /me succeeds.
//   useEffect(() => {
//     const checkAuth = async () => {
//       try {
//         const meRaw = await apiFetch<any>("/me"); // cookie-based
//         setUser(normalizeUser(meRaw));
//       } catch {
//         setUser(null);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     checkAuth();
//   }, []);

//   const login = useCallback(async (email: string, password: string) => {
//   try {
//     await apiFetch<{ success: boolean }>("/auth/login", {
//       method: "POST",
//       body: JSON.stringify({ email, password }),
//     });

//     const meRaw = await apiFetch<any>("/me");
//     const currentUser = normalizeUser(meRaw);

//     setUser(currentUser);
//     return { success: true, user: currentUser } as const;
//   } catch (error: any) {
//     const msg = typeof error?.message === "string" ? error.message : "Login failed";
//     return { success: false, error: msg } as const;
//   }
// }, []);

// }
// const AuthContext = createContext<AuthContextType | undefined>(undefined);
// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// }
import React, { createContext, useContext, useEffect, useCallback, useState } from "react";
import type { User, AuthContextType, LoginResult } from "@/types";
import { apiFetch } from "@/api/client";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Normalize backend /me shape to your UI User shape
function normalizeUser(apiUser: any): User {
  return {
    ...apiUser,
    teamId: apiUser?.team?.id ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: try /me. If cookie exists -> logged in, else -> logged out.
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const meRaw = await apiFetch<any>("/me");
        setUser(normalizeUser(meRaw));
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      // IMPORTANT: this must be POST
      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const meRaw = await apiFetch<any>("/me");
      const currentUser = normalizeUser(meRaw);

      setUser(currentUser);
      return { success: true, user: currentUser };
    } catch (error: any) {
      const msg = typeof error?.message === "string" ? error.message : "Login failed";
      setUser(null);
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      setUser(null);
    }
  }, []);

  const value: AuthContextType = { user, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
