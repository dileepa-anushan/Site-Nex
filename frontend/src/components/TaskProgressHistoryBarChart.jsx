import React, { useMemo } from "react";

const colorByStatus = {
  "In Progress": "#2563eb",
  Completed: "#16a34a",
  Blocked: "#dc2626",
  "To Do": "#6b7280",
  "Under Review": "#d97706",
  "On Hold": "#f97316",
  Cancelled: "#64748b",
};

function normalizePercent(task) {
  if (typeof task?.percentComplete === "number" && !Number.isNaN(task.percentComplete)) {
    return Math.max(0, Math.min(100, task.percentComplete));
  }

  // UI fallback when backend field isn't present.
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

export default function TaskProgressChart({
  tasks,
  selectedTaskId,
  onSelectTask,
  height = 380,
}) {
  const { bars, chart } = useMemo(() => {
    const width = 1000;
    const heightPx = height;
    const padLeft = 70;
    const padRight = 20;
    const padTop = 30;
    const padBottom = 70;

    const chartW = width - padLeft - padRight;
    const chartH = heightPx - padTop - padBottom;

    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const n = Math.max(1, safeTasks.length);
    const slotW = chartW / n;
    const barW = Math.max(10, slotW * 0.6);

    const bars = safeTasks.map((t, i) => {
      const percent = normalizePercent(t);
      const xCenter = padLeft + slotW * i + slotW / 2;
      const x = xCenter - barW / 2;
      const barH = (percent / 100) * chartH;
      const y = padTop + (chartH - barH);
      return {
        id: t.id,
        name: t.name,
        status: t.status,
        percent,
        x,
        y,
        w: barW,
        h: barH,
        i,
      };
    });

    return {
      bars,
      maxBarHeight: chartH,
      chart: { width, heightPx, padLeft, padRight, padTop, padBottom, chartW, chartH },
    };
  }, [tasks, height]);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${chart.width} ${chart.heightPx}`}
        className="w-full h-auto"
        role="img"
        aria-label="Task progress bar chart"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((p) => {
          const y = chart.padTop + (chart.chartH * (100 - p)) / 100;
          return (
            <g key={p}>
              <line x1={chart.padLeft} x2={chart.width - chart.padRight} y1={y} y2={y} stroke="#e5e7eb" />
              <text
                x={chart.padLeft - 12}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
                fontWeight={600}
              >
                {p}%
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line
          x1={chart.padLeft}
          x2={chart.width - chart.padRight}
          y1={chart.padTop + chart.chartH}
          y2={chart.padTop + chart.chartH}
          stroke="#d1d5db"
        />
        <line x1={chart.padLeft} x2={chart.padLeft} y1={chart.padTop} y2={chart.padTop + chart.chartH} stroke="#d1d5db" />

        {/* Bars */}
        {bars.map((b) => {
          const baseColor = colorByStatus[b.status] || "#1d4ed8";
          const isSelected = selectedTaskId && b.id === selectedTaskId;
          const fill = isSelected ? "#1d4ed8" : baseColor;
          const stroke = isSelected ? "#1d4ed8" : "#ffffff";

          return (
            <g
              key={b.id}
              onClick={() => onSelectTask?.(b.id)}
              style={{ cursor: onSelectTask ? "pointer" : "default" }}
            >
              <title>
                {b.name} - {b.percent}% ({b.status})
              </title>
              <rect x={b.x} y={b.y} width={b.w} height={Math.max(2, b.h)} fill={fill} stroke={stroke} strokeWidth={isSelected ? 2 : 1} opacity={0.95} rx={8} />
              {/* small percent label */}
              {b.percent > 0 && (
                <text
                  x={b.x + b.w / 2}
                  y={Math.max(chart.padTop + 14, b.y - 6)}
                  textAnchor="middle"
                  fontSize="12"
                  fill={isSelected ? "#ffffff" : "#0f172a"}
                  fontWeight={800}
                >
                  {Math.round(b.percent)}%
                </text>
              )}
              {/* x labels */}
              <text
                x={b.x + b.w / 2}
                y={chart.padTop + chart.chartH + 28}
                textAnchor="middle"
                fontSize="10"
                fill="#334155"
                fontWeight={700}
              >
                {String(b.id).slice(-4)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

