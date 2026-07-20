import SafetyNotice from "../models/safetyNotice.js";
import SafetyService from "../services/safetyService.js";

// @desc    Get all safety notices
// @route   GET /api/projects/:projectId/safety/notices
// @access  Private
export const getNotices = async (req, res) => {
    try {
        const notices = await SafetyNotice.find({ projectId: req.project._id })
            .populate("issuedBy", "name email")
            .populate("liftedBy", "name email")
            .populate("taskId", "name status")
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, notices });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single safety notice
// @route   GET /api/projects/:projectId/safety/notices/:noticeId
// @access  Private
export const getNoticeById = async (req, res) => {
    try {
        const notice = await SafetyNotice.findOne({ _id: req.params.noticeId, projectId: req.project._id })
            .populate("issuedBy", "name email")
            .populate("liftedBy", "name email")
            .populate("taskId", "name status");
        if (!notice) return res.status(404).json({ success: false, message: "Safety Notice not found" });
        return res.status(200).json({ success: true, notice });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a safety notice (Stop/Hold)
// @route   POST /api/projects/:projectId/safety/notices
// @access  Safety Officer
export const createNotice = async (req, res) => {
    try {
        const payload = {
            ...req.body,
            projectId: req.project._id,
            issuedBy: req.user._id,
        };
        
        if (payload.taskId) {
            const Task = (await import("../models/task.js")).default;
            const taskExists = await Task.exists({ _id: payload.taskId, projectId: req.project._id });
            if (!taskExists) return res.status(400).json({ success: false, message: "Task does not belong to this project" });
        }

        payload.status = "Active";
        const notice = await SafetyNotice.create(payload);
        return res.status(201).json({ success: true, message: "Safety Notice issued", notice });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update a safety notice (e.g. Lift it)
// @route   PUT /api/projects/:projectId/safety/notices/:noticeId
// @access  Safety Officer
export const updateNotice = async (req, res) => {
    try {
        const notice = await SafetyNotice.findOne({ _id: req.params.noticeId, projectId: req.project._id });
        if (!notice) return res.status(404).json({ success: false, message: "Safety Notice not found" });
        
        // If transitioning to Lifted
        if (req.body.status === "Lifted" && notice.status !== "Lifted") {
            req.body.liftedBy = req.user._id;
            req.body.liftedAt = new Date();
        }

        Object.assign(notice, req.body);
        await notice.save();

        return res.status(200).json({ success: true, message: "Safety Notice updated", notice });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete a safety notice
// @route   DELETE /api/projects/:projectId/safety/notices/:noticeId
// @access  Safety Officer / PM
export const deleteNotice = async (req, res) => {
    try {
        const { deleteReason } = req.body;
        await SafetyService.deleteNotice(req.params.noticeId, req.user._id, deleteReason);
        return res.status(200).json({ success: true, message: "Safety Notice deleted successfully" });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
