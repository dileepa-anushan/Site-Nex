import mongoose from "mongoose";
import Project from "../models/projects.js";
import ProjectMembership from "../models/projectMembership.js";
import ProjectService from "../services/projectService.js";
import Task from "../models/task.js";
import Issue from "../models/issue.js";
import User from "../models/users.js";
import TaskAssignment from "../models/taskAssignment.js";
import DeletionLog from "../models/deletionLog.js";
import IssuanceLog from "../models/issuanceLog.js";

const MEMBER_ROLES = ["PROJECT_MANAGER", "SITE_ENGINEER", "ASSISTANT_ENGINEER", "STORE_KEEPER"];

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const formatProjectDates = (p) => {
    const obj = p.toObject ? p.toObject() : p;

    return {
        ...obj,
        startDateReadable: new Date(obj.startDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }),
        endDateReadable: new Date(obj.endDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }),
    };
};

const checkActiveAssignments = async (userIds, excludeProjectId = null) => {
    if (!userIds || userIds.length === 0) return null;

    // Find active memberships for these users
    const query = {
        userId: { $in: userIds },
        removedAt: null
    };
    if (excludeProjectId) {
        query.projectId = { $ne: excludeProjectId };
    }

    const activeMembersHips = await ProjectMembership.find(query).populate("projectId", "status name");

    const conflict = activeMembersHips.find(m =>
        m.projectId && m.projectId.status !== "Completed"
    );

    if (conflict) {
        return `User is already assigned to another active project: ${conflict.projectId.name}`;
    }
    return null;
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Admin
export const createProject = async (req, res) => {
    try {
        const { name, location, startDate, endDate, description, budget, status, progress, clientName, projectCode, plannedBudget, actualBudgetUsed, assignedSiteEngineers, assignedStoreKeepers, assignedSafetyOfficers } = req.body;

        // Check for active assignments
        const usersToCheck = [
            ...(assignedSiteEngineers || []),
            ...(assignedStoreKeepers || []),
            ...(assignedSafetyOfficers || [])
        ];

        const conflictError = await checkActiveAssignments(usersToCheck);
        if (conflictError) {
            return res.status(400).json({ success: false, message: conflictError });
        }

        const project = await Project.create({
            name,
            location,
            startDate,
            endDate,
            description,
            budget,
            status,
            progress,
            clientName,
            projectCode,
            plannedBudget,
            actualBudgetUsed
        });

        // Automatically add the creator as the OWNER
        await ProjectMembership.create({
            projectId: project._id,
            userId: req.user._id,
            role: "OWNER",
            isPrimary: true
        });

        // Assign Site Engineers
        if (assignedSiteEngineers && Array.isArray(assignedSiteEngineers) && assignedSiteEngineers.length > 0) {
            const seMemberships = assignedSiteEngineers.map(id => ({
                projectId: project._id,
                userId: id,
                role: "SITE_ENGINEER"
            }));
            await ProjectMembership.insertMany(seMemberships);
        }

        // Assign Store Keepers
        if (assignedStoreKeepers && Array.isArray(assignedStoreKeepers) && assignedStoreKeepers.length > 0) {
            const skMemberships = assignedStoreKeepers.map(id => ({
                projectId: project._id,
                userId: id,
                role: "STORE_KEEPER"
            }));
            await ProjectMembership.insertMany(skMemberships);
        }

        // Assign Safety Officers
        if (assignedSafetyOfficers && Array.isArray(assignedSafetyOfficers) && assignedSafetyOfficers.length > 0) {
            const soMemberships = assignedSafetyOfficers.map(id => ({
                projectId: project._id,
                userId: id,
                role: "SAFETY_OFFICER"
            }));
            await ProjectMembership.insertMany(soMemberships);
        }

        const projectData = formatProjectDates(project);
        return res.status(201).json({ success: true, message: "Project created successfully", project: projectData });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getAllProjects = async (req, res) => {
    try {
        // ADMIN sees all projects; other roles see only projects they are members of
        const filter = { isDeleted: false };
        if (req.user.userRole !== "ADMIN") {
            // Find projects this user belongs to
            const memberships = await ProjectMembership.find({ userId: req.user._id, removedAt: null }).select("projectId");
            const projectIds = memberships.map(m => m.projectId);
            filter._id = { $in: projectIds };
        }

        const projects = await Project.find(filter).sort({ createdAt: -1 });

        return res.status(200).json({ success: true, projects });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Admin / Project Manager
export const getProjectById = async (req, res) => {
    try {
        // req.project is already loaded by loadProject middleware
        const project = req.project.toObject();

        // Fetch active members mapped dynamically
        const memberships = await ProjectMembership.find({ projectId: project._id, removedAt: null }).populate("userId", "name email userRole phone");
        project.members = memberships.map(m => ({
            userId: m.userId,
            role: m.role,
            isPrimary: m.isPrimary,
            joinedAt: m.joinedAt
        }));

        return res.status(200).json({ success: true, project });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Admin / Project Manager
export const updateProject = async (req, res) => {
    try {
        const { name, location, startDate, endDate, description, budget, status, clientName, projectCode, plannedBudget, actualBudgetUsed } = req.body;

        // Validate projectCode format if provided
        if (projectCode !== undefined && projectCode !== '') {
            const codeRegex = /^[A-Za-z0-9\-_]+$/;
            if (!codeRegex.test(projectCode)) {
                return res.status(400).json({ success: false, message: "Project Code must be alphanumeric (dashes and underscores allowed, no spaces)." });
            }
        }

        // Validate dates if provided
        if (startDate && endDate) {
            if (new Date(endDate) <= new Date(startDate)) {
                return res.status(400).json({ success: false, message: "End Date must be after the Start Date." });
            }
        }

        // Validate budget
        if (budget !== undefined && Number(budget) < 0) {
            return res.status(400).json({ success: false, message: "Budget cannot be negative." });
        }
        if (plannedBudget !== undefined && Number(plannedBudget) < 0) {
            return res.status(400).json({ success: false, message: "Planned Budget cannot be negative." });
        }

        // Only update defined fields
        if (name !== undefined) req.project.name = name;
        if (location !== undefined) req.project.location = location;
        if (startDate !== undefined) req.project.startDate = startDate;
        if (endDate !== undefined) req.project.endDate = endDate;
        if (description !== undefined) req.project.description = description;
        if (budget !== undefined) req.project.budget = budget;
        if (status !== undefined) req.project.status = status;
        if (clientName !== undefined) req.project.clientName = clientName;
        if (projectCode !== undefined) req.project.projectCode = projectCode;
        if (plannedBudget !== undefined) req.project.plannedBudget = plannedBudget;
        if (actualBudgetUsed !== undefined) req.project.actualBudgetUsed = actualBudgetUsed;

        await req.project.save();

        return res.status(200).json({ success: true, message: "Project updated successfully", project: req.project });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Soft-delete a project (marks isDeleted = true)
// @route   DELETE /api/projects/:id
// @access  Admin
export const deleteProject = async (req, res) => {
    try {
        const { reason } = req.body;
        await ProjectService.deleteProject(req.project._id, req.user._id, reason);

        return res.status(200).json({ success: true, message: "Project deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add a member to a project
// @route   POST /api/projects/:id/members
// @access  Admin / Project Manager
export const addMember = async (req, res) => {
    try {
        if (!isValidId(req.params.projectId)) {
            return res.status(400).json({ success: false, message: "Invalid project ID" });
        }

        const { userId, role, isPrimary } = req.body;

        if (!MEMBER_ROLES.includes(role)) {
            return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${MEMBER_ROLES.join(", ")}` });
        }

        // Verify the user actually exists in the DB
        const userExists = await User.findOne({ _id: userId, isActive: true });
        if (!userExists) return res.status(404).json({ success: false, message: "User not found or inactive" });

        // If the role is SE, SK, or SO, block if they are assigned to another active project
        if (["SITE_ENGINEER", "STORE_KEEPER", "SAFETY_OFFICER"].includes(role)) {
            const conflictError = await checkActiveAssignments([userId], req.project._id);
            if (conflictError) {
                return res.status(400).json({ success: false, message: conflictError });
            }
        }

        // Handle existing membership (active or soft-deleted)
        const existingMembership = await ProjectMembership.findOne({ projectId: req.project._id, userId });

        if (existingMembership) {
            if (!existingMembership.removedAt) {
                return res.status(409).json({ success: false, message: "User is already an active member of this project" });
            }

            // Re-activate soft-deleted member
            existingMembership.removedAt = null;
            existingMembership.role = role;
            existingMembership.isPrimary = isPrimary || false;
            await existingMembership.save();

            return res.status(200).json({ success: true, message: "Member re-added successfully" });
        }

        await ProjectMembership.create({
            projectId: req.project._id,
            userId,
            role,
            isPrimary: isPrimary || false
        });

        return res.status(200).json({ success: true, message: "Member added successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Hard-remove a member from a project with logs
// @route   DELETE /api/projects/:id/members/:userId
// @access  Admin / Project Manager
export const removeMember = async (req, res) => {
    try {
        const { reason } = req.body;
        const deletedByUserId = req.user._id;

        const membership = await ProjectMembership.findOne({ projectId: req.project._id, userId: req.params.userId });

        if (!membership) {
            return res.status(404).json({ success: false, message: "User is not a member of this project" });
        }

        // CLEANUP: 1. Hard-remove all active task assignments for this user in this project
        const projectTasks = await Task.find({ projectId: req.project._id }).select("_id");
        const taskIds = projectTasks.map(t => t._id);

        let assignments = [];
        if (taskIds.length > 0) {
            assignments = await TaskAssignment.find({ taskId: { $in: taskIds }, userId: req.params.userId });
        }

        const logs = [];
        logs.push({ entityType: "ProjectMembership", entityId: membership._id, deletedBy: deletedByUserId, reason: reason || "User removed from project" });
        assignments.forEach(a => logs.push({ entityType: "TaskAssignment", entityId: a._id, deletedBy: deletedByUserId, reason: reason || "User removed from project" }));

        if (logs.length > 0) {
            await DeletionLog.insertMany(logs);
        }

        if (taskIds.length > 0) {
            await TaskAssignment.deleteMany({ taskId: { $in: taskIds }, userId: req.params.userId });
        }

        await membership.deleteOne();

        // CLEANUP: 2. Unassign the user from any open issues in this project
        await Issue.updateMany(
            { projectId: req.project._id, assignedTo: req.params.userId, status: { $nin: ["Resolved", "Closed"] } },
            { assignedTo: null, status: "Open" }
        );

        return res.status(200).json({ success: true, message: "Member removed and related assignments cleaned up successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get project dashboard summary KPIs
// @route   GET /api/projects/:id/dashboard
// @access  Project Member
export const getProjectDashboard = async (req, res) => {
    try {
        const dashboardData = await ProjectService.getProjectDashboard(req.project._id);
        return res.status(200).json({ success: true, data: dashboardData });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get project tasks in Gantt chart format
// @route   GET /api/projects/:id/gantt
// @access  Project Member
export const getProjectGantt = async (req, res) => {
    try {
        const ganttData = await ProjectService.getProjectGantt(req.project._id);
        return res.status(200).json({ success: true, data: ganttData });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get project store reports (issuance logs)
// @route   GET /api/projects/:id/store-reports
// @access  Project Manager
export const getProjectStoreReports = async (req, res) => {
    try {
        const logs = await IssuanceLog.find({ projectId: req.project._id })
            .populate("materialItemId", "name code")
            .populate("mainStorageToolId", "name code")
            .populate("taskId", "name")
            .populate("requestedBy", "name")
            .populate("issuedBy", "name")
            .sort({ issuedDate: -1 });

        return res.status(200).json({ success: true, reports: logs });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
