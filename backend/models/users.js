import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, unique: true },
        name: { type: String, required: true, trim: true },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        userRole: {
            type: String,
            enum: ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "ASSISTANT_ENGINEER", "STORE_KEEPER"],
            required: true,
        },

        phone: { type: String, trim: true },
        nic: { type: String, trim: true },

        isActive: { type: Boolean, default: true },
        lastLoginAt: { type: Date },
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);