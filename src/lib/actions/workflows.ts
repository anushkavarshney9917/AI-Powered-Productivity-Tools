"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  Workflow,
  WorkflowInsert,
  WorkflowUpdate,
} from "@/types/database.types";

export async function getWorkflows(): Promise<{
  data: Workflow[] | null;
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
    .from("workflows")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return { data, error: error ? new Error(error.message) : null };
}

export async function getWorkflow(
  id: string,
): Promise<{ data: Workflow | null; error: Error | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error("Not authenticated") };
  }

  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return { data, error: error ? new Error(error.message) : null };
}

export async function createWorkflow(
  workflow: Omit<WorkflowInsert, "user_id">,
): Promise<{ data: Workflow | null; error: Error | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error("Not authenticated") };
  }

  const { data, error } = await supabase
    .from("workflows")
    .insert({ ...workflow, user_id: user.id })
    .select()
    .single();

  if (!error) {
    revalidatePath("/dashboard");
  }

  return { data, error: error ? new Error(error.message) : null };
}

export async function updateWorkflow(
  id: string,
  updates: WorkflowUpdate,
): Promise<{ data: Workflow | null; error: Error | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error("Not authenticated") };
  }

  const { data, error } = await supabase
    .from("workflows")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (!error) {
    revalidatePath("/dashboard");
  }

  return { data, error: error ? new Error(error.message) : null };
}

export async function deleteWorkflow(
  id: string,
): Promise<{ error: Error | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: new Error("Not authenticated") };
  }

  const { error } = await supabase
    .from("workflows")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (!error) {
    revalidatePath("/dashboard");
  }

  return { error: error ? new Error(error.message) : null };
}

export async function toggleWorkflowActive(
  id: string,
): Promise<{ data: Workflow | null; error: Error | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error("Not authenticated") };
  }

  // First get the current workflow
  const { data: workflow } = await supabase
    .from("workflows")
    .select("is_active")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!workflow) {
    return { data: null, error: new Error("Workflow not found") };
  }

  const { data, error } = await supabase
    .from("workflows")
    .update({ is_active: !workflow.is_active })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (!error) {
    revalidatePath("/dashboard");
  }

  return { data, error: error ? new Error(error.message) : null };
}
