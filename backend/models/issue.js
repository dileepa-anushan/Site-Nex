import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },

        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "projects",
            required: true,
        },

        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "tasks",
            default: null,
        },

        description: { type: String, required: true, trim: true },

        type: {
            type: String,
            enum: ["Defect", "Safety", "Material Shortage", "Design Request", "Other"],
            required: true,
        },

        status: {
            type: String,
            enum: ["Open", "Assigned", "In Progress", "Resolved", "Closed"],
            default: "Open",
        },

        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            default: "Low",
        },

        dueDate: { type: Date },

        // Site Engineer Additions
        reportedLocation: { type: String, trim: true },
        severity: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        resolutionNote: { type: String, trim: true },
        resolvedAt: { type: Date },
        closedAt: { type: Date },
    },
    { timestamps: true }
);

//  index for filtering
issueSchema.index({ projectId: 1, status: 1, priority: 1 });

export default mongoose.model("issues", issueSchema);