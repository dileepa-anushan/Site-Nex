import PermitToWork from "../models/permitToWork.js";
import SafetyService from "../services/safetyService.js";

// @desc    Get all PTWs for a project
// @route   GET /api/projects/:projectId/safety/ptws
// @access  Private
export const getPTWs = async (req, res) => {
    try {
        const ptws = await PermitToWork.find({ projectId: req.project._id })
            .populate("requestedBy", "name email")
            .populate("approvedBy", "name email")
            .populate("taskId", "name status")
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, ptws });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single PTW
// @route   GET /api/projects/:projectId/safety/ptws/:ptwId
// @access  Private
export const getPTWById = async (req, res) => {
    try {
        const ptw = await PermitToWork.findOne({ _id: req.params.ptwId, projectId: req.project._id })
            .populate("requestedBy", "name email")
            .populate("approvedBy", "name email")
            .populate("taskId", "name status");
        if (!ptw) return res.status(404).json({ success: false, message: "PTW not found" });
        return res.status(200).json({ success: true, ptw });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Request a new PTW
// @route   POST /api/projects/:projectId/safety/ptws
// @access  PM / SE
export const createPTW = async (req, res) => {
    try {
        const data = { ...req.body, projectId: req.project._id, requestedBy: req.user._id };
        
        if (data.taskId) {
            const Subtask = (await import("../models/subtask.js")).default;
            const subtaskExists = await Subtask.exists({ _id: data.taskId, projectId: req.project._id });
            if (!subtaskExists) return res.status(400).json({ success: false, message: "Subtask does not belong to this project" });
        }
        const payload = {
            ...data,
            status: "Pending" // By default
        };
        const ptw = await PermitToWork.create(payload);
        return res.status(201).json({ success: true, message: "Permit to Work requested", ptw });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update a PTW (Approve/Deny/Revoke/Details)
// @route   PUT /api/projects/:projectId/safety/ptws/:ptwId
// @access  Safety Officer (for approvals) / PM (for details before approval)
export const updatePTW = async (req, res) => {
    try {
        const ptw = await PermitToWork.findOne({ _id: req.params.ptwId, projectId: req.project._id });
        if (!ptw) return res.status(404).json({ success: false, message: "PTW not found" });

        // If transitioning to Approved or Denied
        if (req.body.status && req.body.status !== ptw.status) {
            if (req.body.status === "Denied" && (!req.body.notes || req.body.notes.trim() === "")) {
                return res.status(400).json({ success: false, message: "A reason note is required when denying a PTW" });
            }

            if (["Approved", "Denied", "Revoked"].includes(req.body.status)) {
                req.body.approvedBy = req.user._id;
                req.body.approvedAt = new Date();
            }
        }

        Object.assign(ptw, req.body);
        await ptw.save();

        return res.status(200).json({ success: true, message: "Permit to Work updated", ptw });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete a PTW
// @route   DELETE /api/projects/:projectId/safety/ptws/:ptwId
// @access  PM / Safety Officer
export const deletePTW = async (req, res) => {
    try {
        const { deleteReason } = req.body;
        await SafetyService.deletePTW(req.params.ptwId, req.user._id, deleteReason);
        return res.status(200).json({ success: true, message: "PTW deleted successfully" });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
