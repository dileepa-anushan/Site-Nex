import Tool from "../models/tool.js";
import DeletionLog from "../models/deletionLog.js";

class StoreService {
    static async deleteTool(id, deletedByUserId, deleteReason) {
        const doc = await Tool.findById(id);
        if (!doc) throw new Error("Tool not found");
        await new DeletionLog({ 
            entityType: "Tool", 
            entityId: doc._id, 
            entityName: doc.name, 
            deletedBy: deletedByUserId, 
            reason: deleteReason 
        }).save();
        await doc.deleteOne();
        return true;
    }

    static async deleteToolCheckout(id, deletedByUserId, deleteReason) {
        // Will implement later
        return true;
    }
}

export default StoreService;
