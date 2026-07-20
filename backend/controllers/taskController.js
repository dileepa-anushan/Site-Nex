import mongoose from "mongoose";
import Task from "../models/task.js";
import Project from "../models/projects.js";
import TaskAssignment from "../models/taskAssignment.js";
import Issue from "../models/issue.js";
import TaskService from "../services/taskService.js";
import EventService from "../services/eventService.js";
import DeletionLog from "../models/deletionLog.js";
import SafetyNotice from "../models/safetyNotice.js";
import PermitToWork from "../models/permitToWork.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Create a new task under a project
// @route   POST /api/projects/:projectId/tasks
// @access  Admin / Project Manager
export const createTask = async (req, res) => {
    try {
        const { name, description, status, priority, startDate, endDate, percentComplete, dependencyTaskIds, estimatedHours, actualHours, assignedWorkers, assignedSiteEngineers, assignedStoreKeepers, parentTaskId } = req.body;
        const projectId = req.project._id;

        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({
                success: false,
                message: "startDate must be before endDate"
            });
        }
        // Validate task dates fit within project dates (compare date-only, ignoring time/timezone)
        const toDateOnly = (d) => new Date(new Date(d).toISOString().split("T")[0]);
        const taskStart = toDateOnly(startDate);
        const taskEnd = toDateOnly(endDate);
        const projStart = toDateOnly(req.project.startDate);
        const projEnd = toDateOnly(req.project.endDate);

        if (taskStart < projStart || taskEnd > projEnd) {
            return res.status(400).json({
                success: false,
                message: "Task timeline should be within the project timeline.",
            });
        }

        // Prevent direct creation as completed
        if (status === "Completed" || percentComplete === 100) {
            return res.status(422).json({
                success: false,
                message: "Cannot create a task directly as Completed. Please create it first and follow the completion workflow."
            });
        }

        // Delegate to TaskService for DFS Graph Cycle validation
        await TaskService.validateDependencies(projectId, null, dependencyTaskIds);

        // Subtask Hierarchical Validation
        if (parentTaskId) {
            const parentTask = await Task.findById(parentTaskId);
            if (!parentTask) {
                return res.status(404).json({ success: false, message: "Parent task not found" });
            }
            if (parentTask.projectId.toString() !== projectId.toString()) {
                return res.status(400).json({ success: false, message: "Subtasks must belong to the same project as their parent task." });
            }

            // Subtask workers must be purely a subset of the parent task's workers
            if (assignedWorkers && assignedWorkers.length > 0) {
                const parentWorkerIds = parentTask.assignedWorkers.map(w => w.toString());
                const invalidWorkers = assignedWorkers.filter(id => !parentWorkerIds.includes(id.toString()));
                if (invalidWorkers.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Subtask workers must be strictly selected from the parent task's assigned workers.",
                        invalidWorkers
                    });
                }
            }
        }

        const task = await Task.create({
            projectId,
            parentTaskId: parentTaskId || null,
            name,
            description,
            status,
            priority,
            startDate,
            endDate,
            percentComplete: percentComplete || 0,
            dependencyTaskIds: dependencyTaskIds || [],
            estimatedHours,
            actualHours,
            assignedWorkers: assignedWorkers || [],
            assignedSiteEngineers: assignedSiteEngineers || [],
            assignedStoreKeepers: assignedStoreKeepers || [],
        });

        // Sync project progress asynchronously so we don't block the response (Point H)
        EventService.emit("project:syncProgress", projectId);

        return res.status(201).json({ success: true, message: "Task created successfully", task });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all active tasks for a project
