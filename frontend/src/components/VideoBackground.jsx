import React, { useMemo } from "react";

const statusToColor = {
  "To Do": "#6b7280",
  "In Progress": "#2563eb",
  Completed: "#16a34a",
  Blocked: "#dc2626",
  "Under Review": "#d97706",
  "On Hold": "#f97316",
  Cancelled: "#64748b",
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatDateDots(dateLike) {
  const d = new Date(dateLike);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export default function TaskProgressHistoryBarChart({
  history,
  height = 300,
  onSelectHistoryIndex,
  selectedHistoryIndex,
}) {
  const { bars, chart } = useMemo(() => {
    const safeHistory = Array.isArray(history) ? history : [];
    const points = safeHistory
      .map((h) => {
        const percent = clamp(Number(h.percent), 0, 100);
        return {
          dateLike: h.dateLike,
          dateDots: formatDateDots(h.dateLike),
          percent,
          status: h.status || "In Progress",
        };
      })
      .filter((p) => p.dateLike && !Number.isNaN(p.percent));

    const width = 1000;
    const heightPx = height;
    const padLeft = 70;
    const padRight = 25;
    const padTop = 25;
    const padBottom = 70;

    const chartW = width - padLeft - padRight;
    const chartH = heightPx - padTop - padBottom;

    const n = Math.max(1, points.length);
    const slotW = chartW / n;
    const barW = Math.max(10, slotW * 0.55);

    const bars = points.map((p, i) => {
      const barH = (p.percent / 100) * chartH;
      const xCenter = padLeft + slotW * i + slotW / 2;
      const x = xCenter - barW / 2;
      const y = padTop + (chartH - barH);
      return {
        key: `${p.dateDots}-${i}`,
        i,
        x,
        y,
        w: barW,
        h: Math.max(2, barH),
        percent: p.percent,
        status: p.status,
        dateDots: p.dateDots,
      };
    });

    return {
      bars,
      chart: { width, heightPx, padLeft, padRight, padTop, padBottom, chartW, chartH },
    };
  }, [history, height]);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${chart.width} ${chart.heightPx}`}
        className="w-full h-auto"
        role="img"
        aria-label="Task progress over time"
      >
        {/* Baseline grid */}
        {[25, 50, 75, 100].map((p) => {
          const y = chart.padTop + (chart.chartH * (100 - p)) / 100;
          return (
            <g key={p}>
              <line x1={chart.padLeft} x2={chart.width - chart.padRight} y1={y} y2={y} stroke="#e5e7eb" />
              <text x={chart.padLeft - 12} y={y + 4} textAnchor="end" fontSize="12" fill="#6b7280" fontWeight={700}>
                {p}%
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {bars.map((b) => {
          const isSelected = selectedHistoryIndex === b.i;
          const baseColor = statusToColor[b.status] || "#2563eb";
          const fill = isSelected ? "#1d4ed8" : baseColor;

          // Show only MM.DD on the x-axis to avoid clutter.
          const mmdd = b.dateDots.slice(5);

          return (
            <g
              key={b.key}
              onClick={() => onSelectHistoryIndex?.(b.i)}
              style={{ cursor: onSelectHistoryIndex ? "pointer" : "default" }}
            >
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                fill={fill}
                stroke={isSelected ? "#1d4ed8" : "#ffffff"}
                strokeWidth={isSelected ? 2 : 1}
                opacity={0.95}
                rx={8}
              />
              {b.percent > 0 && (
                <text x={b.x + b.w / 2} y={Math.max(chart.padTop + 14, b.y - 7)} textAnchor="middle" fontSize="12" fill={isSelected ? "#fff" : "#0f172a"} fontWeight={800}>
                  {Math.round(b.percent)}%
                </text>
              )}
              <text x={b.x + b.w / 2} y={chart.padTop + chart.chartH + 28} textAnchor="middle" fontSize="10" fill="#334155" fontWeight={800}>
                {mmdd}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

