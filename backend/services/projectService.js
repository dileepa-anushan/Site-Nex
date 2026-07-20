import Project from "../models/projects.js";
import Task from "../models/task.js";
import TaskAssignment from "../models/taskAssignment.js";
import Issue from "../models/issue.js";
import MaterialUsageLog from "../models/materialUsageLog.js";
import ProjectMembership from "../models/projectMembership.js";
import MaterialService from "./materialService.js";
import DeletionLog from "../models/deletionLog.js";

/**
 * Service to handle complex Project operations separated from the controller layer.
 */
class ProjectService {
    /**
     * Get Project Dashboard KPIs
     * @param {string} projectId 
     */
    static async getProjectDashboard(projectId) {
        const project = await Project.findById(projectId);
        if (!project) throw new Error("Project not found");

        const tasks = await Task.find({ projectId, isCancled: false });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === "Completed").length;

        const openIssues = await Issue.countDocuments({
            projectId,
            status: { $nin: ["Resolved", "Closed"] }
        });

        const teamSize = await ProjectMembership.countDocuments({
            projectId,
            removedAt: null
        });

        let budgetUsedPercentage = 0;
        if (project.plannedBudget && project.plannedBudget > 0) {
            budgetUsedPercentage = (project.actualBudgetUsed / project.plannedBudget) * 100;
        }

        return {
            totalTasks,
            completedTasks,
            openIssues,
            teamSize,
            budgetUsedPercentage
        };
    }

    /**
     * Get Gantt Chart format tasks
     * @param {string} projectId 
     */
    static async getProjectGantt(projectId) {
        const tasks = await Task.find({ projectId, isCancled: false })
            .select("_id name startDate endDate dependencyTaskIds percentComplete status")
            .sort({ startDate: 1 });

        return tasks.map(t => ({
            id: t._id,
            name: t.name,
            startDate: t.startDate,
            endDate: t.endDate,
            dependencies: t.dependencyTaskIds,
            percentComplete: t.percentComplete,
            status: t.status
        }));
    }

    /**
     * Soft deletes a project and cascades the deletion to all related entities.
     * @param {string} projectId 
     * @param {string} deletedByUserId 
     */
    static async deleteProject(projectId, deletedByUserId, deletionReason) {
        // Find existing to log
        const project = await Project.findById(projectId);
        if (!project) {
            throw new Error("Project not found");
        }

        const tasks = await Task.find({ projectId });
        const taskIds = tasks.map(t => t._id);

        const assignments = await TaskAssignment.find({ taskId: { $in: taskIds } });
        const memberships = await ProjectMembership.find({ projectId });

        const logs = [];
        logs.push({ entityType: "Project", entityId: projectId, entityName: project.name, deletedBy: deletedByUserId, reason: deletionReason || "Not specified" });
        
        tasks.forEach(t => logs.push({ entityType: "Task", entityId: t._id, entityName: t.name, deletedBy: deletedByUserId, reason: "Parent project deleted" }));
        assignments.forEach(a => logs.push({ entityType: "TaskAssignment", entityId: a._id, deletedBy: deletedByUserId, reason: "Parent project deleted" }));
        memberships.forEach(m => logs.push({ entityType: "ProjectMembership", entityId: m._id, deletedBy: deletedByUserId, reason: "Parent project deleted" }));

        if (logs.length > 0) {
            await DeletionLog.insertMany(logs);
        }

        if (taskIds.length > 0) {
            await TaskAssignment.deleteMany({ taskId: { $in: taskIds } });
        }
        await Task.deleteMany({ projectId });
        await Issue.deleteMany({ projectId });
        await ProjectMembership.deleteMany({ projectId });
        await MaterialUsageLog.deleteMany({ projectId });
        await Project.deleteOne({ _id: projectId });

        return project;
    }
}

export default ProjectService;
