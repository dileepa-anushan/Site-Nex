import Task from "../models/task.js";
import Issue from "../models/issue.js";
import Project from "../models/projects.js";
import ProjectMembership from "../models/projectMembership.js";
import SiteProgressReport from "../models/siteProgressReport.js";
import SafetyNotice from "../models/safetyNotice.js";
import SafetyObservation from "../models/safetyObservation.js";
import Worker from "../models/worker.js";
import User from "../models/users.js";
import IssuanceLog from "../models/issuanceLog.js";

// Helper to reliably map the user's active projects
const getUserProjectIds = async (userId) => {
    const memberships = await ProjectMembership.find({ userId, removedAt: null }).select("projectId");
    return memberships.map(m => m.projectId);
};

// @desc    Get all SE and SK users with their accurate availability status
// @route   GET /api/pm/available-users
// @access  Private
export const getAvailableUsers = async (req, res) => {
    try {
        const users = await User.find({ userRole: { $in: ["SITE_ENGINEER", "STORE_KEEPER", "SAFETY_OFFICER", "WORKER"] }, isActive: true })
            .select("name email userRole");

        const userStatuses = await Promise.all(users.map(async (u) => {
            const membership = await ProjectMembership.findOne({ userId: u._id, removedAt: null }).populate("projectId", "name");
            return {
                id: u._id,
                name: u.name,
                email: u.email,
                role: u.userRole,
                status: membership && membership.projectId ? `Assigned to ${membership.projectId.name}` : "Available"
            };
        }));

        return res.status(200).json({ success: true, users: userStatuses });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all projects the user is a member of
// @route   GET /api/pm/projects
// @access  Private
export const getAllProjects = async (req, res) => {
    try {
        const projectIds = await getUserProjectIds(req.user._id);
        const projects = await Project.find({ _id: { $in: projectIds } }).sort({ createdAt: -1 });

        // Compute progress for each project based on task completion
        const projectsWithProgress = await Promise.all(projects.map(async (proj) => {
            const tasks = await Task.find({ projectId: proj._id, isCancled: false });
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.status === "Completed").length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            // Derive status for UI
            let uiStatus = "Planning";
            if (proj.status === "Active") uiStatus = "Active";
            else if (proj.status === "Completed") uiStatus = "Completed";
            else if (proj.status === "On Hold") uiStatus = "On Hold";
            else if (proj.status === "Planning") uiStatus = "Planning";

            return {
                ...proj.toObject(),
                progress,
                status: uiStatus,
                taskCount: totalTasks,
                completedTaskCount: completedTasks
            };
        }));

        return res.status(200).json({ success: true, projects: projectsWithProgress });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all tasks across all active projects for the user
// @route   GET /api/pm/tasks
// @access  Private
export const getAllTasks = async (req, res) => {
    try {
        const projectIds = await getUserProjectIds(req.user._id);
        const tasks = await Task.find({ projectId: { $in: projectIds }, isCancled: false })
            .populate("dependencyTaskIds", "name status percentComplete")
            .sort({ startDate: 1 });

        return res.status(200).json({ success: true, tasks });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all issues across all active projects for the user
// @route   GET /api/pm/issues
// @access  Private
export const getAllIssues = async (req, res) => {
    try {
        const projectIds = await getUserProjectIds(req.user._id);
        const issues = await Issue.find({ projectId: { $in: projectIds } })
            .populate("taskId", "name")
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email")
            .sort({ reportedDate: -1 });

        return res.status(200).json({ success: true, issues });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};



// @desc    Get all active workers across all active projects for the user
// @route   GET /api/pm/workers
// @access  Private
export const getAllWorkers = async (req, res) => {
    try {
        const projectIds = await getUserProjectIds(req.user._id);
        const workers = await Worker.find({ projectId: { $in: projectIds } })
            .populate("projectId", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, workers });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all site reports across all active projects for the user
// @route   GET /api/pm/reports
// @access  Private
export const getAllReports = async (req, res) => {
    try {
        const projectIds = await getUserProjectIds(req.user._id);
        const reports = await SiteProgressReport.find({ projectId: { $in: projectIds } })
            .populate("reportedBy", "name email")
            .populate("projectId", "name")
            .sort({ reportDate: -1, createdAt: -1 });

        return res.status(200).json({ success: true, reports });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


// @desc    Get all safety notices across all active projects
// @route   GET /api/pm/safety-notices
// @access  Private
export const getAllSafetyNotices = async (req, res) => {
    try {
        const projectIds = await getUserProjectIds(req.user._id);
        const notices = await SafetyNotice.find({ projectId: { $in: projectIds } })
            .populate("issuedBy", "name")
            .sort({ dateIssued: -1 });

        return res.status(200).json({ success: true, safetyNotices: notices });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all safety observations across all active projects
// @route   GET /api/pm/safety-observations
// @access  Private
export const getAllSafetyObservations = async (req, res) => {
    try {
        const projectIds = await getUserProjectIds(req.user._id);
        const observations = await SafetyObservation.find({ projectId: { $in: projectIds } })
            .populate("projectId", "name")
            .populate("reportedBy", "name")
            .populate("taskId", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, safetyObservations: observations });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Hold a task based on safety observation
// @route   POST /api/pm/hold-task
// @access  Private
export const holdTask = async (req, res) => {
    try {
        const { projectId, taskId, reason, observationId } = req.body;

        // Ensure user is PM for this project
        const projectIds = await getUserProjectIds(req.user._id);
        if (!projectIds.some(id => id.toString() === projectId.toString())) {
            return res.status(403).json({ success: false, message: "Not authorized for this project" });
        }

        const task = await Task.findOne({ _id: taskId, projectId });
        if (!task) return res.status(404).json({ success: false, message: "Task not found" });

        // Update task status
        task.status = "On Hold";
        await task.save();

        // Create safety notice
        const notice = await SafetyNotice.create({
            projectId,
            taskId,
            status: "Active",
            severity: req.body.severity || "High",
            reason: reason || "Task put on hold due to critical safety observation.",
            issuedBy: req.user._id
        });

        // Optionally, update the observation status
        if (observationId) {
            await SafetyObservation.findByIdAndUpdate(observationId, { status: "Resolved", actionTaken: "Task blocked" });
        }

        return res.status(200).json({ success: true, message: "Task put on hold. Safety notice issued.", notice, task });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update severity of a safety notice
// @route   PATCH /api/pm/safety-notices/:noticeId/severity
// @access  Project Manager
export const updateNoticeSeverity = async (req, res) => {
    try {
        const { severity } = req.body;
        if (!["Low", "Medium", "High", "Critical"].includes(severity)) {
            return res.status(400).json({ success: false, message: "Invalid severity value" });
        }

        const notice = await SafetyNotice.findById(req.params.noticeId);
        if (!notice) return res.status(404).json({ success: false, message: "Safety Notice not found" });

        // Ensure PM has access to this project
        const projectIds = await getUserProjectIds(req.user._id);
        if (!projectIds.some(id => id.toString() === notice.projectId.toString())) {
            return res.status(403).json({ success: false, message: "Not authorized for this project" });
        }

        notice.severity = severity;
        await notice.save();

        return res.status(200).json({ success: true, message: "Severity updated", notice });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get store reports (issuance logs) across PM's projects
// @route   GET /api/pm/store-reports
// @access  Private
export const getStoreReports = async (req, res) => {
    try {
        const projectIds = await getUserProjectIds(req.user._id);
        const logs = await IssuanceLog.find({ projectId: { $in: projectIds } })
            .populate("materialItemId", "name code unit category")
            .populate("mainStorageToolId", "name code condition")
            .populate("projectId", "name")
            .populate("taskId", "name")
            .populate("requestedBy", "name email")
            .populate("issuedBy", "name")
            .sort({ issuedDate: -1 });

        return res.status(200).json({ success: true, reports: logs });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
