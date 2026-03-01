"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Task, TaskInsert, TaskUpdate } from "@/types/database.types";

export async function getTasks(): Promise<{
  data: Task[] | null;
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
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return { data, error: error ? new Error(error.message) : null };
}

export async function getTask(
  id: string,
): Promise<{ data: Task | null; error: Error | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error("Not authenticated") };
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return { data, error: error ? new Error(error.message) : null };
}

export async function createTask(
  task: Omit<TaskInsert, "user_id">,
): Promise<{ data: Task | null; error: Error | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error("Not authenticated") };
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...task, user_id: user.id })
    .select()
    .single();

  if (!error) {
    revalidatePath("/dashboard");
  }

  return { data, error: error ? new Error(error.message) : null };
}

export async function updateTask(
  id: string,
  updates: TaskUpdate,
): Promise<{ data: Task | null; error: Error | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error("Not authenticated") };
  }

  const { data, error } = await supabase
    .from("tasks")
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

export async function deleteTask(id: string): Promise<{ error: Error | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: new Error("Not authenticated") };
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (!error) {
    revalidatePath("/dashboard");
  }

  return { error: error ? new Error(error.message) : null };
}

export async function toggleTaskComplete(
  id: string,
): Promise<{ data: Task | null; error: Error | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error("Not authenticated") };
  }

  // First get the current task
  const { data: task } = await supabase
    .from("tasks")
    .select("status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!task) {
    return { data: null, error: new Error("Task not found") };
  }

  const newStatus = task.status === "completed" ? "pending" : "completed";

  const { data, error } = await supabase
    .from("tasks")
    .update({ status: newStatus })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (!error) {
    revalidatePath("/dashboard");
  }

  return { data, error: error ? new Error(error.message) : null };
}

export async function getTaskStats(): Promise<{
  data: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    overdue: number;
  } | null;
  error: Error | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error("Not authenticated") };
  }

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("status, due_date")
    .eq("user_id", user.id);

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  const now = new Date();
  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    overdue: tasks.filter(
      (t) =>
        t.status !== "completed" && t.due_date && new Date(t.due_date) < now,
    ).length,
  };

  return { data: stats, error: null };
}
