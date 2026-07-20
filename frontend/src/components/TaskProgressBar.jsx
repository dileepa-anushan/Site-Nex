import React, { useMemo } from "react";

const SVG_W = 1000;
const SVG_H = 700;
const MARGIN_X = 80;
const MARGIN_Y = 100;
const LEVEL_Y_GAP = 140;
const NODE_RADIUS = 26;

function getTaskDependencies(task) {
  // Support multiple possible field names (future-proof).
  // Dummy data doesn't include this, so default to empty array.
  return (
    task?.dependencyTaskIds ||
    task?.dependencies ||
    task?.dependsOn ||
    []
  );
}

function computeLevels(nodesById, depsById) {
  // levels = "distance from roots" in the dependency graph
  const levels = new Map();

  const indegree = new Map();
  for (const id of nodesById.keys()) indegree.set(id, 0);

  // dep -> task edges
  for (const [taskId, deps] of depsById.entries()) {
    for (const depId of deps) {
      if (!nodesById.has(depId)) continue;
      indegree.set(taskId, (indegree.get(taskId) || 0) + 1);
    }
  }

  const queue = [];
  for (const [id, deg] of indegree.entries()) {
    if (deg === 0) {
      levels.set(id, 0);
      queue.push(id);
    }
  }

  // Build adjacency dep -> task
  const adjacency = new Map();
  for (const id of nodesById.keys()) adjacency.set(id, []);
  for (const [taskId, deps] of depsById.entries()) {
    for (const depId of deps) {
      if (!nodesById.has(depId)) continue;
      adjacency.get(depId).push(taskId);
    }
  }

  while (queue.length) {
    const current = queue.shift();
    const currentLevel = levels.get(current) ?? 0;
    const neighbors = adjacency.get(current) || [];

    for (const neighbor of neighbors) {
      const neighborLevel = (levels.get(neighbor) ?? -Infinity);
      const nextLevel = currentLevel + 1;
      if (nextLevel > neighborLevel) levels.set(neighbor, nextLevel);
      queue.push(neighbor);
    }
  }

  // If a cycle exists, some nodes may never be assigned.
  const maxLevel = Math.max(-1, ...Array.from(levels.values()));
  for (const id of nodesById.keys()) {
    if (!levels.has(id)) levels.set(id, maxLevel + 1);
  }

  return levels;
}

function pickSubgraph(allTaskIds, depsById, selectedId) {
  // Show ancestors + descendants of the selected node.
  const selected = new Set([selectedId]);

  const adjacency = new Map(); // dep -> task
  const reverse = new Map(); // task -> deps
  for (const id of allTaskIds) {
    adjacency.set(id, []);
    reverse.set(id, depsById.get(id) || []);
  }
  for (const taskId of allTaskIds) {
    const deps = depsById.get(taskId) || [];
    for (const depId of deps) {
      if (!allTaskIds.has(depId)) continue;
      adjacency.get(depId).push(taskId);
    }
  }

  // Ancestors: keep walking deps
  const stackAnc = [selectedId];
  while (stackAnc.length) {
    const current = stackAnc.pop();
    const deps = reverse.get(current) || [];
    for (const depId of deps) {
      if (!selected.has(depId)) {
        selected.add(depId);
        stackAnc.push(depId);
      }
    }
  }

  // Descendants: keep walking adjacency
  const stackDesc = [selectedId];
  while (stackDesc.length) {
    const current = stackDesc.pop();
    const neighbors = adjacency.get(current) || [];
    for (const nextId of neighbors) {
      if (!selected.has(nextId)) {
        selected.add(nextId);
        stackDesc.push(nextId);
      }
    }
  }

  return selected;
}

