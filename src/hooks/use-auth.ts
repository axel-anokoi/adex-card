"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session and profile
    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Fetch user profile to get role
          const { data: profileData, error } = await supabase
            .from("users")
            .select("id, email, role, nom, prenoms, photo_profile, created_at")
            .eq("id", user.id)
            .single();

          if (!error && profileData) {
            setProfile(profileData as UserProfile);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    }

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Fetch user profile on auth change
        const { data: profileData, error } = await supabase
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
  }, [supabase]);

return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isAdmin: profile?.role === "admin",
    isClient: profile?.role === "client",
    supabase,
  };
}
