"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

type UserRole = "client" | "admin";

interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  nom?: string;
  prenoms?: string;
  photo_profile?: string;
  created_at?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(supabase !== null);

  useEffect(() => {
    if (!supabase) return;
    console.log("useAuth initializing with supabase:", supabase);

    const sb = supabase;

    async function getUser() {
      try {
        const { data, error } = await sb.auth.getUser();
        console.log("useAuth getUser:", { data, error });
        if (error || !data.user) {
          setLoading(false);
          return;
        }

        const currentUser = data.user;
        setUser(currentUser);

        const { data: profileData, error: profileError } = await sb
          .from("users")
          .select("id, email, role, nom, prenoms, photo_profile, created_at")
          .eq("id", currentUser.id)
          .single();

        if (!profileError && profileData) {
          setProfile(profileData as UserProfile);
        }
      } catch (error) {
        console.error("useAuth getUser error:", error);
      } finally {
        setLoading(false);
      }
    }

    getUser();

    const { data: { subscription } } = sb.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profileData, error } = await sb
          .from("users")
          .select("id, email, role, nom, prenoms, photo_profile, created_at")
          .eq("id", currentUser.id)
          .single();

        if (!error && profileData) {
          setProfile(profileData as UserProfile);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isAdmin: profile?.role === "admin",
    isClient: profile?.role === "client",
  };
}
