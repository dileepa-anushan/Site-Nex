import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "projects",
            required: true,
        },

        name: { type: String, required: true },
        description: { type: String, required: true },

        status: {
            type: String,
            enum: ["Not Started", "In Progress", "Under Review", "Completed", "Cancelled", "On Hold"],
            default: "Not Started",
        },

        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            default: "Low",
        },

        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },

        percentComplete: { type: Number, min: 0, max: 100, default: 0 },

        dependencyTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "tasks" }],
        isCancled: { type: Boolean, default: false },
        cancellationReason: { type: String },

        // Additions for Task Management
        estimatedHours: { type: Number, min: 0 },
        actualHours: { type: Number, min: 0, default: 0 },
        progressNotes: [
            {
                note: { type: String, required: true },
                createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
                createdAt: { type: Date, default: Date.now },
            }
        ],

        // Task Completion Approval Workflow
        completionRequested: { type: Boolean, default: false },
        completionRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        completionRequestedAt: { type: Date, default: null },
        completionApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        completionApprovedAt: { type: Date, default: null },

    },
    { timestamps: true }
);

export default mongoose.model("tasks", taskSchema);