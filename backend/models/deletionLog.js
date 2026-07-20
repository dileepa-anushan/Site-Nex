import mongoose from "mongoose";

const deletionLogSchema = new mongoose.Schema(
    {
        entityType: { type: String, required: true }, // "Project", "Task", "TaskAssignment", "ProjectMembership"
        entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
        entityName: { type: String }, // Optional name for easier reading
        deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: { type: String, required: true },
        deletedAt: { type: Date, default: Date.now }
    }
);

// Optional: Index by entity type or date for faster querying
deletionLogSchema.index({ entityType: 1, deletedAt: -1 });

export default mongoose.model("DeletionLog", deletionLogSchema);
