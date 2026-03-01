"use client";

import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  change,
  changeType,
  icon,
}: StatCardProps) {
  const changeColors = {
    positive:
      "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
    negative: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
    neutral: "text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${changeColors[changeType]}`}
        >
          {change}
        </span>
        <span className="text-xs text-zinc-500">vs last month</span>
      </div>
    </motion.div>
  );
}
