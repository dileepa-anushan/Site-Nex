import Project from "../models/projects.js";
import Task from "../models/task.js";
import Issue from "../models/issue.js";

/**
 * Recalculates project progress and status based on its tasks and issues.
 * Should be called whenever a task is updated/added/cancelled, or an issue is resolved/closed.
 * @param {String} projectId
 */
export const syncProjectProgress = async (projectId) => {
    try {
        const project = await Project.findById(projectId);
        if (!project || project.isDeleted) return;

        // 1. Calculate Progress based on Tasks
        const tasks = await Task.find({ projectId, isCancled: false });

        let totalPercent = 0;
        let completedTasks = 0;

        if (tasks.length > 0) {
            tasks.forEach(t => {
                totalPercent += t.percentComplete || 0;
                if (t.status === "Completed" || t.percentComplete === 100) {
                    completedTasks += 1;
                }
            });
            project.progress = Math.round(totalPercent / tasks.length);
        } else {
            project.progress = 0;
        }

        // 2. Determine Status
        const openIssues = await Issue.countDocuments({
            projectId,
            status: { $nin: ["Resolved", "Closed"] }
        });

        if (project.progress === 100 && openIssues === 0) {
            project.status = "Completed";
        } else if (openIssues > 0 && tasks.some(t => t.status === "On Hold")) {
            project.status = "On Hold";
        } else if (project.progress > 0) {
            project.status = "In Progress";
        } else {
            project.status = "Planning"; // default initial
        }

        await project.save();
    } catch (error) {
        console.error("Error syncing project progress:", error);
    }
};
