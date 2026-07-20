import mongoose from "mongoose";

const projectMembershipSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        role: {
            type: String,
            enum: ["OWNER", "PROJECT_MANAGER", "SITE_ENGINEER", "ASSISTANT_ENGINEER", "STORE_KEEPER"],
            required: true,
        },
        isPrimary: {
            type: Boolean,
            default: false,
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
        removedAt: {
            type: Date,
            // Null means active. Set a date to soft-remove the user.
            default: null,
        },
    },
    { timestamps: true }
);

// Compound index to ensure a user is only active once per project
projectMembershipSchema.index({ projectId: 1, userId: 1 }, { unique: true, partialFilterExpression: { removedAt: null } });

export default mongoose.model("ProjectMembership", projectMembershipSchema);
