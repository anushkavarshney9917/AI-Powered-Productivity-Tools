"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Workflow } from "@/types/database.types";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkflows = useCallback(async () => {
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

      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch workflows"),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addWorkflow = useCallback(
    async (
      workflow: Omit<Workflow, "id" | "user_id" | "created_at" | "updated_at">,
    ) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
          .from("workflows")
          .insert({ ...workflow, user_id: user.id })
          .select()
          .single();

        if (error) throw error;
        setWorkflows((prev) => [data, ...prev]);
        return { data, error: null };
      } catch (err) {
        return {
          data: null,
          error:
            err instanceof Error ? err : new Error("Failed to add workflow"),
        };
      }
    },
    [],
  );

  const updateWorkflow = useCallback(
    async (id: string, updates: Partial<Workflow>) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
          .from("workflows")
          .update(updates)
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        setWorkflows((prev) => prev.map((w) => (w.id === id ? data : w)));
        return { data, error: null };
      } catch (err) {
        return {
          data: null,
          error:
            err instanceof Error ? err : new Error("Failed to update workflow"),
        };
      }
    },
    [],
  );

  const deleteWorkflow = useCallback(async (id: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("workflows")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
      return { error: null };
    } catch (err) {
      return {
        error:
          err instanceof Error ? err : new Error("Failed to delete workflow"),
      };
    }
  }, []);

  const toggleActive = useCallback(
    async (id: string) => {
      const workflow = workflows.find((w) => w.id === id);
      if (!workflow)
        return { data: null, error: new Error("Workflow not found") };
      return updateWorkflow(id, { is_active: !workflow.is_active });
    },
    [workflows, updateWorkflow],
  );

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  // Real-time subscription
  useEffect(() => {
    let isSubscribed = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscription = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || !isSubscribed) return;

        channel = supabase
          .channel(`workflows-changes-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "workflows",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (!isSubscribed) return;

              if (payload.eventType === "INSERT") {
                setWorkflows((prev) => [payload.new as Workflow, ...prev]);
              } else if (payload.eventType === "UPDATE") {
                setWorkflows((prev) =>
                  prev.map((w) =>
                    w.id === payload.new.id ? (payload.new as Workflow) : w,
                  ),
                );
              } else if (payload.eventType === "DELETE") {
                setWorkflows((prev) =>
                  prev.filter((w) => w.id !== payload.old.id),
                );
              }
            },
          )
          .subscribe();
      } catch {
        // Ignore subscription errors
      }
    };

    setupSubscription();

    return () => {
      isSubscribed = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const stats = {
    total: workflows.length,
    active: workflows.filter((w) => w.is_active).length,
    inactive: workflows.filter((w) => !w.is_active).length,
  };

  return {
    workflows,
    stats,
    isLoading,
    error,
    refetch: fetchWorkflows,
    addWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleActive,
  };
}
