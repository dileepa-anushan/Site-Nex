import mongoose from "mongoose";
import TaskAssignment from "../models/taskAssignment.js";
import Task from "../models/task.js";
import User from "../models/users.js";
import EventService from "../services/eventService.js";
import ProjectMembership from "../models/projectMembership.js";
import DeletionLog from "../models/deletionLog.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Assign a user to a task
// @route   POST /api/task-assignments
// @access  Admin / Project Manager
export const assignUser = async (req, res) => {
    try {
        const { taskId, userId, roleOnTask, expectedHours } = req.body;

        if (!taskId || !userId || !roleOnTask) {
            return res.status(400).json({ success: false, message: "taskId, userId and roleOnTask are required" });
        }

        if (!isValidId(taskId) || !isValidId(userId)) {
            return res.status(400).json({ success: false, message: "Invalid taskId or userId" });
        }

        // Verify task and user exist
        const [task, user] = await Promise.all([
            Task.findOne({ _id: taskId, isCancled: false }),
            User.findOne({ _id: userId, isActive: true }),
        ]);

        if (!task) return res.status(404).json({ success: false, message: "Task not found or is cancelled" });
        if (!user) return res.status(404).json({ success: false, message: "User not found or is inactive" });

        // Require task to belong to the requested project
        if (task.projectId.toString() !== req.project._id.toString()) {
            return res.status(400).json({ success: false, message: "Task does not belong to the requested project" });
        }

        const membership = await ProjectMembership.findOne({
            projectId: req.project._id,
            userId,
            removedAt: null
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "User is not a member of this project"
            });
        }

        // Prevent duplicate active assignments
        const existing = await TaskAssignment.findOne({ taskId, userId, removedAt: null });
        if (existing) {
            return res.status(409).json({ success: false, message: "User is already assigned to this task" });
        }

        const assignment = await TaskAssignment.create({
            taskId,
            userId,
            roleOnTask,
            expectedHours: expectedHours || 0,
        });

        return res.status(201).json({ success: true, message: "User assigned to task successfully", assignment });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all active assignments for a task
// @route   GET /api/task-assignments?taskId=xxx
// @access  Private
export const getAssignmentsByTask = async (req, res) => {
    try {
        const { taskId } = req.query;

        if (!taskId) {
            return res.status(400).json({ success: false, message: "taskId query parameter is required" });
        }

        if (!isValidId(taskId)) {
            return res.status(400).json({ success: false, message: "Invalid taskId" });
        }

        const task = await Task.findOne({ _id: taskId, isCancled: false });
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }
        if (task.projectId.toString() !== req.project._id.toString()) {
            return res.status(403).json({ success: false, message: "Task belongs to another project" });
        }

        const assignments = await TaskAssignment.find({ taskId, removedAt: null })
            .populate("userId", "name email userRole phone");

        return res.status(200).json({ success: true, assignments });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update expected/actual hours and workStarted flag
// @route   PATCH /api/task-assignments/:id/hours
// @access  Private
export const updateHours = async (req, res) => {
    try {
        // req.assignment is already loaded by checkAssignmentMember middleware
        // Ownership rule: Only the assignee (or an ADMIN) can edit their own work hours
        if (req.assignment.userId.toString() !== req.user._id.toString() && req.user.userRole !== "ADMIN") {
            return res.status(403).json({ success: false, message: "You can only edit your own work hours" });
        }

        const { expectedHours, actualHours, workStarted } = req.body;

        // Prevent cheating: limit maximum actualHours increment or total per day
        // For simplicity, we just block setting actualHours to > 24 for a single day's log, 
        // but since this is cumulative in the current schema, let's just ensure it's a reasonable number
        // A better approach is daily logs, but let's just cap the update to max +24h per request diff
        if (actualHours !== undefined) {
            const diff = actualHours - req.assignment.actualHours;
            if (diff > 24) {
                return res.status(422).json({ success: false, message: "Cannot log more than 24 hours at a time" });
            }
        }

        // Only update defined fields
        if (expectedHours !== undefined) req.assignment.expectedHours = expectedHours;
        if (actualHours !== undefined) req.assignment.actualHours = actualHours;
        if (workStarted !== undefined) req.assignment.workStarted = workStarted;

        await req.assignment.save();

        return res.status(200).json({ success: true, message: "Hours updated successfully", assignment: req.assignment });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Hard-remove a user from a task with logs
// @route   PATCH /api/task-assignments/:id/remove
// @access  Admin / Project Manager
export const removeAssignment = async (req, res) => {
    try {
        const { reason, removedReason } = req.body;
        const finalReason = reason || removedReason || "Removed explicitly";
        const deletedByUserId = req.user._id;

        const log = new DeletionLog({
            entityType: "TaskAssignment",
            entityId: req.assignment._id,
            deletedBy: deletedByUserId,
            reason: finalReason
        });
        await log.save();

        await req.assignment.deleteOne();

        EventService.emit("project:syncProgress", req.project._id);

        return res.status(200).json({ success: true, message: "User removed from task successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
