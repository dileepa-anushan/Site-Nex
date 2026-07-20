import SafetyService from "../services/safetyService.js";

export const getSafetyHazards = async (req, res) => {
    try {
        const hazards = await SafetyService.getSafetyHazards(req.project._id);
        return res.status(200).json({ success: true, hazards });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getSafetySummary = async (req, res) => {
    try {
        const summary = await SafetyService.getSafetySummary(req.project._id);
        return res.status(200).json({ success: true, summary });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
