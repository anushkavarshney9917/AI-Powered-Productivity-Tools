"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { UserSettings } from "@/types/database.types";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError(new Error("Not authenticated"));
        return;
      }

      let { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // If no settings exist, create default ones
      if (error?.code === "PGRST116") {
        const { data: newSettings, error: createError } = await supabase
          .from("user_settings")
          .insert({
            user_id: user.id,
            theme: "system",
            notifications_enabled: true,
            email_notifications: true,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          })
          .select()
          .single();

        if (createError) throw createError;
        data = newSettings;
        error = null;
      }

      if (error) throw error;
      setSettings(data);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch settings"),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_settings")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error:
          err instanceof Error ? err : new Error("Failed to update settings"),
      };
    }
  }, []);

  const updateTheme = useCallback(
    async (theme: "light" | "dark" | "system") => {
      return updateSettings({ theme });
    },
    [updateSettings],
  );

  const toggleNotifications = useCallback(
    async (enabled: boolean) => {
      return updateSettings({ notifications_enabled: enabled });
    },
    [updateSettings],
  );

  const toggleEmailNotifications = useCallback(
    async (enabled: boolean) => {
      return updateSettings({ email_notifications: enabled });
    },
    [updateSettings],
  );

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    refetch: fetchSettings,
    updateSettings,
    updateTheme,
    toggleNotifications,
    toggleEmailNotifications,
  };
}