// @route   GET /api/projects/:projectId/tasks
// @access  Private
export const getTasksByProject = async (req, res) => {
    try {
        const projectId = req.project._id;

        const tasks = await Task.find({ projectId, isCancled: false })
            .populate("dependencyTaskIds", "name status percentComplete")
            .sort({ startDate: 1 });

        return res.status(200).json({ success: true, tasks });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get a single task by ID
// @route   GET /api/projects/:projectId/tasks/:id
// @access  Private
export const getTaskById = async (req, res) => {
    try {
        // req.task is loaded by the generic loadTask middleware
        const task = await Task.findById(req.task._id)
            .populate("projectId", "name location")
            .populate("dependencyTaskIds", "name status percentComplete");

        return res.status(200).json({ success: true, task });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a task
// @route   PUT /api/projects/:projectId/tasks/:id
// @access  Admin / Project Manager / Site Engineer
export const updateTask = async (req, res) => {
    try {
        const { name, description, status, priority, startDate, endDate, percentComplete, dependencyTaskIds, estimatedHours, actualHours, assignedWorkers, assignedSiteEngineers, assignedStoreKeepers } = req.body;

        // Validate date bounds against the project if modifying dates
        if (startDate || endDate) {
            const toDateOnly = (d) => new Date(new Date(d).toISOString().split("T")[0]);
            const finalStart = toDateOnly(startDate || req.task.startDate);
            const finalEnd = toDateOnly(endDate || req.task.endDate);

            if (finalStart < toDateOnly(req.project.startDate) || finalEnd > toDateOnly(req.project.endDate)) {
                return res.status(400).json({
                    success: false,
                    message: "Task timeline should be within the project timeline.",
                });
            }
        }

        // Delegate to TaskService for DFS Graph Cycle validation
        if (dependencyTaskIds && dependencyTaskIds.length > 0) {
            await TaskService.validateDependencies(req.project._id, req.task._id, dependencyTaskIds);
        }

        // Parent Worker Constraint Validation
        if (req.task.parentTaskId && assignedWorkers !== undefined && assignedWorkers.length > 0) {
            const parentTask = await Task.findById(req.task.parentTaskId);
            if (parentTask) {
                const parentWorkerIds = parentTask.assignedWorkers.map(w => w.toString());
                const invalidWorkers = assignedWorkers.filter(id => !parentWorkerIds.includes(id.toString()));
                if (invalidWorkers.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Subtask workers must be strictly selected from the parent task's assigned workers.",
                        invalidWorkers
                    });
                }
            }
        }

        // Prevent updating completion progress if task is Blocked (Stop/Hold Safety Notice)
        if (req.task.status === "Blocked") {
            if (percentComplete !== undefined && percentComplete !== req.task.percentComplete) {
                return res.status(422).json({
                    success: false,
                    message: "Cannot update progress. This task is currently blocked due to a safety Stop/Hold notice.",
                });
            }
        }

        // Prevent starting task if blocked by Safety
        if (status === "In Progress" && req.task.status !== "In Progress") {
            const activeNotice = await SafetyNotice.findOne({ taskId: req.task._id, status: "Active" });
            if (activeNotice) {
                return res.status(422).json({
                    success: false,
                    message: "Cannot start task. It is blocked by an active Stop/Hold Notice."
                });
            }
            const pendingPTW = await PermitToWork.findOne({ taskId: req.task._id, status: { $in: ["Pending", "Denied", "Revoked"] } });
            if (pendingPTW) {
                return res.status(422).json({
                    success: false,
                    message: `Cannot start task. A Permit to Work (${pendingPTW.permitType}) is currently ${pendingPTW.status}.`
                });
            }
        }

        // === Completion checks MUST run BEFORE mutating req.task fields ===
        // Check against the ORIGINAL task status (before line 210 sets it)
        const isBeingCompleted = (status === "Completed" && req.task.status !== "Completed") ||
            (percentComplete === 100 && req.task.percentComplete !== 100);

        if (isBeingCompleted) {
            // Block completion if an active safety notice exists on this task or project-wide
            const activeNotice = await SafetyNotice.findOne({
                projectId: req.project._id,
                status: "Active",
                $or: [
                    { taskId: req.task._id },
                    { taskId: null },
                    { taskId: { $exists: false } }
                ]
            });
            if (activeNotice) {
                return res.status(422).json({
                    success: false,
                    message: `Cannot complete task. It is blocked by an active Safety Notice (${activeNotice.severity || 'High'} severity): "${activeNotice.reason}". The notice must be lifted first.`
                });
            }

            const openIssuesCount = await Issue.countDocuments({
                taskId: req.task._id,
                status: { $nin: ["Resolved", "Closed"] },
                priority: { $in: ["High", "Critical"] }
            });

            if (openIssuesCount > 0) {
                return res.status(422).json({
                    success: false,
                    message: `Cannot complete task. There are ${openIssuesCount} High/Critical open issues blocking this task. Resolve them first.`
                });
            }
        }

        // Only update defined fields (AFTER completion checks pass)
        if (name !== undefined) req.task.name = name;
        if (description !== undefined) req.task.description = description;
        if (status !== undefined) req.task.status = status;
        if (priority !== undefined) req.task.priority = priority;
        if (startDate !== undefined) req.task.startDate = startDate;
        if (endDate !== undefined) req.task.endDate = endDate;
        if (percentComplete !== undefined) req.task.percentComplete = percentComplete;
        if (dependencyTaskIds !== undefined) req.task.dependencyTaskIds = dependencyTaskIds;
        if (estimatedHours !== undefined) req.task.estimatedHours = estimatedHours;
        if (actualHours !== undefined) req.task.actualHours = actualHours;
        if (assignedWorkers !== undefined) req.task.assignedWorkers = assignedWorkers;
        if (assignedSiteEngineers !== undefined) req.task.assignedSiteEngineers = assignedSiteEngineers;
        if (assignedStoreKeepers !== undefined) req.task.assignedStoreKeepers = assignedStoreKeepers;

        // If completed, finalize the status
        if (isBeingCompleted) {
            req.task.status = "Completed";
            req.task.percentComplete = 100;
        }

        await req.task.save();

        if (endDate !== undefined) {
            await TaskService.autoRescheduleDependentTasks(req.task._id);
        }

        // Sync project progress asynchronously
        EventService.emit("project:syncProgress", req.task.projectId);

        return res.status(200).json({ success: true, message: "Task updated successfully", task: req.task });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Hard-delete a task
// @route   PATCH /api/projects/:projectId/tasks/:id/cancel
// @access  Admin / Project Manager
export const cancelTask = async (req, res) => {
    try {
        const { reason } = req.body;
        const deletedByUserId = req.user._id;

        // Fetch assignments to log
        const assignments = await TaskAssignment.find({ taskId: req.task._id });

        const logs = [];
        logs.push({ entityType: "Task", entityId: req.task._id, entityName: req.task.name, deletedBy: deletedByUserId, reason: reason || "Not specified" });

        assignments.forEach(a => logs.push({ entityType: "TaskAssignment", entityId: a._id, deletedBy: deletedByUserId, reason: "Parent task deleted" }));

        if (logs.length > 0) {
            await DeletionLog.insertMany(logs);
        }

        // Hard deletes (cascade to subtasks)
        const subtasks = await Task.find({ parentTaskId: req.task._id });
        const cascadeIds = [req.task._id, ...subtasks.map(t => t._id)];

        await TaskAssignment.deleteMany({ taskId: { $in: cascadeIds } });
        await Issue.deleteMany({ taskId: { $in: cascadeIds } });
        await Task.deleteMany({ _id: { $in: cascadeIds } });

        // Sync project progress asynchronously
        EventService.emit("project:syncProgress", req.task.projectId);

        return res.status(200).json({ success: true, message: "Task deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add a progress note to a task
// @route   POST /api/projects/:projectId/tasks/:id/notes
// @access  Project Team
export const addProgressNote = async (req, res) => {
    try {
        const { note } = req.body;
        if (!note) return res.status(400).json({ success: false, message: "Note is required" });

        const updatedTask = await TaskService.addProgressNote(req.task._id, note, req.user._id);
        return res.status(201).json({ success: true, message: "Progress note added", task: updatedTask });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all progress notes for a task (descending by date)
// @route   GET /api/projects/:projectId/tasks/:id/notes
// @access  Project Member
export const getTaskNotes = async (req, res) => {
    try {
        const notes = await TaskService.getTaskNotes(req.task._id);
        return res.status(200).json({ success: true, notes });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Request task completion (Site Engineer)
// @route   PATCH /api/projects/:projectId/tasks/:taskId/request-completion
// @access  Site Engineer or above
export const requestCompletion = async (req, res) => {
    try {
        const { note } = req.body;
        const task = await TaskService.requestCompletion(req.task._id, req.user._id, note);
        return res.status(200).json({ success: true, message: "Task completion requested", task });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Approve task completion (Project Manager)
// @route   PATCH /api/projects/:projectId/tasks/:taskId/approve-completion
// @access  Project Manager or above
export const approveCompletion = async (req, res) => {
    try {
        const { note } = req.body;

        // Strict Authorization: SEs can approve Subtasks but NOT Main Tasks
        if (!req.task.parentTaskId) {
            // It's a Main Task
            if (req.member.role !== "PROJECT_MANAGER" && req.member.role !== "OWNER") {
                return res.status(403).json({ success: false, message: "Only Project Managers can approve Main Tasks." });
            }
        } else {
            // It's a Subtask
            if (req.member.role !== "SITE_ENGINEER" && req.member.role !== "PROJECT_MANAGER" && req.member.role !== "OWNER") {
                return res.status(403).json({ success: false, message: "Unauthorized to approve subtasks." });
            }
        }

        const task = await TaskService.approveCompletion(req.task._id, req.user._id, note);

        // Complete cascade (auto reschedule & event sync)
        await TaskService.autoRescheduleDependentTasks(task._id);
        EventService.emit("project:syncProgress", task.projectId);

        return res.status(200).json({ success: true, message: "Task completion approved", task });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get blocked tasks for a project
// @route   GET /api/projects/:projectId/tasks/blocked
// @access  Site Engineer
export const getBlockedTasks = async (req, res) => {
    try {
        const tasks = await TaskService.getBlockedTasks(req.project._id);
        return res.status(200).json({ success: true, tasks });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
