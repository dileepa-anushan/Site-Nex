import HazardReport from "../models/hazardReport.js";
import SafetyService from "../services/safetyService.js";

// @desc    Get all hazard reports
// @route   GET /api/projects/:projectId/safety/hazards
// @access  Private
export const getHazards = async (req, res) => {
    try {
        const hazards = await HazardReport.find({ projectId: req.project._id })
            .populate("reportedBy", "name email")
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, hazards });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single hazard report
// @route   GET /api/projects/:projectId/safety/hazards/:hazardId
// @access  Private
export const getHazardById = async (req, res) => {
    try {
        const hazard = await HazardReport.findOne({ _id: req.params.hazardId, projectId: req.project._id })
            .populate("reportedBy", "name email");
        if (!hazard) return res.status(404).json({ success: false, message: "Hazard Report not found" });
        return res.status(200).json({ success: true, hazard });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a hazard report
// @route   POST /api/projects/:projectId/safety/hazards
// @access  Project Team
export const createHazard = async (req, res) => {
    try {
        const payload = {
            ...req.body,
            projectId: req.project._id,
            reportedBy: req.user._id
        };
        const hazard = await HazardReport.create(payload);
        return res.status(201).json({ success: true, message: "Hazard Report created", hazard });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update a hazard report
// @route   PUT /api/projects/:projectId/safety/hazards/:hazardId
// @access  Project Team
export const updateHazard = async (req, res) => {
    try {
        const hazard = await HazardReport.findOneAndUpdate(
            { _id: req.params.hazardId, projectId: req.project._id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!hazard) return res.status(404).json({ success: false, message: "Hazard Report not found" });
        return res.status(200).json({ success: true, message: "Hazard Report updated", hazard });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete a hazard report
// @route   DELETE /api/projects/:projectId/safety/hazards/:hazardId
// @access  Safety Officer / PM
export const deleteHazard = async (req, res) => {
    try {
        const { deleteReason } = req.body;
        await SafetyService.deleteHazard(req.params.hazardId, req.user._id, deleteReason);
        return res.status(200).json({ success: true, message: "Hazard Report deleted successfully" });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
