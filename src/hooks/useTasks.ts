"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Task } from "@/types/database.types";

// Client-side localStorage storage - works on Vercel!
const STORAGE_KEY = "focus-forge-tasks";

export type SortField =
  | "position"
  | "created_at"
  | "due_date"
  | "priority"
  | "title"
  | "status";
export type SortDirection = "asc" | "desc";
export type FilterStatus = "all" | "pending" | "in-progress" | "completed";
export type FilterPriority = "all" | "low" | "medium" | "high";

interface TaskFilters {
  status: FilterStatus;
  priority: FilterPriority;
  search: string;
}

interface TaskSort {
  field: SortField;
  direction: SortDirection;
}

const priorityOrder = { high: 3, medium: 2, low: 1 };
const statusOrder = { "in-progress": 3, pending: 2, completed: 1 };

// Helper functions for localStorage
function getStoredTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredTasks(tasks: Task[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Failed to save tasks to localStorage:", error);
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    status: "all",
    priority: "all",
    search: "",
  });
  const [sort, setSort] = useState<TaskSort>({
    field: "position",
    direction: "asc",
  });

  // Persist tasks to localStorage whenever they change
  useEffect(() => {
    if (!isLoading && tasks.length >= 0) {
      setStoredTasks(tasks);
    }
  }, [tasks, isLoading]);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load from localStorage (client-side)
      const storedTasks = getStoredTasks();
      setTasks(storedTasks);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch tasks"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addTask = useCallback(
    async (
      task: Omit<
        Task,
        "id" | "user_id" | "created_at" | "updated_at" | "position"
      >,
    ) => {
      try {
        const currentTasks = getStoredTasks();
        const maxPosition =
          currentTasks.length > 0
            ? Math.max(...currentTasks.map((t) => t.position))
            : 0;

        const newTask: Task = {
          id: crypto.randomUUID(),
          user_id: "local-user",
          title: task.title,
          description: task.description || null,
          status: task.status || "pending",
          priority: task.priority || "medium",
          due_date: task.due_date || null,
          position: maxPosition + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setTasks((prev) => [...prev, newTask]);
        return { data: newTask, error: null };
      } catch (err) {
        return {
          data: null,
          error: err instanceof Error ? err : new Error("Failed to add task"),
        };
      }
    },
    [],
  );

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      let updatedTask: Task | null = null;
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === id) {
            updatedTask = {
              ...t,
              ...updates,
              updated_at: new Date().toISOString(),
            };
            return updatedTask;
          }
          return t;
        }),
      );
      return { data: updatedTask, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Failed to update task"),
      };
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error("Failed to delete task"),
      };
    }
  }, []);

  const bulkDelete = useCallback(async (ids: string[]) => {
    try {
      setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error("Failed to delete tasks"),
      };
    }
  }, []);

  const bulkUpdate = useCallback(
    async (ids: string[], updates: Partial<Task>) => {
      try {
        setTasks((prev) =>
          prev.map((t) =>
            ids.includes(t.id)
              ? { ...t, ...updates, updated_at: new Date().toISOString() }
              : t,
          ),
        );
        return { error: null };
      } catch (err) {
        return {
          error:
            err instanceof Error ? err : new Error("Failed to update tasks"),
        };
      }
    },
    [],
  );

  const reorderTasks = useCallback(async (reorderedTasks: Task[]) => {
    try {
      const tasksWithPositions = reorderedTasks.map((task, index) => ({
        ...task,
        position: index,
        updated_at: new Date().toISOString(),
      }));
      setTasks(tasksWithPositions);
      return { error: null };
    } catch (err) {
      return {
        error:
          err instanceof Error ? err : new Error("Failed to reorder tasks"),
      };
    }
  }, []);

  const updateStatus = useCallback(
    async (id: string, status: "pending" | "in-progress" | "completed") => {
      return updateTask(id, { status });
    },
    [updateTask],
  );

  const toggleComplete = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return { data: null, error: new Error("Task not found") };
      const newStatus = task.status === "completed" ? "pending" : "completed";
      return updateTask(id, { status: newStatus });
    },
    [tasks, updateTask],
  );

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Apply filters
    if (filters.status !== "all") {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters.priority !== "all") {
      result = result.filter((t) => t.priority === filters.priority);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.description?.toLowerCase().includes(search),
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sort.field) {
        case "position":
          comparison = a.position - b.position;
          break;
        case "created_at":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "due_date":
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else
            comparison =
              new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case "priority":
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        case "status":
          comparison = statusOrder[b.status] - statusOrder[a.status];
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sort.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [tasks, filters, sort]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "completed").length,
      pending: tasks.filter((t) => t.status === "pending").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
      overdue: tasks.filter(
        (t) =>
          t.status !== "completed" &&
          t.due_date &&
          new Date(t.due_date) < new Date(),
      ).length,
    }),
    [tasks],
  );

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    stats,
    isLoading,
    error,
    filters,
    sort,
    setFilters,
    setSort,
    refetch: fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    bulkDelete,
    bulkUpdate,
    reorderTasks,
    toggleComplete,
    updateStatus,
  };
}
