"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserSettings, UserSettingsUpdate } from "@/types/database.types";

export async function getSettings(): Promise<{
  data: UserSettings | null;
  error: Error | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error("Not authenticated") };
  }

  const { data, error } = await supabase
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

    return {
      data: newSettings,
      error: createError ? new Error(createError.message) : null,
    };
  }

  return { data, error: error ? new Error(error.message) : null };
}

export async function updateSettings(
  updates: UserSettingsUpdate,
): Promise<{ data: UserSettings | null; error: Error | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error("Not authenticated") };
  }

  const { data, error } = await supabase
    .from("user_settings")
    .update(updates)
    .eq("user_id", user.id)
    .select()
    .single();

  if (!error) {
    revalidatePath("/settings");
  }

  return { data, error: error ? new Error(error.message) : null };
}

export async function updateTheme(
  theme: "light" | "dark" | "system",
): Promise<{ data: UserSettings | null; error: Error | null }> {
  return updateSettings({ theme });
}

export async function toggleNotifications(
  enabled: boolean,
): Promise<{ data: UserSettings | null; error: Error | null }> {
  return updateSettings({ notifications_enabled: enabled });
}

export async function toggleEmailNotifications(
  enabled: boolean,
): Promise<{ data: UserSettings | null; error: Error | null }> {
  return updateSettings({ email_notifications: enabled });
}
