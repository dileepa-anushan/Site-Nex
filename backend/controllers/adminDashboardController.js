import User from "../models/users.js";
import Project from "../models/projects.js";
import RiskAssessment from "../models/riskAssessment.js";

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const totalProjects = await Project.countDocuments({ isDeleted: false });
        const activeProjects = await Project.countDocuments({ isDeleted: false, status: { $ne: "Completed" } });
        const totalRiskAssessments = await RiskAssessment.countDocuments();
        const pendingPredictions = await RiskAssessment.countDocuments({ "riskResult.riskLevel": null });

        // Role breakdown
        const roleBreakdown = await User.aggregate([
            { $group: { _id: "$userRole", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                activeUsers,
                totalProjects,
                activeProjects,
                totalRiskAssessments,
                pendingPredictions,
                roleBreakdown,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all projects (unscoped, for admin)
// @route   GET /api/admin/projects
// @access  Private (Admin)
export const getAllProjectsAdmin = async (req, res) => {
    try {
        const projects = await Project.find({ isDeleted: false }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, projects });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
