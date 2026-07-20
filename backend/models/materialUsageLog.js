import mongoose from "mongoose";

const materialUsageLogSchema = new mongoose.Schema(
    {
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: "projects", required: true },
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: "tasks", required: true },
        materialItemId: { type: mongoose.Schema.Types.ObjectId, ref: "material_items", required: true },

        quantityUsed: { type: Number, min: 0, required: true },
        usageDate: { type: Date, required: true },

        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

        isVoided: { type: Boolean, default: false },
        voidReason: { type: String, trim: true },
    },
    { timestamps: true }
);

materialUsageLogSchema.index({ projectId: 1, taskId: 1, usageDate: -1 });

export default mongoose.model("material_usage_logs", materialUsageLogSchema);