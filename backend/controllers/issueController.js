import mongoose from "mongoose";
import Issue from "../models/issue.js";
import Task from "../models/task.js";
import User from "../models/users.js";
import ProjectMembership from "../models/projectMembership.js";
import EventService from "../services/eventService.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Valid status transitions — prevents jumping from Open → Closed without resolving
const STATUS_FLOW = {
    Open: ["Assigned", "In Progress"],
    Assigned: ["In Progress", "Open"],
    "In Progress": ["Resolved"],
    Resolved: ["Closed"],
    Closed: [],
};

// @desc    Create a new issue
// @route   POST /api/projects/:projectId/issues
// @access  Private
export const createIssue = async (req, res) => {
    try {
        const { title, type, taskId, description, priority, dueDate, reportedLocation, severity } = req.body;
        const projectId = req.project._id;

        // Optionally verify task exists if provided
        if (taskId) {
            if (!isValidId(taskId)) {
                return res.status(400).json({ success: false, message: "Invalid taskId" });
            }
            const task = await Task.findOne({ _id: taskId, isCancled: false });
            if (!task) return res.status(404).json({ success: false, message: "Task not found" });

            // Validate that the task belongs to the same project as the issue
            if (task.projectId.toString() !== projectId.toString()) {
                return res.status(400).json({ success: false, message: "Task does not belong to the specified project" });
            }
        }

        const issue = await Issue.create({
            title,
            type,
            projectId,
            taskId: taskId || null,
            description,
            priority,
            dueDate,
            reportedLocation,
            severity,
            createdBy: req.user._id,
        });

        return res.status(201).json({ success: true, message: "Issue created successfully", issue });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all issues for a project (optional filters: status, priority)
// @route   GET /api/projects/:projectId/issues?status=Open&priority=High
// @access  Private
export const getIssuesByProject = async (req, res) => {
    try {
        const { status, priority } = req.query;
        const projectId = req.project._id;

        const filter = { projectId };
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        const issues = await Issue.find(filter)
            .populate("createdBy", "name email")
            .populate("assignedTo", "name email userRole")
            .populate("taskId", "name status")
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, issues });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get a single issue by ID
// @route   GET /api/projects/:projectId/issues/:id
// @access  Private
export const getIssueById = async (req, res) => {
    try {
        // req.issue and req.project are loaded by checkIssueMember middleware
        const issue = await Issue.findById(req.issue._id)
            .populate("createdBy", "name email")
            .populate("assignedTo", "name email userRole")
            .populate("taskId", "name status percentComplete")
            .populate("projectId", "name location");

        return res.status(200).json({ success: true, issue });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update issue title, description, priority or dueDate
// @route   PUT /api/projects/:projectId/issues/:id
// @access  Private
export const updateIssue = async (req, res) => {
    try {
        const { title, type, description, priority, dueDate, reportedLocation, severity } = req.body;

        // Only update defined fields; do NOT allow direct status change here (use dedicated endpoints)
        if (title !== undefined) req.issue.title = title;
        if (type !== undefined) req.issue.type = type;
        if (description !== undefined) req.issue.description = description;
        if (priority !== undefined) req.issue.priority = priority;
        if (dueDate !== undefined) req.issue.dueDate = dueDate;
        if (reportedLocation !== undefined) req.issue.reportedLocation = reportedLocation;
        if (severity !== undefined) req.issue.severity = severity;

        await req.issue.save();

        return res.status(200).json({ success: true, message: "Issue updated successfully", issue: req.issue });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update issue status directly
// @route   PATCH /api/projects/:projectId/issues/:id/status
// @access  Project Manager
export const updateIssueStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["Open", "Assigned", "In Progress", "Resolved", "Closed"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value provided" });
        }
        req.issue.status = status;
        await req.issue.save();
        return res.status(200).json({ success: true, message: "Issue status updated successfully", issue: req.issue });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Assign an issue to a user
// @route   PATCH /api/projects/:projectId/issues/:id/assign
// @access  Admin / Project Manager
export const assignIssue = async (req, res) => {
    try {
        const { assignedTo } = req.body;

        if (!assignedTo || !isValidId(assignedTo)) {
            return res.status(400).json({ success: false, message: "Valid assignedTo userId is required" });
        }

        const assignee = await User.findOne({ _id: assignedTo, isActive: true });
        if (!assignee) return res.status(404).json({ success: false, message: "Assignee user not found or is inactive" });

        const membership = await ProjectMembership.findOne({
            projectId: req.project._id,
            userId: assignedTo,
            removedAt: null
        });

        if (!membership) {
            return res.status(403).json({ success: false, message: "User is not a member of this project" });
        }

        // Validate status transition
        const allowed = STATUS_FLOW[req.issue.status] || [];
        if (!allowed.includes("Assigned") && req.issue.status !== "Open" && req.issue.status !== "Assigned") {
            return res.status(422).json({ success: false, message: `Cannot assign an issue with status "${req.issue.status}"` });
        }

        req.issue.assignedTo = assignedTo;
        req.issue.status = "Assigned";
        await req.issue.save();

        return res.status(200).json({ success: true, message: "Issue assigned successfully", issue: req.issue });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark an issue as resolved
// @route   PATCH /api/projects/:projectId/issues/:id/resolve
// @access  Private
export const resolveIssue = async (req, res) => {
    try {
        const { resolutionNote } = req.body;

        // Enforce resolution permissions: Only the assigned user or an ADMIN/PM can resolve the issue
        const isAssignee = req.issue.assignedTo && req.issue.assignedTo.toString() === req.user._id.toString();
        const isManager = req.user.userRole === "ADMIN" || req.user.userRole === "PROJECT_MANAGER";
        if (!isAssignee && !isManager) {
            return res.status(403).json({ success: false, message: "Only the user assigned to this issue or a project manager can resolve it" });
        }

        // Enforce status flow: only In Progress can be resolved
        if (req.issue.status !== "In Progress" && req.issue.status !== "Assigned") {
            return res.status(422).json({ success: false, message: `Cannot resolve an issue with status "${req.issue.status}". Move it to In Progress first.` });
        }

        req.issue.status = "Resolved";
        req.issue.resolutionNote = resolutionNote;
        req.issue.resolvedAt = new Date();
        await req.issue.save();

        // Sync project progress (resolving a blocking issue might unblock tasks/project)
        EventService.emit("project:syncProgress", req.issue.projectId);

        return res.status(200).json({ success: true, message: "Issue resolved successfully", issue: req.issue });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Close an issue (after verifying resolution)
// @route   PATCH /api/projects/:projectId/issues/:id/close
// @access  Admin / Project Manager
export const closeIssue = async (req, res) => {
    try {
        if (req.issue.status !== "Resolved") {
            return res.status(422).json({ success: false, message: "Issue must be Resolved before it can be Closed" });
        }

        req.issue.status = "Closed";
        req.issue.closedAt = new Date();
        await req.issue.save();

        EventService.emit("project:syncProgress", req.issue.projectId);

        return res.status(200).json({ success: true, message: "Issue closed successfully", issue: req.issue });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete an issue
// @route   DELETE /api/projects/:projectId/issues/:id
// @access  Site Engineer (who created it) or Project Manager
export const deleteIssue = async (req, res) => {
    try {
        const isCreator = req.issue.createdBy.toString() === req.user._id.toString();
        const isManager = req.user.userRole === "ADMIN" || req.user.userRole === "PROJECT_MANAGER";
        
        if (!isCreator && !isManager) {
            return res.status(403).json({ success: false, message: "Only the user who created this issue or a project manager can delete it" });
        }

        await req.issue.deleteOne();

        return res.status(200).json({ success: true, message: "Issue deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
