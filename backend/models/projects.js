import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        location: { type: String, required: true },

        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },

        description: { type: String },
        budget: { type: Number, min: 0 },

        // Additions for Project Management
        clientName: { type: String },
        projectCode: { type: String, unique: true, sparse: true },
        plannedBudget: { type: Number, min: 0 },
        actualBudgetUsed: { type: Number, min: 0, default: 0 },

        status: {
            type: String,
            enum: ["Planning", "Active", "On Hold", "Completed"],
            default: "Planning",
        },

        progress: { type: Number, min: 0, max: 100, default: 0 },

        isDeleted: { type: Boolean, default: false },
        deletionReason: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model("projects", projectSchema);