"use client";

import { useState, useCallback } from "react";
import { motion, Reorder } from "framer-motion";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";
import StatCard from "@/components/dashboard/StatCard";
import AICommandPanel, {
  TaskCard,
  TaskToolbar,
} from "@/components/dashboard/TaskComponents";
import { useTasks } from "@/hooks/useTasks";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/components/providers/AuthProvider";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { Task } from "@/types/database.types";

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    tasks,
    allTasks,
    stats,
    isLoading,
    filters,
    sort,
    setFilters,
    setSort,
    addTask,
    updateTask,
    deleteTask,
    bulkDelete,
    bulkUpdate,
    reorderTasks,
    toggleComplete,
  } = useTasks();
  const { profile } = useProfile();
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    await addTask({
      title: newTaskTitle,
      description: newTaskDescription,
      priority: newTaskPriority,
      status: "pending",
      due_date: newTaskDueDate || null,
    });

    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("medium");
    setNewTaskDueDate("");
    setShowAddTask(false);
  };

  const handleSelectTask = useCallback((id: string) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) return;
    if (!confirm(`Delete ${selectedTasks.size} task(s)?`)) return;
    await bulkDelete(Array.from(selectedTasks));
    setSelectedTasks(new Set());
  };

  const handleBulkComplete = async () => {
    if (selectedTasks.size === 0) return;
    await bulkUpdate(Array.from(selectedTasks), { status: "completed" });
    setSelectedTasks(new Set());
  };

  const handleReorder = (reorderedTasks: Task[]) => {
    reorderTasks(reorderedTasks);
  };

  const statsData = [
    {
      title: "Total Tasks",
      value: stats.total.toString(),
      change: `${stats.total} tasks`,
      changeType: "neutral" as const,
      icon: (
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
    {
      title: "Completed",
      value: stats.completed.toString(),
      change:
        stats.total > 0
          ? `${Math.round((stats.completed / stats.total) * 100)}%`
          : "0%",
      changeType: "positive" as const,
      icon: (
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: "In Progress",
      value: stats.inProgress.toString(),
      change:
        stats.total > 0
          ? `${Math.round((stats.inProgress / stats.total) * 100)}%`
          : "0%",
      changeType: "neutral" as const,
      icon: (
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: "Overdue",
      value: stats.overdue.toString(),
      change: stats.overdue > 0 ? "Action needed" : "All good!",
      changeType:
        stats.overdue > 0 ? ("negative" as const) : ("positive" as const),
      icon: (
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
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "there";

  // Group tasks by status for Kanban view
  const kanbanColumns = {
    pending: tasks.filter((t) => t.status === "pending"),
    "in-progress": tasks.filter((t) => t.status === "in-progress"),
    completed: tasks.filter((t) => t.status === "completed"),
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Page Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Welcome back, {displayName}! Here&apos;s what&apos;s happening
                today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "list"
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
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
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "kanban"
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
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
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                    />
                  </svg>
                </button>
              </div>
              <Button onClick={() => setShowAddTask(true)}>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Task
              </Button>
            </div>
          </div>

          {/* Add Task Modal */}
          {showAddTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowAddTask(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-lg mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                  Add New Task
                </h2>
                <form onSubmit={handleAddTask} className="space-y-4">
                  <Input
                    label="Task Title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Enter task title..."
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Add more details..."
                      className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Priority
                      </label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) =>
                          setNewTaskPriority(
                            e.target.value as "low" | "medium" | "high",
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Due Date (optional)
                      </label>
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowAddTask(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Task</Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsData.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <StatCard {...stat} />
              </motion.div>
            ))}
          </div>

          {/* Task Toolbar */}
          <TaskToolbar
            filters={filters}
            sort={sort}
            onFiltersChange={setFilters}
            onSortChange={setSort}
            selectedCount={selectedTasks.size}
            onBulkDelete={handleBulkDelete}
            onBulkComplete={handleBulkComplete}
          />

          {/* Tasks Display */}
          {isLoading ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-zinc-500">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center"
            >
              <svg
                className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                {filters.search ||
                filters.status !== "all" ||
                filters.priority !== "all"
                  ? "No matching tasks"
                  : "No tasks yet"}
              </h3>
              <p className="text-zinc-500 mb-6">
                {filters.search ||
                filters.status !== "all" ||
                filters.priority !== "all"
                  ? "Try adjusting your filters or search query"
                  : "Create your first task to get started!"}
              </p>
              {!filters.search &&
                filters.status === "all" &&
                filters.priority === "all" && (
                  <Button onClick={() => setShowAddTask(true)}>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Your First Task
                  </Button>
                )}
            </motion.div>
          ) : viewMode === "list" ? (
            /* List View */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <Reorder.Group
                axis="y"
                values={tasks}
                onReorder={handleReorder}
                className="space-y-3"
              >
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdate={updateTask}
                    onDelete={deleteTask}
                    onToggleComplete={toggleComplete}
                    isSelected={selectedTasks.has(task.id)}
                    onSelect={handleSelectTask}
                  />
                ))}
              </Reorder.Group>
            </motion.div>
          ) : (
            /* Kanban View */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(["pending", "in-progress", "completed"] as const).map(
                (status) => (
                  <div
                    key={status}
                    className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-zinc-900 dark:text-white capitalize">
                        {status === "in-progress" ? "In Progress" : status}
                      </h3>
                      <span className="px-2.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {kanbanColumns[status].length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {kanbanColumns[status].map((task) => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
                            task.priority === "high"
                              ? "border-l-red-500"
                              : task.priority === "medium"
                                ? "border-l-yellow-500"
                                : "border-l-green-500"
                          }`}
                          onClick={() => handleSelectTask(task.id)}
                        >
                          <h4
                            className={`font-medium text-sm ${task.status === "completed" ? "line-through text-zinc-400" : "text-zinc-900 dark:text-white"}`}
                          >
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span
                              className={`text-xs font-medium capitalize ${
                                task.priority === "high"
                                  ? "text-red-500"
                                  : task.priority === "medium"
                                    ? "text-yellow-500"
                                    : "text-green-500"
                              }`}
                            >
                              {task.priority}
                            </span>
                            {task.due_date && (
                              <span className="text-xs text-zinc-400">
                                {new Date(task.due_date).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" },
                                )}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      {kanbanColumns[status].length === 0 && (
                        <div className="text-center py-8 text-zinc-400 text-sm">
                          No tasks
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </main>
      </div>

      {/* AI Command Panel */}
      <AICommandPanel
        tasks={allTasks}
        onAddTask={addTask}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
        onBulkDelete={bulkDelete}
        onBulkUpdate={bulkUpdate}
      />
    </div>
  );
}
