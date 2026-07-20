import React, { useMemo } from "react";

const colorByStatus = {
  "In Progress": "bg-blue-600",
  Completed: "bg-green-600",
  Blocked: "bg-red-600",
  "To Do": "bg-gray-500",
  "Under Review": "bg-amber-600",
  "On Hold": "bg-orange-600",
  Cancelled: "bg-zinc-500",
};

function normalizePercent(task) {
  if (typeof task?.percentComplete === "number" && !Number.isNaN(task.percentComplete)) {
    return Math.max(0, Math.min(100, task.percentComplete));
  }

  // Dummy UI fallback when backend field isn't provided.
  switch (task?.status) {
    case "Completed":
      return 100;
    case "In Progress":
      return 60;
    case "Blocked":
      return 25;
    case "Under Review":
      return 75;
    case "On Hold":
      return 20;
    case "Cancelled":
      return 0;
    case "To Do":
    default:
      return 0;
  }
}

export default function TaskProgressBar({ task, size = "md" }) {
  const percent = useMemo(() => normalizePercent(task), [task]);
  const fillColor = colorByStatus[task?.status] || "bg-steel-blue";

  const height = size === "lg" ? "h-5" : "h-3";
  const fontSize = size === "lg" ? "text-sm" : "text-xs";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-concrete/80 font-medium ${fontSize}`}>Progress</span>
        <span className={`text-concrete/80 font-semibold ${fontSize}`}>{percent}%</span>
      </div>

      <div className="w-full bg-gray-100 border border-concrete-light rounded-full overflow-hidden">
        <div
          className={`${fillColor} ${height}`}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