export default function TaskDependencyGraph({
  tasks,
  selectedTaskId,
  onSelectTask,
}) {
  const { nodes, edges, positions } = useMemo(() => {
    const nodesById = new Map((tasks || []).map((t) => [t.id, t]));
    const depsById = new Map();

    const allTaskIdsSet = new Set(nodesById.keys());
    for (const [id, task] of nodesById.entries()) {
      const deps = getTaskDependencies(task)
        .map(String)
        .filter((d) => allTaskIdsSet.has(d));
      depsById.set(id, deps);
    }

    const relevantIds = selectedTaskId
      ? pickSubgraph(allTaskIdsSet, depsById, selectedTaskId)
      : allTaskIdsSet;

    const relevantArray = Array.from(relevantIds);
    const nodes = relevantArray.map((id) => nodesById.get(id)).filter(Boolean);

    // dep -> task edges
    const edges = [];
    for (const taskId of relevantIds) {
      const deps = depsById.get(taskId) || [];
      for (const depId of deps) {
        if (!relevantIds.has(depId)) continue;
        edges.push({ from: depId, to: taskId });
      }
    }

    const relevantNodesById = new Map(nodes.map((n) => [n.id, n]));
    const levels = computeLevels(relevantNodesById, depsById);

    // Level -> nodes
    const levelBuckets = new Map();
    for (const id of relevantNodesById.keys()) {
      const lvl = levels.get(id) ?? 0;
      if (!levelBuckets.has(lvl)) levelBuckets.set(lvl, []);
      levelBuckets.get(lvl).push(id);
    }

    const levelsSorted = Array.from(levelBuckets.keys()).sort((a, b) => a - b);
    const positions = new Map();

    levelsSorted.forEach((lvl, idx) => {
      const idsAtLevel = levelBuckets.get(lvl) || [];
      const count = Math.max(1, idsAtLevel.length);
      const rowY = Math.min(MARGIN_Y + idx * LEVEL_Y_GAP, SVG_H - MARGIN_Y);
      const rowWidth = SVG_W - 2 * MARGIN_X;
      const xGap = rowWidth / count;

      idsAtLevel.forEach((id, i) => {
        const x = MARGIN_X + xGap * (i + 0.5);
        const y = rowY;
        positions.set(id, { x, y });
      });
    });

    return { nodes, edges, positions };
  }, [tasks, selectedTaskId]);

  const selectedSet = useMemo(() => new Set([selectedTaskId]), [selectedTaskId]);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full h-[560px] border border-concrete-light rounded-xl bg-white"
      >
        <defs>
          <marker
            id="arrow"
            markerWidth="10"
            markerHeight="10"
            refX="7"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((e, i) => {
          const from = positions.get(e.from);
          const to = positions.get(e.to);
          if (!from || !to) return null;

          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const curve = Math.max(40, Math.min(160, Math.abs(dx) * 0.2));

          // Simple quadratic curve (keeps it readable)
          const mx = (from.x + to.x) / 2;
          const my = (from.y + to.y) / 2 - curve * Math.sign(dy || 1);

          const isSelectedEdge = selectedSet.has(e.from) || selectedSet.has(e.to);
          return (
            <path
              key={`${e.from}-${e.to}-${i}`}
              d={`M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`}
              fill="none"
              stroke={isSelectedEdge ? "#2563eb" : "#94a3b8"}
              strokeWidth={isSelectedEdge ? 2.2 : 1.5}
              markerEnd="url(#arrow)"
              opacity={isSelectedEdge ? 1 : 0.9}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((t) => {
          const p = positions.get(t.id);
          if (!p) return null;
          const isSelected = selectedTaskId && selectedTaskId === t.id;
          const fill = isSelected ? "#1d4ed8" : "#f1f5f9";
          const stroke = isSelected ? "#1d4ed8" : "#94a3b8";
          const textColor = isSelected ? "#ffffff" : "#0f172a";

          const label = String(t.id || "").length > 10 ? `${String(t.id).slice(0, 9)}…` : String(t.id);

          return (
            <g
              key={t.id}
              onClick={() => onSelectTask?.(t.id)}
              style={{ cursor: onSelectTask ? "pointer" : "default" }}
            >
              <circle cx={p.x} cy={p.y} r={NODE_RADIUS} fill={fill} stroke={stroke} strokeWidth={2} />
              <text
                x={p.x}
                y={p.y - 2}
                textAnchor="middle"
                fontSize={12}
                fill={textColor}
                fontWeight={700}
                style={{ userSelect: "none" }}
              >
                {label}
              </text>
              <text
                x={p.x}
                y={p.y + 18}
                textAnchor="middle"
                fontSize={10}
                fill={textColor}
                fontWeight={600}
                style={{ userSelect: "none" }}
              >
                {t.status || ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

