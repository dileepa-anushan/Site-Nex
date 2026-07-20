import Task from "../models/task.js";
import Issue from "../models/issue.js";
import mongoose from "mongoose";

class TaskService {
    /**
     * Automatically shift dates of dependent tasks if their parent's endDate is moved past their startDate.
     * @param {string} taskId
     */
    static async autoRescheduleDependentTasks(taskId) {
        const task = await Task.findById(taskId);
        if (!task || task.isCancled) return;

        // Find immediately dependent tasks 
        const dependentTasks = await Task.find({ dependencyTaskIds: taskId, isCancled: false });

        for (const depTask of dependentTasks) {
            if (task.endDate && depTask.startDate) {
                const parentEnd = new Date(task.endDate);
                const depStart = new Date(depTask.startDate);

                if (depStart < parentEnd) {
                    const durationMs = new Date(depTask.endDate).getTime() - depStart.getTime();

                    // Shift dependent task dates forward
                    depTask.startDate = parentEnd;
                    depTask.endDate = new Date(parentEnd.getTime() + durationMs);

                    await depTask.save();

                    // Recursively shift downstream dependents
                    await TaskService.autoRescheduleDependentTasks(depTask._id);
                }
            }
        }
    }

    /**
     * Add a progress note to a task
     */
    static async addProgressNote(taskId, note, userId) {
        const task = await Task.findById(taskId);
        if (!task) throw new Error("Task not found");

        task.progressNotes.push({ note, createdBy: userId });
        await task.save();

        return task;
    }

    /**
     * Get notes for a task, sorted descending by creation date
     */
    static async getTaskNotes(taskId) {
        const task = await Task.findById(taskId).populate("progressNotes.createdBy", "name email");
        if (!task) throw new Error("Task not found");

        return task.progressNotes.sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * Completes a DFS graph traversal to ensure adding `newDependencyIds` to `taskId`
     * does not create a cycle (e.g. A -> B -> C -> A).
     * 
     * @param {string} projectId 
     * @param {string} taskId (can be null for new tasks)
     * @param {string[]} newDependencyIds
     * @throws Error if a cycle is detected
     */
    static async validateDependencies(projectId, taskId, newDependencyIds) {
        if (!newDependencyIds || newDependencyIds.length === 0) return;

        // Fetch all active tasks for the project to build the graph
        const allTasks = await Task.find({ projectId, isCancled: false }).select("_id dependencyTaskIds name");

        // Build adjacency list: Map of TaskId -> Array of Dependency TaskIds
        const graph = new Map();
        allTasks.forEach(t => {
            const deps = t.dependencyTaskIds ? t.dependencyTaskIds.map(id => id.toString()) : [];
            graph.set(t._id.toString(), deps);
        });

        // If we are updating an existing task, temporarily inject the NEW proposed dependencies into the graph
        if (taskId) {
            graph.set(taskId.toString(), newDependencyIds.map(id => id.toString()));
        } else {
            // For a brand new task, we assign a dummy ID to represent it in the graph
            const dummyId = new mongoose.Types.ObjectId().toString();
            graph.set(dummyId, newDependencyIds.map(id => id.toString()));
        }

        // DFS Cycle Detection Algorithm
        const visited = new Set();
        const recursionStack = new Set();

        const hasCycle = (currentNode) => {
            if (recursionStack.has(currentNode)) return true;
            if (visited.has(currentNode)) return false;

            visited.add(currentNode);
            recursionStack.add(currentNode);

            const neighbors = graph.get(currentNode) || [];
            for (const neighbor of neighbors) {
                if (hasCycle(neighbor)) return true;
            }

            recursionStack.delete(currentNode);
            return false;
        };

        // Check every node in the graph for cycles
        for (const [nodeId] of graph.entries()) {
            if (hasCycle(nodeId)) {
                throw new Error(`Circular dependency detected in project graph. Operation aborted to prevent a cycle.`);
            }
        }
    }

    /**
     * Request task completion by a Site Engineer
     */
    static async requestCompletion(taskId, userId, note) {
        const task = await Task.findById(taskId);
        if (!task || task.isCancled) throw new Error("Task not found or cancelled");
        if (task.status === "Completed") throw new Error("Task is already completed");
        if (task.completionRequested) throw new Error("Task completion has already been requested");

        task.completionRequested = true;
        task.completionRequestedBy = userId;
        task.completionRequestedAt = new Date();

        if (note) {
            task.progressNotes.push({ note: `Completion requested: ${note}`, createdBy: userId });
        }
        await task.save();
        return task;
    }

    /**
     * Approve task completion by a Project Manager
     */
    static async approveCompletion(taskId, userId, note) {
        const task = await Task.findById(taskId);
        if (!task || task.isCancled) throw new Error("Task not found or cancelled");
        if (task.status === "Completed") throw new Error("Task is already completed");
        if (!task.completionRequested) throw new Error("Task completion was not requested");

        // Check for open issues
        const openIssuesCount = await Issue.countDocuments({
            taskId: task._id,
            status: { $nin: ["Resolved", "Closed"] }
        });

        if (openIssuesCount > 0) {
            throw new Error(`Cannot approve completion. There are ${openIssuesCount} open issues blocking this task. Resolve them first.`);
        }

        // Clear requested state
        task.completionRequested = false;
        task.completionRequestedBy = null;
        task.completionRequestedAt = null;

        task.completionApprovedBy = userId;
        task.completionApprovedAt = new Date();
        task.status = "Completed";
        task.percentComplete = 100;

        if (note) {
            task.progressNotes.push({ note: `Completion approved: ${note}`, createdBy: userId });
        }
        await task.save();
        
        // Return task to trigger any cascade updates in controller
        return task;
    }

    /**
     * Get tasks that are blocked by open issues or incomplete dependencies
     */
    static async getBlockedTasks(projectId) {
        const activeTasks = await Task.find({ projectId, isCancled: false })
            .populate("dependencyTaskIds", "status percentComplete");

        const uncompletedTasksWithIssues = await Issue.aggregate([
            { $match: { projectId: new mongoose.Types.ObjectId(projectId), status: { $nin: ["Resolved", "Closed"] }, taskId: { $ne: null } } },
            { $group: { _id: "$taskId", issueCount: { $sum: 1 } } }
        ]);

        const issuesMap = new Map();
        uncompletedTasksWithIssues.forEach(item => issuesMap.set(item._id.toString(), item.issueCount));

        const blockedTasks = [];
        for (const task of activeTasks) {
            if (task.status === "Completed") continue;

            const relatedIssueCount = issuesMap.get(task._id.toString()) || 0;
            const incompleteDependencies = (task.dependencyTaskIds || []).filter(dep => dep.status !== "Completed" && dep.percentComplete !== 100);
            const incompleteDependencyCount = incompleteDependencies.length;

            if (relatedIssueCount > 0 || incompleteDependencyCount > 0) {
                let blockReason = "";
                if (relatedIssueCount > 0 && incompleteDependencyCount > 0) {
                    blockReason = "Blocked by issues and dependencies";
                } else if (relatedIssueCount > 0) {
                    blockReason = "Blocked by open issues";
                } else {
                    blockReason = "Blocked by incomplete dependencies";
                }

                blockedTasks.push({
                    _id: task._id,
                    name: task.name,
                    status: task.status,
                    percentComplete: task.percentComplete,
                    blockReason,
                    relatedIssueCount,
                    incompleteDependencyCount
                });
            }
        }
        return blockedTasks;
    }
}

export default TaskService;
