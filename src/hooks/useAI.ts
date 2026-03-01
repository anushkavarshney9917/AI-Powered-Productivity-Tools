"use client";

import { useState, useCallback } from "react";
import type { Task } from "@/types/database.types";

// Types for AI task operations
export interface AITaskOperation {
  action:
    | "add"
    | "update"
    | "delete"
    | "complete"
    | "reorder"
    | "bulk_update"
    | "bulk_delete";
  tasks?: Partial<Task>[];
  taskIds?: string[];
  updates?: Partial<Task>;
  message: string;
}

export interface AIResponse {
  success: boolean;
  operations: AITaskOperation[];
  message: string;
  error?: string;
}

export function useAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);

  const parseCommand = useCallback(
    async (command: string, tasks: Task[]): Promise<AIResponse> => {
      setIsProcessing(true);
      setLastResponse(null);

      try {
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command, tasks }),
        });

        if (response.ok) {
          const aiResponse: AIResponse = await response.json();
          setLastResponse(aiResponse);
          return aiResponse;
        }

        // Fallback response if API fails
        const fallbackResponse = fallbackParse(command, tasks);
        setLastResponse(fallbackResponse);
        return fallbackResponse;
      } catch (error) {
        console.error("AI parsing error:", error);
        const fallbackResponse = fallbackParse(command, tasks);
        setLastResponse(fallbackResponse);
        return fallbackResponse;
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  const getSuggestions = useCallback(
    async (tasks: Task[]): Promise<string[]> => {
      try {
        const response = await fetch(
          `/api/ai?tasks=${encodeURIComponent(JSON.stringify(tasks))}`,
        );

        if (response.ok) {
          const data = await response.json();
          return data.suggestions || [];
        }
      } catch (error) {
        console.warn("Failed to get AI suggestions:", error);
      }

      return getDefaultSuggestions(tasks);
    },
    [],
  );

  return {
    parseCommand,
    getSuggestions,
    isProcessing,
    lastResponse,
  };
}

