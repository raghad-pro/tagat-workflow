"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tokenService } from "@/services/tokenServices";
import type { User } from "@/modules/auth/types/auth.types";

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isAuthenticated: false,
  isLoading: true,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!tokenService.hasToken()) {
      setIsLoading(false);
      return;
    }

    // TODO: استبدل بـ authService.me() لما الباك يضيف /auth/me
    try {
      const saved = localStorage.getItem("user");
      if (saved) setUser(JSON.parse(saved));
      else tokenService.removeToken();
    } catch {
      tokenService.removeToken();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // لما setUser بيتعمل (login/register)، احفظ المستخدم في localStorage
  const handleSetUser = (u: User | null) => {
    setUser(u);
    if (u) localStorage.setItem("user", JSON.stringify(u));
    else localStorage.removeItem("user");
  };

  const logout = () => {
    tokenService.removeToken();
    handleSetUser(null);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: handleSetUser,
        isAuthenticated: !!user,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);