import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Force dynamic rendering - no caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Use public directory for accessibility in both dev and production
const DATA_FILE = path.join(process.cwd(), "public", "data", "tasks.json");

// Ensure data directory exists
function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ tasks: [] }, null, 2));
  }
}

function readTasks() {
  try {
    ensureDataDir();
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data).tasks;
  } catch (error) {
    console.error("Error reading tasks:", error);
    // Return empty array if file doesn't exist or is corrupted
    return [];
  }
}

function writeTasks(tasks: Task[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify({ tasks }, null, 2));
  } catch (error) {
    console.error("Error writing tasks:", error);
    throw error;
  }
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

// GET all tasks
export async function GET() {
  try {
    const tasks = readTasks();
    return NextResponse.json({ data: tasks, error: null });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: String(error) },
      { status: 500 },
    );
  }
}

// POST create new task
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tasks = readTasks();

    const maxPosition =
      tasks.length > 0 ? Math.max(...tasks.map((t: Task) => t.position)) : 0;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: body.title,
      description: body.description || null,
      status: body.status || "pending",
      priority: body.priority || "medium",
      due_date: body.due_date || null,
      position: maxPosition + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    tasks.push(newTask);
    writeTasks(tasks);

    return NextResponse.json({ data: newTask, error: null });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: String(error) },
      { status: 500 },
    );
  }
}

// PUT update task(s)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const tasks = readTasks();

    // Bulk update
    if (body.ids && Array.isArray(body.ids)) {
      const updatedTasks = tasks.map((task: Task) => {
        if (body.ids.includes(task.id)) {
          return {
            ...task,
            ...body.updates,
            updated_at: new Date().toISOString(),
          };
        }
        return task;
      });
      writeTasks(updatedTasks);
      return NextResponse.json({
        data: updatedTasks.filter((t: Task) => body.ids.includes(t.id)),
        error: null,
      });
    }

    // Single update
    if (body.id) {
      const index = tasks.findIndex((t: Task) => t.id === body.id);
      if (index === -1) {
        return NextResponse.json(
          { data: null, error: "Task not found" },
          { status: 404 },
        );
      }
      tasks[index] = {
        ...tasks[index],
        ...body.updates,
        updated_at: new Date().toISOString(),
      };
      writeTasks(tasks);
      return NextResponse.json({ data: tasks[index], error: null });
    }

    // Reorder
    if (body.reorder && Array.isArray(body.reorder)) {
      const reordered = body.reorder.map((task: Task, index: number) => ({
        ...task,
        position: index,
      }));
      writeTasks(reordered);
      return NextResponse.json({ data: reordered, error: null });
    }

    return NextResponse.json(
      { data: null, error: "Invalid request" },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      { data: null, error: String(error) },
      { status: 500 },
    );
  }
}

// DELETE task(s)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const ids = searchParams.get("ids");

    let tasks = readTasks();

    if (ids) {
      const idList = ids.split(",");
      tasks = tasks.filter((t: Task) => !idList.includes(t.id));
    } else if (id) {
      tasks = tasks.filter((t: Task) => t.id !== id);
    } else {
      return NextResponse.json({ error: "No id provided" }, { status: 400 });
    }

    writeTasks(tasks);
    return NextResponse.json({ error: null });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
