import mongoose from "mongoose";
import Project from "../models/projects.js";
import ProjectMembership from "../models/projectMembership.js";
import Task from "../models/task.js";
import Issue from "../models/issue.js";
import TaskAssignment from "../models/taskAssignment.js";
import MaterialUsageLog from "../models/materialUsageLog.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ----------------------------------------------------
// Object Loaders
// ----------------------------------------------------

/**
 * Loads a project by ID from req.params.projectId
 * Automatically verifies it exists and is not deleted.
 */
export const loadProject = async (req, res, next) => {
    try {
        const projectId = req.params.projectId;
        if (!projectId) return res.status(400).json({ success: false, message: "Missing projectId" });
        if (!isValidId(projectId)) return res.status(400).json({ success: false, message: "Invalid projectId" });

        const project = await Project.findOne({ _id: projectId, isDeleted: false });
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });

        req.project = project;
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error: loadProject" });
    }
};

/**
 * Loads a task by ID from req.params.taskId
 */
export const loadTask = async (req, res, next) => {
    try {
        const taskId = req.params.taskId;
        if (!taskId) return res.status(400).json({ success: false, message: "Missing taskId" });
        if (!isValidId(taskId)) return res.status(400).json({ success: false, message: "Invalid taskId" });

        const task = await Task.findOne({ _id: taskId, isCancled: false });
        if (!task) return res.status(404).json({ success: false, message: "Task not found" });

        req.task = task;
        // Optionally auto-load project to avoid duplicates down the chain
        if (!req.project && task.projectId) {
            req.params.projectId = task.projectId.toString(); // Propagate for chained loadProject
        }
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error: loadTask" });
    }
};

/**
 * Loads an issue by ID from req.params.issueId
 */
export const loadIssue = async (req, res, next) => {
    try {
        const issueId = req.params.issueId;
        if (!issueId) return res.status(400).json({ success: false, message: "Missing issueId" });
        if (!isValidId(issueId)) return res.status(400).json({ success: false, message: "Invalid issueId" });

        const issue = await Issue.findById(issueId);
        if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

        req.issue = issue;
        if (!req.project && issue.projectId) {
            req.params.projectId = issue.projectId.toString();
        }
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error: loadIssue" });
    }
};

/**
 * Loads a task assignment by ID
 */
export const loadAssignment = async (req, res, next) => {
    try {
        const assignmentId = req.params.assignmentId;
        if (!assignmentId) return res.status(400).json({ success: false, message: "Missing assignmentId" });
        if (!isValidId(assignmentId)) return res.status(400).json({ success: false, message: "Invalid assignmentId" });

        const assignment = await TaskAssignment.findById(assignmentId);
        if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });

        req.assignment = assignment;
        // We need to fetch the task to get the projectId, since assignments only have taskId
        const task = await Task.findOne({ _id: assignment.taskId, isCancled: false });
        if (!task) {
            return res.status(404).json({ success: false, message: "Associated task not found" });
        }
        if (task && !req.project) {
            req.params.projectId = task.projectId.toString();
        }
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error: loadAssignment" });
    }
};

/**
 * Loads a material usage log by ID
 */
export const loadUsageLog = async (req, res, next) => {
    try {
        const usageLogId = req.params.usageLogId;
        if (!usageLogId) return res.status(400).json({ success: false, message: "Missing usageLogId" });
        if (!isValidId(usageLogId)) return res.status(400).json({ success: false, message: "Invalid usageLogId" });

        const log = await MaterialUsageLog.findOne({ _id: usageLogId, isVoided: false });
        if (!log) return res.status(404).json({ success: false, message: "Usage log not found" });

        req.usageLog = log;
        if (!req.project && log.projectId) {
            req.params.projectId = log.projectId.toString();
        }
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error: loadUsageLog" });
    }
};

// ----------------------------------------------------
// Authorizers
// ----------------------------------------------------

const ROLE_HIERARCHY = {
    OWNER: 50,
    PROJECT_MANAGER: 40,
    SITE_ENGINEER: 30,
    STORE_KEEPER: 20,
    ASSISTANT_ENGINEER: 10
};

/**
 * Ensures req.user is a valid member of req.project and has at least the minimum allowed role.
 * Global ADMIN bypasses all project role checks.
 */
export const authorizeProjectAccess = (minimumRole = "ASSISTANT_ENGINEER") => {
    return async (req, res, next) => {
        try {
            if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });
            if (!req.project) return res.status(400).json({ success: false, message: "Project context is required. Please use explicitly nested /api/projects/:projectId paths." });

            // Global Admins have implicit OWNER level access to everything
            if (req.user.userRole === "ADMIN") {
                req.membership = { role: "OWNER", isPrimary: true };
                return next();
            }

            // Normal users check the ProjectMembership table
            const membership = await ProjectMembership.findOne({
                projectId: req.project._id,
                userId: req.user._id,
                removedAt: null
            });

            if (!membership) {
                return res.status(403).json({ success: false, message: "Access denied. You are not an active member of this project." });
            }

            const userRoleWeight = ROLE_HIERARCHY[membership.role] || 0;
            const minimumWeight = ROLE_HIERARCHY[minimumRole] || 0;

            if (userRoleWeight < minimumWeight) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Requires at least ${minimumRole} role, but you are ${membership.role}.`
                });
            }

            // Attach membership so controllers know *how* they are authorized
            req.membership = membership;
            next();
        } catch (error) {
            return res.status(500).json({ success: false, message: "Internal server error: authorizeProjectAccess" });
        }
    };
};

/**
 * Ensures req.user has one of the specified global roles (e.g. ADMIN, STORE_KEEPER).
 * Used for non-project-scoped routes like creating master material items or users.
 */
export const authorizeGlobalRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }
        if (!roles.includes(req.user.userRole)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Requires one of: ${roles.join(", ")}`
            });
        }
        next();
    };
};
