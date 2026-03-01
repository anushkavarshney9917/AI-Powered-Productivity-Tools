"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Profile, ProfileUpdate } from "@/types/database.types";

export async function getProfile(): Promise<{
  data: Profile | null;
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
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { data, error: error ? new Error(error.message) : null };
}

export async function updateProfile(
  updates: ProfileUpdate,
): Promise<{ data: Profile | null; error: Error | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error("Not authenticated") };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (!error) {
    revalidatePath("/settings");
    revalidatePath("/dashboard");
  }

  return { data, error: error ? new Error(error.message) : null };
}

export async function uploadAvatar(
  file: File,
): Promise<{
  data: { path: string; url: string } | null;
  error: Error | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error("Not authenticated") };
  }

  // Create unique file name
  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    return { data: null, error: new Error(uploadError.message) };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  // Update profile with new avatar URL
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) {
    return { data: null, error: new Error(updateError.message) };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { data: { path: filePath, url: publicUrl }, error: null };
}
