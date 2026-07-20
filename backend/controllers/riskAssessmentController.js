import mongoose from "mongoose";
import RiskAssessment from "../models/riskAssessment.js";
import Project from "../models/projects.js";
import Worker from "../models/worker.js";
import SiteProgressReport from "../models/siteProgressReport.js";
import ProjectMembership from "../models/projectMembership.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ML API URL (Flask server)
const ML_API_URL = process.env.ML_API_URL || "http://localhost:5001";

/**
 * Convert free-text weather notes to a numeric score (0-1).
 * Uses keyword matching against common weather descriptions.
 */
const weatherTextToScore = (weatherText) => {
    if (!weatherText || typeof weatherText !== "string") return 0.5; // default neutral
    const lower = weatherText.toLowerCase();

    const badKeywords = ["rain", "rainy", "storm", "stormy", "heavy rain", "thunderstorm", "flood", "wet", "cyclone", "hurricane", "downpour"];
    const goodKeywords = ["sunny", "clear", "fine", "bright", "dry", "pleasant", "calm", "fair"];
    const midKeywords = ["cloudy", "overcast", "wind", "windy", "haze", "fog", "foggy", "mist", "drizzle", "partial"];

    let score = 0.5;
    for (const kw of badKeywords) {
        if (lower.includes(kw)) { score = 0.8; break; }
    }
    for (const kw of goodKeywords) {
        if (lower.includes(kw)) { score = 0.2; break; }
    }
    for (const kw of midKeywords) {
        if (lower.includes(kw)) { score = 0.5; break; }
    }
    return score;
};

// Helper to get the auto-fill data for a project
const computeAutoFillData = async (projectId) => {
    // 1. Project timeline (days between start and end)
    const project = await Project.findById(projectId);
    if (!project) return null;

    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const timelineDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

    // 2. Labour count (workers assigned to this project)
    const labourCount = await Worker.countDocuments({ projectId, status: "Active" });

    // 3. Average weather from daily reports
    const reports = await SiteProgressReport.find({ projectId });
    let avgWeather = 0.5; // default
    if (reports.length > 0) {
        const weatherScores = reports
            .filter(r => r.weatherNotes && r.weatherNotes.trim() !== "")
            .map(r => weatherTextToScore(r.weatherNotes));
        if (weatherScores.length > 0) {
            avgWeather = parseFloat((weatherScores.reduce((sum, s) => sum + s, 0) / weatherScores.length).toFixed(2));
        }
    }

    return {
        projectName: project.name,
        projectTimeline: timelineDays,
        labourCount: labourCount || 1,
        averageWeather: avgWeather,
        budget: project.budget || project.plannedBudget || 0,
    };
};

// @desc    Get auto-fill data for a project
// @route   GET /api/risk-assessments/autofill/:projectId
// @access  Private (PM)
export const getAutoFillData = async (req, res) => {
    try {
        const { projectId } = req.params;
        if (!isValidId(projectId)) {
            return res.status(400).json({ success: false, message: "Invalid projectId" });
        }

        const data = await computeAutoFillData(projectId);
        if (!data) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        return res.status(200).json({ success: true, autoFill: data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a risk assessment
// @route   POST /api/risk-assessments
// @access  Private (PM)
export const createRiskAssessment = async (req, res) => {
    try {
        const {
            projectId, projectTimeline, labourCount, averageWeather,
            equipmentUnits, materialCostUSD, startConstraint,
            resourceConstraintScore, siteConstraintScore, dependencyCount
        } = req.body;

        if (!projectId || !isValidId(projectId)) {
            return res.status(400).json({ success: false, message: "Valid projectId is required" });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        const assessment = await RiskAssessment.create({
            projectId,
            submittedBy: req.user._id,
            projectTimeline,
            labourCount,
            averageWeather,
            equipmentUnits,
            materialCostUSD,
            startConstraint,
            resourceConstraintScore,
            siteConstraintScore,
            dependencyCount,
        });

        return res.status(201).json({ success: true, message: "Risk assessment created", assessment });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all risk assessments
// @route   GET /api/risk-assessments
// @access  Private (Admin)
export const getAllRiskAssessments = async (req, res) => {
    try {
        const assessments = await RiskAssessment.find()
            .populate("projectId", "name location status")
            .populate("submittedBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, assessments });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get risk assessments by project (for PM)
// @route   GET /api/risk-assessments/project/:projectId
// @access  Private (PM)
export const getRiskAssessmentsByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        if (!isValidId(projectId)) {
            return res.status(400).json({ success: false, message: "Invalid projectId" });
        }

        const assessments = await RiskAssessment.find({ projectId })
            .populate("projectId", "name location")
            .populate("submittedBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, assessments });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a risk assessment
// @route   DELETE /api/risk-assessments/:id
// @access  Private (Admin)
export const deleteRiskAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid assessment ID" });
        }

        const assessment = await RiskAssessment.findByIdAndDelete(id);
        if (!assessment) {
            return res.status(404).json({ success: false, message: "Risk assessment not found" });
        }

        return res.status(200).json({ success: true, message: "Risk assessment deleted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Run ML prediction for a risk assessment
// @route   POST /api/risk-assessments/:id/predict
// @access  Private (Admin)
export const runPrediction = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid assessment ID" });
        }

        const assessment = await RiskAssessment.findById(id);
        if (!assessment) {
            return res.status(404).json({ success: false, message: "Risk assessment not found" });
        }

        // Prepare the payload for the Flask ML API
        const mlPayload = {
            Task_Duration_Days: assessment.projectTimeline,
            Labor_Required: assessment.labourCount,
            Equipment_Units: assessment.equipmentUnits,
            Material_Cost_USD: assessment.materialCostUSD,
            Start_Constraint: assessment.startConstraint,
            Resource_Constraint_Score: assessment.resourceConstraintScore,
            Site_Constraint_Score: assessment.siteConstraintScore,
            Dependency_Count: assessment.dependencyCount,
        };

        // Call Flask ML API
        const response = await fetch(`${ML_API_URL}/predict-delay`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mlPayload),
        });

        const mlResult = await response.json();

        if (!mlResult.success) {
            return res.status(502).json({ success: false, message: "ML prediction failed", error: mlResult.error });
        }

        // Store the prediction result
        assessment.riskResult = {
            riskLevel: mlResult.predictions.riskLevel,
            riskProbability: mlResult.predictions.riskProbability,
            delayDays: mlResult.predictions.delayDays,
            riskColor: mlResult.predictions.risk_color,
            predictedAt: new Date(),
        };
        await assessment.save();

        return res.status(200).json({
            success: true,
            message: "Prediction completed",
            assessment,
            predictions: mlResult.predictions,
        });
    } catch (error) {
        console.error("ML Prediction error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to run prediction. Is the ML API running?", error: error.message });
    }
};
