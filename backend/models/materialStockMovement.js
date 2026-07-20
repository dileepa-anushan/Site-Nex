import mongoose from "mongoose";

const materialStockMovementSchema = new mongoose.Schema(
    {
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: "projects", required: true },
        materialItemId: { type: mongoose.Schema.Types.ObjectId, ref: "material_items", required: true },

        type: { type: String, enum: ["STOCK_IN", "ADJUSTMENT", "VOID_REVERT"], required: true },


        quantity: { type: Number, required: true },

        supplier: { type: String, trim: true },
        deliveryDate: { type: Date },
        unitCost: { type: Number, min: 0 },
        note: { type: String, trim: true },

        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

materialStockMovementSchema.index({ projectId: 1, materialItemId: 1, createdAt: -1 });

export default mongoose.model("material_stock_movements", materialStockMovementSchema);