// Fallback parser for when AI API is unavailable
function fallbackParse(command: string, tasks: Task[]): AIResponse {
  const lowerCommand = command.toLowerCase().trim();
  const operations: AITaskOperation[] = [];

  // Simple add task pattern
  const addMatch = lowerCommand.match(
    /^(?:add|create|new)\s+(?:task)?[:\s]*(.+)$/i,
  );
  if (addMatch) {
    const title = addMatch[1].trim();
    operations.push({
      action: "add",
      tasks: [
        {
          title: title.charAt(0).toUpperCase() + title.slice(1),
          description: "",
          status: "pending",
          priority: detectPriority(command),
          due_date: null,
        },
      ],
      message: `Adding task: "${title}"`,
    });

    return {
      success: true,
      operations,
      message: `I'll add "${title}" as a new task.`,
    };
  }

  // Complete task pattern
  const completeMatch = lowerCommand.match(
    /^(?:complete|finish|done|mark\s+(?:as\s+)?(?:complete|done))\s+(.+)$/i,
  );
  if (completeMatch) {
    const searchTerm = completeMatch[1].trim();
    const matchedTasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(searchTerm) ||
        t.description?.toLowerCase().includes(searchTerm),
    );

    if (matchedTasks.length > 0) {
      operations.push({
        action: "complete",
        taskIds: matchedTasks.map((t) => t.id),
        message: `Completing ${matchedTasks.length} task(s)`,
      });

      return {
        success: true,
        operations,
        message: `Marking ${matchedTasks.length} task(s) as completed.`,
      };
    }

    return {
      success: false,
      operations: [],
      message: `Couldn't find any tasks matching "${searchTerm}".`,
    };
  }

  // Delete task pattern
  const deleteMatch = lowerCommand.match(/^(?:delete|remove)\s+(.+)$/i);
  if (deleteMatch) {
    const searchTerm = deleteMatch[1].trim();

    // Delete completed tasks
    if (searchTerm.includes("completed")) {
      const completedTasks = tasks.filter((t) => t.status === "completed");
      if (completedTasks.length > 0) {
        operations.push({
          action: "bulk_delete",
          taskIds: completedTasks.map((t) => t.id),
          message: `Deleting ${completedTasks.length} completed task(s)`,
        });

        return {
          success: true,
          operations,
          message: `Deleting ${completedTasks.length} completed task(s).`,
        };
      }

      return {
        success: false,
        operations: [],
        message: "No completed tasks to delete.",
      };
    }

    // Delete all tasks
    if (searchTerm === "all" || searchTerm === "all tasks") {
      if (tasks.length > 0) {
        operations.push({
          action: "bulk_delete",
          taskIds: tasks.map((t) => t.id),
          message: `Deleting all ${tasks.length} task(s)`,
        });

        return {
          success: true,
          operations,
          message: `Deleting all ${tasks.length} task(s).`,
        };
      }

      return {
        success: false,
        operations: [],
        message: "No tasks to delete.",
      };
    }

    // Delete specific task
    const matchedTasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(searchTerm) ||
        t.description?.toLowerCase().includes(searchTerm),
    );

    if (matchedTasks.length > 0) {
      operations.push({
        action: "delete",
        taskIds: matchedTasks.map((t) => t.id),
        message: `Deleting ${matchedTasks.length} task(s)`,
      });

      return {
        success: true,
        operations,
        message: `Deleting ${matchedTasks.length} task(s).`,
      };
    }

    return {
      success: false,
      operations: [],
      message: `Couldn't find any tasks matching "${searchTerm}".`,
    };
  }

  // Complete all tasks
  if (lowerCommand.includes("complete all")) {
    const incompleteTasks = tasks.filter((t) => t.status !== "completed");
    if (incompleteTasks.length > 0) {
      operations.push({
        action: "bulk_update",
        taskIds: incompleteTasks.map((t) => t.id),
        updates: { status: "completed" },
        message: `Completing all ${incompleteTasks.length} task(s)`,
      });

      return {
        success: true,
        operations,
        message: `Marking all ${incompleteTasks.length} task(s) as completed.`,
      };
    }

    return {
      success: false,
      operations: [],
      message: "All tasks are already completed!",
    };
  }

  // Default: treat as new task
  if (command.length > 2 && !command.includes("?")) {
    const title = command.charAt(0).toUpperCase() + command.slice(1);
    operations.push({
      action: "add",
      tasks: [
        {
          title,
          description: "",
          status: "pending",
          priority: detectPriority(command),
          due_date: null,
        },
      ],
      message: `Adding task: "${title}"`,
    });

    return {
      success: true,
      operations,
      message: `I'll add "${title}" as a new task.`,
    };
  }

  return {
    success: false,
    operations: [],
    message:
      'I couldn\'t understand that. Try commands like:\n• "Add task: Buy groceries"\n• "Complete meeting notes"\n• "Delete completed tasks"',
  };
}

function detectPriority(text: string): "low" | "medium" | "high" {
  const lower = text.toLowerCase();
  if (
    lower.includes("urgent") ||
    lower.includes("asap") ||
    lower.includes("important") ||
    lower.includes("critical")
  ) {
    return "high";
  }
  if (
    lower.includes("later") ||
    lower.includes("someday") ||
    lower.includes("eventually")
  ) {
    return "low";
  }
  return "medium";
}

function getDefaultSuggestions(tasks: Task[]): string[] {
  const suggestions: string[] = [];
  const now = new Date();

  if (tasks.length === 0) {
    return [
      "Add task: Plan my week",
      "Add task: Review project proposal",
      "Create a high priority task",
    ];
  }

  const overdueTasks = tasks.filter(
    (t) => t.status !== "completed" && t.due_date && new Date(t.due_date) < now,
  );
  if (overdueTasks.length > 0) {
    suggestions.push(`You have ${overdueTasks.length} overdue task(s)`);
  }

  const completedTasks = tasks.filter((t) => t.status === "completed");
  if (completedTasks.length > 3) {
    suggestions.push("Delete completed tasks");
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  if (pendingTasks.length > 0) {
    suggestions.push("Complete all tasks");
  }

  suggestions.push("Add a new task");

  return suggestions.slice(0, 4);
}
