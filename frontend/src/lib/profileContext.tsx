import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { supabase, type LifestyleProfileRow } from "./supabase";
import type { User } from "@supabase/supabase-js";

export interface ProfilesContextValue {
  profiles: LifestyleProfileRow[];
  activeProfile: LifestyleProfileRow | null;
  /** Deactivate all of the user's profiles, then activate the target (persisted + optimistic). */
  switchActive: (id: string) => void;
  /** Re-read the user's profiles from Supabase. */
  refreshProfiles: () => void;
}

export const ProfilesCtx = createContext<ProfilesContextValue>({
  profiles: [],
  activeProfile: null,
  switchActive: () => {},
  refreshProfiles: () => {},
});

export function useProfiles() {
  return useContext(ProfilesCtx);
}

export function ProfilesProvider({ user, children }: { user: User | null; children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<LifestyleProfileRow[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      setProfiles([]);
      return;
    }
    const { data } = await supabase
      .from("lifestyle_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false });
    setProfiles((data as LifestyleProfileRow[]) ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [user]);

  const switchActive = useCallback(
    (id: string) => {
      // Optimistic local update so the top-bar pill flips instantly.
      setProfiles((prev) => prev.map((p) => ({ ...p, is_active: p.id === id })));
      if (!user) return;
      void (async () => {
        await supabase.from("lifestyle_profiles").update({ is_active: false }).eq("user_id", user.id);
        await supabase.from("lifestyle_profiles").update({ is_active: true }).eq("id", id);
      })();
    },
    [user],
  );

  const value = useMemo(
    () => ({
      profiles,
      activeProfile: profiles.find((p) => p.is_active) ?? null,
      switchActive,
      refreshProfiles: () => void load(),
    }),
    [profiles, switchActive, load],
  );

  return <ProfilesCtx.Provider value={value}>{children}</ProfilesCtx.Provider>;
}