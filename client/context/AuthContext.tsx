"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { userAuthMethods } from "@/services/methods/userMethods";

export type UserRole = "center_owner" | "teacher";

interface AuthUser {
  id?: string;
  name?: string | null;
  username?: string | null;
  role: UserRole;
  centerId?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  isOwner: boolean;
  isTeacher: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  isOwner: false,
  isTeacher: false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await userAuthMethods.me();
        if (!active) return;
        if (res?.ok && res.data?.role) {
          setUser({
            id: res.data.userId || res.data.id || res.data._id,
            name: res.data.name ?? null,
            username: res.data.username ?? null,
            role: res.data.role as UserRole,
            centerId: res.data.centerId,
          });
        } else {
          // Assume teacher if not determined — lower privilege default
          setUser({ role: "teacher" });
        }
      } catch {
        setUser({ role: "teacher" });
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const role = user?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isOwner: role === "center_owner",
        isTeacher: role === "teacher",
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
