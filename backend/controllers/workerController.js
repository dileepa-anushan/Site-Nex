import mongoose from "mongoose";
import Worker from "../models/worker.js";

import ProjectMembership from "../models/projectMembership.js";
import User from "../models/users.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Add a worker to a project
// @route   POST /api/projects/:projectId/workers
// @access  Private (project-scoped)
export const addWorker = async (req, res) => {
    try {
        const { userId, name, trade, phone, nic, status } = req.body;

        if (!trade) {
            return res.status(400).json({ success: false, message: "Trade is required" });
        }
        
        // If a registered user is being assigned, fetch their details and ensure membership
        let finalName = name;
        let finalPhone = phone || "";
        let finalNic = nic || "";
        
        if (userId) {
            if (!isValidId(userId)) return res.status(400).json({ success: false, message: "Invalid userId" });
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ success: false, message: "User not found" });
            
            finalName = user.name;
            finalPhone = user.phone || "";
            finalNic = user.nic || "";
            
            // Auto-enroll in ProjectMembership
            const existingMembership = await ProjectMembership.findOne({ projectId: req.project._id, userId });
            if (!existingMembership) {
                await ProjectMembership.create({
                    projectId: req.project._id,
                    userId,
                    role: "WORKER"
                });
            } else if (existingMembership.removedAt) {
                existingMembership.removedAt = null;
                await existingMembership.save();
            }
        } else if (!name) {
            return res.status(400).json({ success: false, message: "Name is required if no user is assigned." });
        }

        const worker = await Worker.create({
            projectId: req.project._id,
            userId: userId || null,
            name: finalName.trim(),
            trade,
            phone: finalPhone,
            nic: finalNic,
            status: status || "Active",
        });

        return res.status(201).json({ success: true, message: "Worker added successfully", worker });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all workers for a project
// @route   GET /api/projects/:projectId/workers
// @access  Private (project-scoped)
export const getProjectWorkers = async (req, res) => {
    try {
        const { status, trade } = req.query;
        const filter = { projectId: req.project._id };
        if (status) filter.status = status;
        if (trade) filter.trade = trade;

        const workers = await Worker.find(filter).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, workers });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get a single worker by ID
// @route   GET /api/projects/:projectId/workers/:id
// @access  Private (project-scoped)
export const getWorkerById = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid worker ID" });
        }

        const worker = await Worker.findOne({ _id: req.params.id, projectId: req.project._id });
        if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });

        return res.status(200).json({ success: true, worker });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a worker
// @route   PUT /api/projects/:projectId/workers/:id
// @access  Private (project-scoped)
export const updateWorker = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid worker ID" });
        }

        const { name, trade, phone, nic, status } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (trade !== undefined) updates.trade = trade;
        if (phone !== undefined) updates.phone = phone;
        if (nic !== undefined) updates.nic = nic;
        if (status !== undefined) updates.status = status;

        const worker = await Worker.findOneAndUpdate(
            { _id: req.params.id, projectId: req.project._id },
            updates,
            { new: true, runValidators: true }
        );
        if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });

        return res.status(200).json({ success: true, message: "Worker updated successfully", worker });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a worker
// @route   DELETE /api/projects/:projectId/workers/:id
// @access  Private (project-scoped)
export const deleteWorker = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid worker ID" });
        }

        const worker = await Worker.findOneAndDelete({ _id: req.params.id, projectId: req.project._id });
        if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });

        return res.status(200).json({ success: true, message: "Worker deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
