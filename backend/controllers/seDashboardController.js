import Task from "../models/task.js";
import Project from "../models/projects.js";
import ProjectMembership from "../models/projectMembership.js";
import MaterialRequest from "../models/materialRequest.js";
import SafetyNotice from "../models/safetyNotice.js";
import mongoose from "mongoose";
import Subtask from "../models/subtask.js";

// @desc    Get dashboard metrics for SE
// @route   GET /api/se/metrics
// @access  Site Engineer
export const getSEDashboardMetrics = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Get all projects where SE is a verified project member
        const memberships = await ProjectMembership.find({ 
            userId, 
            role: "SITE_ENGINEER", 
            removedAt: null 
        }).select("projectId");
        
        const projectIds = memberships.map(m => m.projectId);

        // 2. Metrics 
        // a. Active Tasks assigned specifically to this SE
        const activeTasks = await Task.countDocuments({
            projectId: { $in: projectIds },
            assignedSiteEngineers: userId,
            status: { $in: ["In Progress", "Not Started", "Blocked"] }
        });

        // b. Subtasks needing approval 
        // Subtasks are those where parentTaskId != null. They need approval if completionRequested == true and completionApprovedBy == null
        // Subtasks logically belong to projects managed by this SE.
        const pendingSubtaskApprovals = await Subtask.countDocuments({
            projectId: { $in: projectIds },
            completionRequested: true,
            completionApprovedBy: null
        });

        // c. Open Safety Notices across SE's projects
        const openSafetyNotices = await SafetyNotice.countDocuments({
            projectId: { $in: projectIds },
            status: "Active"
        });

        // d. Material Requests by SE
        const recentMaterialRequests = await MaterialRequest.countDocuments({
            requestedBy: userId,
            status: "Pending" // Assuming "Pending" is a status
        });

        return res.status(200).json({
            success: true,
            metrics: {
                activeTasks,
                pendingSubtaskApprovals,
                openSafetyNotices,
                recentMaterialRequests
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all active tasks assigned to SE
// @route   GET /api/se/assigned-tasks
// @access  Site Engineer
export const getSEAssignedTasks = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const mainTasks = await Task.find({
            assignedSiteEngineers: userId,
            isCancled: false,
            parentTaskId: null
        })
        .populate("projectId", "name location")
        .populate("assignedWorkers", "name trade")
        .sort({ startDate: 1 });

        const mainTaskIds = mainTasks.map(t => t._id);

        const subTasks = await Subtask.find({
            parentTaskId: { $in: mainTaskIds },
            isCancled: false
        })
        .populate("projectId", "name location")
        .populate("assignedWorkers", "name trade")
        .sort({ startDate: 1 });

        const PermitToWork = (await import("../models/permitToWork.js")).default;
        const ptws = await PermitToWork.find({ taskId: { $in: subTasks.map(s => s._id) } });

        const subTasksWithPTWs = subTasks.map(st => {
            const ptw = ptws.find(p => p.taskId.toString() === st._id.toString());
            return {
                ...st.toObject(),
                ptw: ptw || null
            };
        });

        const tasks = [...mainTasks, ...subTasksWithPTWs];

        return res.status(200).json({ success: true, tasks });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all subtasks awaiting SE approval
// @route   GET /api/se/subtask-approvals
// @access  Site Engineer
export const getSESubtaskApprovals = async (req, res) => {
    try {
        const userId = req.user._id;

        const memberships = await ProjectMembership.find({ userId, role: "SITE_ENGINEER", removedAt: null }).select("projectId");
        const projectIds = memberships.map(m => m.projectId);

        const subtasks = await Subtask.find({
            projectId: { $in: projectIds },
            completionRequested: true,
            completionApprovedBy: null,
            isCancled: false
        })
        .populate("projectId", "name")
        .populate("parentTaskId", "name")
        .populate("completionRequestedBy", "name email");

        return res.status(200).json({ success: true, subtasks });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get SE projects
// @route   GET /api/se/my-projects
// @access  Site Engineer
export const getSEProjects = async (req, res) => {
    try {
        const userId = req.user._id;
        const memberships = await ProjectMembership.find({ userId, role: "SITE_ENGINEER", removedAt: null }).populate("projectId");
        const projects = memberships.map(m => m.projectId).filter(p => p !== null);

        return res.status(200).json({ success: true, projects });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Material Requests created by SE
// @route   GET /api/se/material-requests
// @access  Site Engineer
export const getSEMaterialRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        const requests = await MaterialRequest.find({ requestedBy: userId })
            .populate("projectId", "name createdAt")
            .populate("taskId", "name status")
            .populate("materialItemId", "name unit code")
            .populate("toolId", "name serialNumber")
            .populate("comments.createdBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, requests });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
