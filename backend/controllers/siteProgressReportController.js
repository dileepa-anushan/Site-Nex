import SiteProgressReport from "../models/siteProgressReport.js";

// @desc    Create a new site progress report
// @route   POST /api/projects/:projectId/site-progress-reports
// @access  Site Engineer
export const createReport = async (req, res) => {
    try {
        const { reportDate, summary, workCompleted, plannedNextSteps, delaysOrRisks, weatherNotes } = req.body;
        const projectId = req.project._id;

        const report = await SiteProgressReport.create({
            projectId,
            reportedBy: req.user._id,
            reportDate,
            summary,
            workCompleted,
            plannedNextSteps,
            delaysOrRisks,
            weatherNotes
        });

        return res.status(201).json({ success: true, message: "Site progress report created", report });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all site progress reports for a project
// @route   GET /api/projects/:projectId/site-progress-reports
// @access  Project Member
export const getReportsByProject = async (req, res) => {
    try {
        const projectId = req.project._id;

        const reports = await SiteProgressReport.find({ projectId })
            .populate("reportedBy", "name email userRole")
            .sort({ reportDate: -1, createdAt: -1 });

        return res.status(200).json({ success: true, reports });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a site progress report
// @route   PUT /api/projects/:projectId/site-progress-reports/:id
// @access  Site Engineer (owner only)
export const updateReport = async (req, res) => {
    try {
        const report = await SiteProgressReport.findOne({ _id: req.params.id, projectId: req.project._id });
        if (!report) return res.status(404).json({ success: false, message: "Report not found" });

        // Only the creator can update
        if (report.reportedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Only the report creator can update it" });
        }

        const { reportDate, summary, workCompleted, plannedNextSteps, delaysOrRisks, weatherNotes } = req.body;
        if (reportDate !== undefined) report.reportDate = reportDate;
        if (summary !== undefined) report.summary = summary;
        if (workCompleted !== undefined) report.workCompleted = workCompleted;
        if (plannedNextSteps !== undefined) report.plannedNextSteps = plannedNextSteps;
        if (delaysOrRisks !== undefined) report.delaysOrRisks = delaysOrRisks;
        if (weatherNotes !== undefined) report.weatherNotes = weatherNotes;

        await report.save();
        return res.status(200).json({ success: true, message: "Report updated", report });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a site progress report
// @route   DELETE /api/projects/:projectId/site-progress-reports/:id
// @access  Site Engineer (owner only)
export const deleteReport = async (req, res) => {
    try {
        const report = await SiteProgressReport.findOneAndDelete({ _id: req.params.id, projectId: req.project._id, reportedBy: req.user._id });
        if (!report) return res.status(404).json({ success: false, message: "Report not found or not authorized" });

        return res.status(200).json({ success: true, message: "Report deleted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
