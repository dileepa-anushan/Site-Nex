import SafetyIncident from "../models/safetyIncident.js";
import SafetyService from "../services/safetyService.js";

export const createIncident = async (req, res) => {
    try {
        const data = { ...req.body, projectId: req.project._id, reportedBy: req.user._id };
        const incident = await SafetyService.createIncident(data);
        return res.status(201).json({ success: true, incident, message: "Safety incident created successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getIncidents = async (req, res) => {
    try {
        const incidents = await SafetyIncident.find({ projectId: req.project._id })
            .populate("reportedBy", "name")
            .sort({ incidentDate: -1 });
        return res.status(200).json({ success: true, incidents });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getIncidentById = async (req, res) => {
    try {
        const incident = await SafetyIncident.findOne({ _id: req.params.incidentId, projectId: req.project._id })
            .populate("reportedBy", "name");
        if (!incident) return res.status(404).json({ success: false, message: "Incident not found" });
        return res.status(200).json({ success: true, incident });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateIncident = async (req, res) => {
    try {
        const exists = await SafetyIncident.exists({ _id: req.params.incidentId, projectId: req.project._id });
        if (!exists) return res.status(404).json({ success: false, message: "Incident not found" });

        const incident = await SafetyService.updateIncident(req.params.incidentId, req.body);
        return res.status(200).json({ success: true, incident, message: "Incident updated successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteIncident = async (req, res) => {
    try {
        const { deleteReason } = req.body;
        const exists = await SafetyIncident.exists({ _id: req.params.incidentId, projectId: req.project._id });
        if (!exists) return res.status(404).json({ success: false, message: "Incident not found" });

        await SafetyService.deleteIncident(req.params.incidentId, req.user._id, deleteReason);
        return res.status(200).json({ success: true, message: "Incident deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getCriticalIncidents = async (req, res) => {
    try {
        const incidents = await SafetyIncident.find({
            projectId: req.project._id,
            requiresImmediateAttention: true,
            status: { $nin: ["Closed"] }
        })
        .populate("reportedBy", "name")
        .sort({ incidentDate: -1 });
        return res.status(200).json({ success: true, incidents });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
