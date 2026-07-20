import mongoose from "mongoose";

const materialItemSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        category: {
            type: String,
            enum: ["Structural", "Electrical", "Plumbing", "Finishing", "Other"],
            default: "Other",
        },
        unit: { type: String, required: true }, // e.g., 'kg', 'bags', 'meters'
        defaultUnitCost: { type: Number, default: 0 },
        minStockThreshold: { type: Number, default: 0 },

        // Material caching field
        currentStock: { type: Number, default: 0 },

        isArchived: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// prevent duplicate material names globally
materialItemSchema.index({ name: 1 }, { unique: true });

export default mongoose.model("material_items", materialItemSchema);