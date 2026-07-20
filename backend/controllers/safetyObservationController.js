import SafetyObservation from "../models/safetyObservation.js";
import SafetyService from "../services/safetyService.js";

// @desc    Get all safety observations for a project
// @route   GET /api/projects/:projectId/safety/observations
// @access  Private
export const getObservations = async (req, res) => {
    try {
        const observations = await SafetyObservation.find({ projectId: req.project._id })
            .populate("reportedBy", "name email")
            .populate("taskId", "name")
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, observations });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single observation
// @route   GET /api/projects/:projectId/safety/observations/:observationId
// @access  Private
export const getObservationById = async (req, res) => {
    try {
        const observation = await SafetyObservation.findOne({ _id: req.params.observationId, projectId: req.project._id })
            .populate("reportedBy", "name email")
            .populate("taskId", "name");
        if (!observation) return res.status(404).json({ success: false, message: "Observation not found" });
        return res.status(200).json({ success: true, observation });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a safety observation
// @route   POST /api/projects/:projectId/safety/observations
// @access  Project Team
export const createObservation = async (req, res) => {
    try {
        const observationData = {
            ...req.body,
            projectId: req.project._id,
            reportedBy: req.user._id
        };
        const observation = await SafetyObservation.create(observationData);
        return res.status(201).json({ success: true, message: "Safety Observation created", observation });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update a safety observation
// @route   PUT /api/projects/:projectId/safety/observations/:observationId
// @access  Project Team
export const updateObservation = async (req, res) => {
    try {
        const observation = await SafetyObservation.findOneAndUpdate(
            { _id: req.params.observationId, projectId: req.project._id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!observation) return res.status(404).json({ success: false, message: "Observation not found" });
        return res.status(200).json({ success: true, message: "Safety Observation updated", observation });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete a safety observation
// @route   DELETE /api/projects/:projectId/safety/observations/:observationId
// @access  Safety Officer / PM (via delete logic mapping)
export const deleteObservation = async (req, res) => {
    try {
        const { deleteReason } = req.body;
        await SafetyService.deleteObservation(req.params.observationId, req.user._id, deleteReason);
        return res.status(200).json({ success: true, message: "Safety Observation deleted successfully" });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
