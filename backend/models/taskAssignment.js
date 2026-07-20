import mongoose from "mongoose";

const taskAssignmentSchema = new mongoose.Schema(
    {
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: "tasks", required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        roleOnTask: { type: String, required: true, trim: true },

        expectedHours: { type: Number, min: 0, default: 0 },
        actualHours: { type: Number, min: 0, default: 0 },

        workStarted: { type: Boolean, default: false },

        removedAt: { type: Date, default: null },
        removedReason: { type: String, trim: true },
    },
    { timestamps: true }
);

taskAssignmentSchema.index({ taskId: 1, userId: 1 }, { unique: true, partialFilterExpression: { removedAt: null } });

export default mongoose.model("taskAssignments", taskAssignmentSchema);