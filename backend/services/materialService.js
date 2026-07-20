import mongoose from "mongoose";
import MaterialItem from "../models/materialItem.js";
import MaterialStockMovement from "../models/materialStockMovement.js";
import MaterialUsageLog from "../models/materialUsageLog.js";

/**
 * Service to handle transactional Material inventory operations.
 */
class MaterialService {
    /**
     * Adds a stock movement and updates the current stock cache transactionally.
     */
    static async addStockMovement(payload, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { projectId, materialItemId, type, quantity, supplier, deliveryDate, unitCost, note } = payload;

            const material = await MaterialItem.findOne({ _id: materialItemId, isArchived: false }).session(session);
            if (!material) throw new Error("Material item not found or is archived");

            const [movement] = await MaterialStockMovement.create(
                [{
                    projectId,
                    materialItemId,
                    type,
                    quantity,
                    supplier,
                    deliveryDate,
                    unitCost,
                    note,
                    createdBy: userId,
                }],
                { session }
            );

            await MaterialItem.findByIdAndUpdate(
                materialItemId,
                { $inc: { currentStock: quantity } },
                { session }
            );

            await session.commitTransaction();
            session.endSession();
            return movement;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    /**
     * Logs usage against a task, decrementing stock transactionally, refusing if negative.
     */
    static async logUsage(payload, userId, task) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { projectId, taskId, materialItemId, quantityUsed, usageDate } = payload;

            const material = await MaterialItem.findOne({ _id: materialItemId, isArchived: false }).session(session);
            if (!material) throw new Error("Material item not found or is archived");

            if (quantityUsed > material.currentStock) {
                throw new Error(`Insufficient stock. Available: ${material.currentStock} ${material.unit}, Requested: ${quantityUsed} ${material.unit}`);
            }

            const [log] = await MaterialUsageLog.create(
                [{ projectId, taskId, materialItemId, quantityUsed, usageDate, createdBy: userId }],
                { session }
            );

            await MaterialItem.findByIdAndUpdate(
                materialItemId,
                { $inc: { currentStock: -quantityUsed } },
                { session }
            );

            await session.commitTransaction();
            session.endSession();
            return { log, remainingStock: material.currentStock - quantityUsed };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    /**
     * Voids a usage log and implicitly adds the stock back as a VOID_REVERT movement.
     */
    static async voidUsage(usageLogId, voidReason, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const log = await MaterialUsageLog.findOneAndUpdate(
                { _id: usageLogId, isVoided: false },
                { isVoided: true, voidReason },
                { new: true, session }
            );

            if (!log) throw new Error("Usage log not found or already voided");

            await MaterialStockMovement.create(
                [{
                    projectId: log.projectId,
                    materialItemId: log.materialItemId,
                    type: "VOID_REVERT",
                    quantity: log.quantityUsed,
                    note: `Void revert for usage log ${log._id}. Reason: ${voidReason || "N/A"}`,
                    createdBy: userId,
                }],
                { session }
            );

            await MaterialItem.findByIdAndUpdate(
                log.materialItemId,
                { $inc: { currentStock: log.quantityUsed } },
                { session }
            );

            await session.commitTransaction();
            session.endSession();
            return log;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    /**
     * Voids all active usage logs for a specific project.
     * Used when a project is deleted to restore the inventory correctly.
     */
    static async voidLogsForProject(projectId, userId, voidReason) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const logs = await MaterialUsageLog.find({ projectId, isVoided: false }).session(session);

            for (const log of logs) {
                log.isVoided = true;
                log.voidReason = voidReason;
                await log.save({ session });

                await MaterialStockMovement.create(
                    [{
                        projectId: log.projectId,
                        materialItemId: log.materialItemId,
                        type: "VOID_REVERT",
                        quantity: log.quantityUsed,
                        note: `Void revert due to project deletion. Log ${log._id}. Reason: ${voidReason || "N/A"}`,
                        createdBy: userId,
                    }],
                    { session }
                );

                await MaterialItem.findByIdAndUpdate(
                    log.materialItemId,
                    { $inc: { currentStock: log.quantityUsed } },
                    { session }
                );
            }

            await session.commitTransaction();
            session.endSession();
            return logs.length;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    /**
     * Get project-level material usage summary
     */
    static async getMaterialUsageSummary(projectId) {
        return await MaterialUsageLog.aggregate([
            { $match: { projectId: new mongoose.Types.ObjectId(projectId), isVoided: false } },
            {
                $group: {
                    _id: "$materialItemId",
                    totalQuantityUsed: { $sum: "$quantityUsed" },
                    usageCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "material_items", // fixed collection name
                    localField: "_id",
                    foreignField: "_id",
                    as: "materialInfo"
                }
            },
            { $unwind: "$materialInfo" },
            {
                $project: {
                    materialId: "$_id",
                    materialName: "$materialInfo.name",
                    totalQuantityUsed: 1,
                    unit: "$materialInfo.unit",
                    usageCount: 1,
                    _id: 0
                }
            },
            { $sort: { materialName: 1 } }
        ]);
    }
}

export default MaterialService;
