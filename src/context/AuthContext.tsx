import { createContext, useContext, useEffect, useState } from "react";
import {
  login as loginUser,
  logout as logoutUser,
  getCurrentUser,
} from "../services/authServices";

import { supabase } from "../lib/supabase";

import type { User } from "@supabase/supabase-js";
import { getCurrentProfile } from "../services/profileServices";
import type { Profile } from "../types/profile";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  profile: Profile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          const currentProfile = await getCurrentProfile(currentUser.id);
          setProfile(currentProfile);
        }
        setUser(currentUser);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setUser(null);
        setProfile(null);
        return;
      }
      setUser(session.user);
      const profile = await getCurrentProfile(session.user.id);
      setProfile(profile);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, password: string) {
    await loginUser(email, password);
  }

  async function logout() {
    await logoutUser();
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        profile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
