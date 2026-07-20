import mongoose from "mongoose";

const siteProgressReportSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "projects",
            required: true,
        },
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reportDate: { type: Date, required: true },
        summary: { type: String, required: true },
        workCompleted: { type: String, required: true },
        plannedNextSteps: { type: String },
        delaysOrRisks: { type: String },
        weatherNotes: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model("SiteProgressReport", siteProgressReportSchema);
