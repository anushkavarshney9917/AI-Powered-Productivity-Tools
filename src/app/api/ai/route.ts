import { NextResponse } from "next/server";

// Force dynamic rendering - no caching for AI responses
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_KEY = process.env.AI_API_KEY;
const MODEL = process.env.AI_MODEL || "gpt-4o-mini";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  position: number;
}

interface AIOperation {
  action:
    | "add"
    | "update"
    | "delete"
    | "complete"
    | "bulk_update"
    | "bulk_delete";
  tasks?: Partial<Task>[];
  taskIds?: string[];
  updates?: Partial<Task>;
  message: string;
}

interface AIResponse {
  success: boolean;
  operations: AIOperation[];
  message: string;
  error?: string;
}

const SYSTEM_PROMPT = `You are a helpful task management AI assistant for "Focus Forge". 
Your job is to interpret natural language commands and convert them into structured task operations.

Current date: ${new Date().toISOString().split("T")[0]}

You can perform these actions:
- add: Create new tasks (can add MULTIPLE tasks at once)
- complete: Mark tasks as completed
- delete: Remove tasks
- update: Modify task properties (title, description, priority, status, due_date)
- bulk_update: Update multiple tasks at once
- bulk_delete: Delete multiple tasks at once

Priority levels: "low", "medium", "high"
Status options: "pending", "in-progress", "completed"

When the user gives a command, respond with a JSON object:
{
  "success": true/false,
  "operations": [
    {
      "action": "add|complete|delete|update|bulk_update|bulk_delete",
      "tasks": [{ "title": "...", "description": "...", "priority": "...", "status": "...", "due_date": "YYYY-MM-DD or null" }], // for add - CAN BE MULTIPLE TASKS
      "taskIds": ["id1", "id2"], // for complete/delete/update/bulk operations
      "updates": { "priority": "...", "status": "..." }, // for update/bulk_update
      "message": "Human readable description of this operation"
    }
  ],
  "message": "Friendly response to user"
}

IMPORTANT RULES:
1. When user asks to "plan", "break down", "create a plan for", or similar - CREATE MULTIPLE SPECIFIC TASKS, not one generic task. For example:
   - "Plan my shopping" → Create tasks like: "Make shopping list", "Check budget", "Research stores", "Schedule shopping trip", "Go shopping"
   - "Plan my week" → Create tasks for different days/activities
   - "Plan a party" → Create tasks like: "Create guest list", "Choose venue", "Plan menu", "Send invitations", "Buy decorations"
2. For adding tasks, extract the title and infer priority from urgency words (urgent/asap/important = high, normal = medium, later/someday = low)
3. For date references like "tomorrow", "next week", "Friday", convert to actual YYYY-MM-DD dates
4. When completing/deleting/updating tasks, match user's description to existing task titles (fuzzy match)
5. If you can't understand the command, set success: false and explain in message
6. Keep messages friendly and concise
7. Always return valid JSON only, no markdown or extra text
8. Be proactive - when user asks for a plan, generate 4-7 actionable subtasks with clear titles and descriptions
9. PRIORITIZATION: When user asks to "prioritize", "sort by priority", "what should I focus on", "order by importance", "help me prioritize", or similar:
   - Analyze ALL existing tasks based on: urgency (due dates), importance (keywords in title/description), and current priority
   - Use bulk_update to SET APPROPRIATE PRIORITIES for each task (high/medium/low)
   - Tasks with urgent deadlines or critical keywords → high priority
   - Regular tasks → medium priority  
   - Tasks that can wait or have "later/someday" → low priority
   - Return a message explaining WHY you prioritized each task the way you did`;

export async function POST(request: Request) {
  if (!API_KEY) {
    return NextResponse.json(
      {
        success: false,
        operations: [],
        message: "AI API key not configured",
        error: "Missing API key",
      },
      { status: 500 },
    );
  }

  try {
    const { command, tasks } = await request.json();

    if (!command || typeof command !== "string") {
      return NextResponse.json(
        {
          success: false,
          operations: [],
          message: "No command provided",
          error: "Invalid request",
        },
        { status: 400 },
      );
    }

    const existingTasksContext =
      tasks && tasks.length > 0
        ? `\n\nExisting tasks:\n${tasks.map((t: Task) => `- ID: ${t.id}, Title: "${t.title}", Status: ${t.status}, Priority: ${t.priority}${t.due_date ? `, Due: ${t.due_date}` : ""}`).join("\n")}`
        : "\n\nNo existing tasks.";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + existingTasksContext },
          { role: "user", content: command },
        ],
        temperature: 0.3,
        max_completion_tokens: 1000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        {
          success: false,
          operations: [],
          message: "AI service error",
          error: errorData,
        },
        { status: 500 },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          operations: [],
          message: "No response from AI",
          error: "Empty response",
        },
        { status: 500 },
      );
    }

    const aiResponse: AIResponse = JSON.parse(content);
    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error("AI route error:", error);
    return NextResponse.json(
      {
        success: false,
        operations: [],
        message: "Failed to process command",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// GET endpoint for AI suggestions
export async function GET(request: Request) {
  if (!API_KEY) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tasksParam = searchParams.get("tasks");
    const tasks: Task[] = tasksParam ? JSON.parse(tasksParam) : [];

    const taskSummary =
      tasks.length > 0
        ? tasks.map((t) => `${t.title} (${t.status}, ${t.priority})`).join(", ")
        : "No tasks yet";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              'Generate 3-4 helpful task management command suggestions. Return JSON: { "suggestions": ["suggestion1", "suggestion2", ...] }. Keep suggestions short and actionable.',
          },
          {
            role: "user",
            content: `Current tasks: ${taskSummary}. Suggest useful commands the user might want to run.`,
          },
        ],
        temperature: 0.7,
        max_completion_tokens: 200,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ suggestions: getDefaultSuggestions(tasks) });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      const parsed = JSON.parse(content);
      return NextResponse.json({ suggestions: parsed.suggestions || [] });
    }

    return NextResponse.json({ suggestions: getDefaultSuggestions(tasks) });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}

function getDefaultSuggestions(tasks: Task[]): string[] {
  const suggestions: string[] = [];

  if (tasks.length === 0) {
    suggestions.push("Add task: Plan my week");
    suggestions.push("Add a high priority task");
  } else {
    const pending = tasks.filter((t) => t.status === "pending").length;
    const completed = tasks.filter((t) => t.status === "completed").length;

    if (pending > 0) {
      suggestions.push("Complete all tasks");
    }
    if (completed > 0) {
      suggestions.push("Delete completed tasks");
    }
    suggestions.push("Add a new task");
  }

  return suggestions;
}
