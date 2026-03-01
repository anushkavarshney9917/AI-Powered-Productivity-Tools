"use server";

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

// Use OpenAI API for parsing commands
export async function parseTaskCommand(
  command: string,
  existingTasks: Task[],
): Promise<AIResponse> {
  try {
    // Call the AI API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/ai`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, tasks: existingTasks }),
      },
    );

    if (response.ok) {
      const aiResponse: AIResponse = await response.json();
      return aiResponse;
    }

    // Fallback to regex-based parsing if AI fails
    console.warn("AI API failed, using fallback parser");
    return fallbackParseCommand(command, existingTasks);
  } catch (error) {
    console.error("AI parsing error:", error);
    return fallbackParseCommand(command, existingTasks);
  }
}

// Fallback regex-based parser (original implementation)
function fallbackParseCommand(
  command: string,
  existingTasks: Task[],
): AIResponse {
  const lowerCommand = command.toLowerCase().trim();
  const operations: AITaskOperation[] = [];

  try {
    // Add task patterns
    const addPatterns = [
      /^add\s+(?:task\s+)?["']?(.+?)["']?(?:\s+with\s+(?:priority\s+)?(\w+)\s*priority)?(?:\s+due\s+(.+))?$/i,
      /^create\s+(?:a\s+)?(?:task\s+)?(?:called\s+|named\s+)?["']?(.+?)["']?$/i,
      /^new\s+task[:\s]+["']?(.+?)["']?$/i,
      /^(?:i\s+need\s+to|remind\s+me\s+to)\s+(.+)$/i,
    ];

    for (const pattern of addPatterns) {
      const match = lowerCommand.match(pattern);
      if (match) {
        const title = match[1].trim();
        const priority = parsePriority(
          match[2] || detectPriorityFromText(command),
        );
        const dueDate = match[3] ? parseDueDate(match[3]) : null;

        operations.push({
          action: "add",
          tasks: [
            {
              title: capitalizeFirst(title),
              description: "",
              status: "pending",
              priority,
              due_date: dueDate,
            },
          ],
          message: `Adding task: "${capitalizeFirst(title)}"`,
        });

        return {
          success: true,
          operations,
          message: `I'll add the task "${capitalizeFirst(title)}" for you.`,
        };
      }
    }

    // Complete/finish task patterns
    const completePatterns = [
      /^(?:complete|finish|done|mark\s+(?:as\s+)?(?:complete|done))\s+(?:task\s+)?["']?(.+?)["']?$/i,
      /^(?:i\s+)?(?:finished|completed|done\s+with)\s+["']?(.+?)["']?$/i,
    ];

    for (const pattern of completePatterns) {
      const match = lowerCommand.match(pattern);
      if (match) {
        const searchTerm = match[1].trim();
        const matchedTasks = findTasksBySearch(existingTasks, searchTerm);

        if (matchedTasks.length === 0) {
          return {
            success: false,
            operations: [],
            message: `I couldn't find any task matching "${searchTerm}".`,
            error: "Task not found",
          };
        }

        operations.push({
          action: "complete",
          taskIds: matchedTasks.map((t) => t.id),
          message: `Completing ${matchedTasks.length} task(s)`,
        });

        return {
          success: true,
          operations,
          message: `I'll mark ${matchedTasks.length === 1 ? `"${matchedTasks[0].title}"` : `${matchedTasks.length} tasks`} as completed.`,
        };
      }
    }

    // Delete task patterns
    const deletePatterns = [
      /^(?:delete|remove|cancel)\s+(?:task\s+)?["']?(.+?)["']?$/i,
      /^(?:get\s+rid\s+of|drop)\s+["']?(.+?)["']?$/i,
    ];

    for (const pattern of deletePatterns) {
      const match = lowerCommand.match(pattern);
      if (match) {
        const searchTerm = match[1].trim();
        const matchedTasks = findTasksBySearch(existingTasks, searchTerm);

        if (matchedTasks.length === 0) {
          return {
            success: false,
            operations: [],
            message: `I couldn't find any task matching "${searchTerm}".`,
            error: "Task not found",
          };
        }

        operations.push({
          action: "delete",
          taskIds: matchedTasks.map((t) => t.id),
          message: `Deleting ${matchedTasks.length} task(s)`,
        });

        return {
          success: true,
          operations,
          message: `I'll delete ${matchedTasks.length === 1 ? `"${matchedTasks[0].title}"` : `${matchedTasks.length} tasks`}.`,
        };
      }
    }

    // Update priority patterns
    const priorityPatterns = [
      /^(?:set|change|make)\s+(?:the\s+)?(?:priority\s+(?:of\s+)?)?["']?(.+?)["']?\s+(?:to\s+)?(\w+)(?:\s+priority)?$/i,
      /^(?:make|set)\s+["']?(.+?)["']?\s+(?:as\s+)?(\w+)\s+priority$/i,
    ];

    for (const pattern of priorityPatterns) {
      const match = lowerCommand.match(pattern);
      if (match) {
        const searchTerm = match[1].trim();
        const priority = parsePriority(match[2]);
        const matchedTasks = findTasksBySearch(existingTasks, searchTerm);

        if (matchedTasks.length === 0) {
          return {
            success: false,
            operations: [],
            message: `I couldn't find any task matching "${searchTerm}".`,
            error: "Task not found",
          };
        }

        operations.push({
          action: "bulk_update",
          taskIds: matchedTasks.map((t) => t.id),
          updates: { priority },
          message: `Updating priority to ${priority}`,
        });

        return {
          success: true,
          operations,
          message: `I'll set the priority of ${matchedTasks.length === 1 ? `"${matchedTasks[0].title}"` : `${matchedTasks.length} tasks`} to ${priority}.`,
        };
      }
    }

    // Bulk operations patterns
    if (
      /^(?:delete|remove)\s+(?:all\s+)?completed\s+tasks?$/i.test(lowerCommand)
    ) {
      const completedTasks = existingTasks.filter(
        (t) => t.status === "completed",
      );
      if (completedTasks.length === 0) {
        return {
          success: false,
          operations: [],
          message: "There are no completed tasks to delete.",
        };
      }

      operations.push({
        action: "bulk_delete",
        taskIds: completedTasks.map((t) => t.id),
        message: `Deleting ${completedTasks.length} completed tasks`,
      });

      return {
        success: true,
        operations,
        message: `I'll delete ${completedTasks.length} completed task(s).`,
      };
    }

    if (/^(?:complete|finish)\s+all\s+(?:tasks?)?$/i.test(lowerCommand)) {
      const incompleteTasks = existingTasks.filter(
        (t) => t.status !== "completed",
      );
      if (incompleteTasks.length === 0) {
        return {
          success: false,
          operations: [],
          message: "All tasks are already completed!",
        };
      }

      operations.push({
        action: "bulk_update",
        taskIds: incompleteTasks.map((t) => t.id),
        updates: { status: "completed" },
        message: `Completing ${incompleteTasks.length} tasks`,
      });

      return {
        success: true,
        operations,
        message: `I'll mark ${incompleteTasks.length} task(s) as completed.`,
      };
    }

    // Sort/organize patterns
    if (/^(?:sort|organize)\s+(?:tasks?\s+)?by\s+(\w+)$/i.test(lowerCommand)) {
      const match = lowerCommand.match(/by\s+(\w+)/i);
      const sortField = match?.[1] || "priority";

      return {
        success: true,
        operations: [
          {
            action: "reorder",
            message: `Sorting tasks by ${sortField}`,
          },
        ],
        message: `I'll sort your tasks by ${sortField}. Use the sort dropdown in the toolbar to apply this.`,
      };
    }

    // Add multiple tasks
    const multiAddMatch = lowerCommand.match(
      /^add\s+(?:these\s+)?tasks?[:\s]+(.+)$/i,
    );
    if (multiAddMatch) {
      const taskList = multiAddMatch[1]
        .split(/,\s*|\s+and\s+/i)
        .filter((t) => t.trim());
      const tasks = taskList.map((title) => ({
        title: capitalizeFirst(title.trim()),
        description: "",
        status: "pending" as const,
        priority: "medium" as const,
        due_date: null,
      }));

      operations.push({
        action: "add",
        tasks,
        message: `Adding ${tasks.length} tasks`,
      });

      return {
        success: true,
        operations,
        message: `I'll add ${tasks.length} tasks for you.`,
      };
    }

    // Default: Try to interpret as a new task
    if (lowerCommand.length > 2 && !lowerCommand.includes("?")) {
      operations.push({
        action: "add",
        tasks: [
          {
            title: capitalizeFirst(command.trim()),
            description: "",
            status: "pending",
            priority: detectPriorityFromText(command),
            due_date: null,
          },
        ],
        message: `Adding task: "${capitalizeFirst(command.trim())}"`,
      });

      return {
        success: true,
        operations,
        message: `I'll add "${capitalizeFirst(command.trim())}" as a new task. If this wasn't what you meant, try using commands like "add task", "complete task", or "delete task".`,
      };
    }

    return {
      success: false,
      operations: [],
      message:
        'I couldn\'t understand that command. Try:\n• "Add task: Buy groceries"\n• "Complete meeting notes"\n• "Delete old task"\n• "Set priority of report to high"\n• "Delete all completed tasks"',
    };
  } catch (error) {
    return {
      success: false,
      operations: [],
      message: "An error occurred while processing your request.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper functions
function parsePriority(text: string | undefined): "low" | "medium" | "high" {
  if (!text) return "medium";
  const lower = text.toLowerCase();
  if (
    lower.includes("high") ||
    lower.includes("urgent") ||
    lower.includes("important")
  )
    return "high";
  if (lower.includes("low") || lower.includes("minor")) return "low";
  return "medium";
}

function detectPriorityFromText(text: string): "low" | "medium" | "high" {
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
    lower.includes("whenever") ||
    lower.includes("eventually") ||
    lower.includes("someday")
  ) {
    return "low";
  }
  return "medium";
}

function parseDueDate(text: string): string | null {
  const lower = text.toLowerCase().trim();
  const now = new Date();

  if (lower === "today") {
    return now.toISOString();
  }
  if (lower === "tomorrow") {
    now.setDate(now.getDate() + 1);
    return now.toISOString();
  }
  if (lower.includes("next week")) {
    now.setDate(now.getDate() + 7);
    return now.toISOString();
  }
  if (lower.includes("next month")) {
    now.setMonth(now.getMonth() + 1);
    return now.toISOString();
  }

  // Try parsing as a date
  const parsed = new Date(text);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return null;
}

function findTasksBySearch(tasks: Task[], searchTerm: string): Task[] {
  const lower = searchTerm.toLowerCase();

  // First try exact match
  const exactMatch = tasks.filter((t) => t.title.toLowerCase() === lower);
  if (exactMatch.length > 0) return exactMatch;

  // Then try includes
  const partialMatch = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(lower) ||
      t.description?.toLowerCase().includes(lower),
  );

  return partialMatch;
}

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Get AI suggestions for tasks
export async function getTaskSuggestions(tasks: Task[]): Promise<string[]> {
  try {
    // Try AI-powered suggestions
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/ai?tasks=${encodeURIComponent(JSON.stringify(tasks))}`,
    );

    if (response.ok) {
      const data = await response.json();
      if (data.suggestions && data.suggestions.length > 0) {
        return data.suggestions;
      }
    }
  } catch (error) {
    console.warn("AI suggestions failed, using fallback:", error);
  }

  // Fallback to static suggestions
  return getFallbackSuggestions(tasks);
}

function getFallbackSuggestions(tasks: Task[]): string[] {
  const suggestions: string[] = [];
  const now = new Date();

  // Check for overdue tasks
  const overdueTasks = tasks.filter(
    (t) => t.status !== "completed" && t.due_date && new Date(t.due_date) < now,
  );
  if (overdueTasks.length > 0) {
    suggestions.push(
      `You have ${overdueTasks.length} overdue task(s). Consider reviewing them.`,
    );
  }

  // Check for tasks without due dates
  const noDueDateTasks = tasks.filter(
    (t) => t.status !== "completed" && !t.due_date,
  );
  if (noDueDateTasks.length > 3) {
    suggestions.push(
      `${noDueDateTasks.length} tasks don't have due dates. Setting deadlines can help prioritize.`,
    );
  }

  // Check for many high priority tasks
  const highPriorityTasks = tasks.filter(
    (t) => t.status !== "completed" && t.priority === "high",
  );
  if (highPriorityTasks.length > 5) {
    suggestions.push(
      "You have many high-priority tasks. Consider if all of them are truly urgent.",
    );
  }

  // Check for completed tasks that can be cleaned up
  const completedTasks = tasks.filter((t) => t.status === "completed");
  if (completedTasks.length > 10) {
    suggestions.push(
      `You have ${completedTasks.length} completed tasks. Say "delete all completed tasks" to clean up.`,
    );
  }

  // Suggest if no tasks exist
  if (tasks.length === 0) {
    suggestions.push(
      'Start by adding your first task! Say something like "Add task: Review project proposal"',
    );
  }

  return suggestions;
}
