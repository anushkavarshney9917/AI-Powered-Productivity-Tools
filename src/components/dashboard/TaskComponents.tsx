"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import type { Task } from "@/types/database.types";
import { useAI, type AIResponse } from "@/hooks/useAI";

interface AICommandPanelProps {
  tasks: Task[];
  onAddTask: (
    task: Omit<
      Task,
      "id" | "user_id" | "created_at" | "updated_at" | "position"
    >,
  ) => Promise<{ data: Task | null; error: Error | null }>;
  onUpdateTask: (
    id: string,
    updates: Partial<Task>,
  ) => Promise<{ data: Task | null; error: Error | null }>;
  onDeleteTask: (id: string) => Promise<{ error: Error | null }>;
  onBulkDelete: (ids: string[]) => Promise<{ error: Error | null }>;
  onBulkUpdate: (
    ids: string[],
    updates: Partial<Task>,
  ) => Promise<{ error: Error | null }>;
}

export default function AICommandPanel({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onBulkDelete,
  onBulkUpdate,
}: AICommandPanelProps) {
  const { parseCommand, getSuggestions, isProcessing: aiProcessing } = useAI();
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get suggestions when panel opens
    if (showPanel) {
      getSuggestions(tasks).then(setSuggestions);
    }
  }, [showPanel, tasks, getSuggestions]);

  const executeOperations = async (operations: AIResponse["operations"]) => {
    for (const op of operations) {
      switch (op.action) {
        case "add":
          if (op.tasks) {
            for (const task of op.tasks) {
              await onAddTask({
                title: task.title || "",
                description: task.description || "",
                status: task.status || "pending",
                priority: task.priority || "medium",
                due_date: task.due_date || null,
              });
            }
          }
          break;

        case "complete":
          if (op.taskIds) {
            await onBulkUpdate(op.taskIds, { status: "completed" });
          }
          break;

        case "delete":
          if (op.taskIds) {
            for (const id of op.taskIds) {
              await onDeleteTask(id);
            }
          }
          break;

        case "bulk_delete":
          if (op.taskIds) {
            await onBulkDelete(op.taskIds);
          }
          break;

        case "bulk_update":
          if (op.taskIds && op.updates) {
            await onBulkUpdate(op.taskIds, op.updates);
          }
          break;

        case "update":
          if (op.taskIds && op.updates) {
            for (const id of op.taskIds) {
              await onUpdateTask(id, op.updates);
            }
          }
          break;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isProcessing || aiProcessing) return;

    setIsProcessing(true);
    setResponse(null);

    try {
      const result = await parseCommand(command, tasks);
      setResponse(result);

      if (result.success && result.operations.length > 0) {
        await executeOperations(result.operations);
      }

      if (result.success) {
        setCommand("");
      }
    } catch {
      setResponse({
        success: false,
        operations: [],
        message: "An error occurred. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const quickCommands = [
    { label: "Add task", command: "Add task: " },
    { label: "Complete all", command: "Complete all tasks" },
    { label: "Delete completed", command: "Delete all completed tasks" },
    { label: "Sort by priority", command: "Sort tasks by priority" },
  ];

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setShowPanel(!showPanel)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg ${
          showPanel
            ? "bg-zinc-800 text-white"
            : "bg-linear-to-r from-violet-600 to-indigo-600 text-white"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {showPanel ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        )}
      </motion.button>

      {/* AI Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-linear-to-r from-violet-600 to-indigo-600 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    AI Task Assistant
                  </h3>
                  <p className="text-white/70 text-sm">
                    Type a command or ask for help
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-80 overflow-y-auto">
              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                    Suggestions
                  </h4>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, i) => (
                      <div
                        key={i}
                        className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2"
                      >
                        💡 {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Commands */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                  Quick Commands
                </h4>
                <div className="flex flex-wrap gap-2">
                  {quickCommands.map((qc) => (
                    <button
                      key={qc.label}
                      onClick={() => {
                        setCommand(qc.command);
                        inputRef.current?.focus();
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-400 transition-colors"
                    >
                      {qc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Response */}
              {response && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg mb-4 ${
                    response.success
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {response.message}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Try: Add task: Review proposal"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  disabled={isProcessing || aiProcessing}
                />
                <button
                  type="submit"
                  disabled={isProcessing || aiProcessing || !command.trim()}
                  className="px-4 py-2.5 bg-violet-600 text-white rounded-lg font-medium text-sm hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing || aiProcessing ? (
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Task Card Component with inline editing
interface TaskCardProps {
  task: Task;
  onUpdate: (
    id: string,
    updates: Partial<Task>,
  ) => Promise<{ data: Task | null; error: Error | null }>;
  onDelete: (id: string) => Promise<{ error: Error | null }>;
  onToggleComplete: (
    id: string,
  ) => Promise<{ data: Task | null; error: Error | null }>;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function TaskCard({
  task,
  onUpdate,
  onDelete,
  onToggleComplete,
  isSelected,
  onSelect,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(
    task.description || "",
  );
  const [showMenu, setShowMenu] = useState(false);

  const statusColors = {
    completed:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    "in-progress":
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    pending: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
  };

  const priorityColors = {
    high: "border-l-red-500",
    medium: "border-l-yellow-500",
    low: "border-l-green-500",
  };

  const handleSave = async () => {
    await onUpdate(task.id, {
      title: editTitle,
      description: editDescription,
    });
    setIsEditing(false);
  };

  const handleStatusChange = async (
    status: "pending" | "in-progress" | "completed",
  ) => {
    await onUpdate(task.id, { status });
    setShowMenu(false);
  };

  const handlePriorityChange = async (priority: "low" | "medium" | "high") => {
    await onUpdate(task.id, { priority });
    setShowMenu(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== "completed";

  return (
    <Reorder.Item
      value={task}
      id={task.id}
      className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 border-l-4 ${priorityColors[task.priority]} shadow-sm hover:shadow-md transition-shadow ${
        isSelected ? "ring-2 ring-violet-500" : ""
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Selection Checkbox */}
          <button
            onClick={() => onSelect(task.id)}
            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
              isSelected
                ? "bg-violet-600 border-violet-600 text-white"
                : "border-zinc-300 dark:border-zinc-600 hover:border-violet-500"
            }`}
          >
            {isSelected && (
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>

          {/* Complete Button */}
          <button
            onClick={() => onToggleComplete(task.id)}
            className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
              task.status === "completed"
                ? "bg-green-500 border-green-500 text-white"
                : "border-zinc-300 dark:border-zinc-600 hover:border-green-500"
            }`}
          >
            {task.status === "completed" && (
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0 overflow-hidden">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-2 py-1 text-sm font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-2 focus:ring-violet-500"
                  autoFocus
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add description..."
                  className="w-full px-2 py-1 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 text-xs font-medium bg-violet-600 text-white rounded hover:bg-violet-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditTitle(task.title);
                      setEditDescription(task.description || "");
                    }}
                    className="px-3 py-1 text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3
                  className={`font-medium text-zinc-900 dark:text-white cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 wrap-break-word ${
                    task.status === "completed"
                      ? "line-through text-zinc-400"
                      : ""
                  }`}
                  onClick={() => setIsEditing(true)}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 line-clamp-2 wrap-break-word">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${statusColors[task.status]}`}
                  >
                    {task.status}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${
                      task.priority === "high"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : task.priority === "medium"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    }`}
                  >
                    {task.priority}
                  </span>
                  {task.due_date && (
                    <span
                      className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : "text-zinc-500 dark:text-zinc-400"}`}
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {formatDate(task.due_date)}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Actions Menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 py-1 z-10"
                >
                  <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase">
                    Status
                  </div>
                  {(["pending", "in-progress", "completed"] as const).map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 ${
                          task.status === status
                            ? "text-violet-600"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {task.status === status && "✓"} {status}
                      </button>
                    ),
                  )}

                  <div className="border-t border-zinc-200 dark:border-zinc-800 my-1" />

                  <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase">
                    Priority
                  </div>
                  {(["low", "medium", "high"] as const).map((priority) => (
                    <button
                      key={priority}
                      onClick={() => handlePriorityChange(priority)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 ${
                        task.priority === priority
                          ? "text-violet-600"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {task.priority === priority && "✓"} {priority}
                    </button>
                  ))}

                  <div className="border-t border-zinc-200 dark:border-zinc-800 my-1" />

                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => onDelete(task.id)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                  >
                    🗑️ Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Drag Handle */}
          <div className="cursor-grab active:cursor-grabbing p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
}

// Filter/Sort Toolbar
interface TaskToolbarProps {
  filters: {
    status: "all" | "pending" | "in-progress" | "completed";
    priority: "all" | "low" | "medium" | "high";
    search: string;
  };
  sort: {
    field:
      | "position"
      | "created_at"
      | "due_date"
      | "priority"
      | "title"
      | "status";
    direction: "asc" | "desc";
  };
  onFiltersChange: (filters: TaskToolbarProps["filters"]) => void;
  onSortChange: (sort: TaskToolbarProps["sort"]) => void;
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkComplete: () => void;
}

export function TaskToolbar({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  selectedCount,
  onBulkDelete,
  onBulkComplete,
}: TaskToolbarProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-50">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) =>
                onFiltersChange({ ...filters, search: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              status: e.target.value as typeof filters.status,
            })
          }
          className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              priority: e.target.value as typeof filters.priority,
            })
          }
          className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Sort */}
        <select
          value={`${sort.field}-${sort.direction}`}
          onChange={(e) => {
            const [field, direction] = e.target.value.split("-") as [
              typeof sort.field,
              typeof sort.direction,
            ];
            onSortChange({ field, direction });
          }}
          className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="position-asc">Manual Order</option>
          <option value="created_at-desc">Newest First</option>
          <option value="created_at-asc">Oldest First</option>
          <option value="due_date-asc">Due Date ↑</option>
          <option value="due_date-desc">Due Date ↓</option>
          <option value="priority-desc">Priority ↑</option>
          <option value="priority-asc">Priority ↓</option>
          <option value="title-asc">Title A-Z</option>
          <option value="title-desc">Title Z-A</option>
        </select>

        {/* Bulk Actions */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-zinc-500">
              {selectedCount} selected
            </span>
            <button
              onClick={onBulkComplete}
              className="px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
            >
              Complete
            </button>
            <button
              onClick={onBulkDelete}
              className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
