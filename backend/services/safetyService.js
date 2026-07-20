import SafetyObservation from "../models/safetyObservation.js";
import HazardReport from "../models/hazardReport.js";
import SafetyNotice from "../models/safetyNotice.js";
import PermitToWork from "../models/permitToWork.js";
import DeletionLog from "../models/deletionLog.js";
import SafetyIncident from "../models/safetyIncident.js";

class SafetyService {
    static async deleteObservation(id, deletedByUserId, deleteReason) {
        const doc = await SafetyObservation.findById(id);
        if (!doc) throw new Error("Safety Observation not found");
        await new DeletionLog({ entityType: "SafetyObservation", entityId: doc._id, entityName: doc.title, deletedBy: deletedByUserId, reason: deleteReason }).save();
        await SafetyObservation.deleteOne({ _id: id });
        return true;
    }

    static async deleteHazard(id, deletedByUserId, deleteReason) {
        const doc = await HazardReport.findById(id);
        if (!doc) throw new Error("Hazard Report not found");
        await new DeletionLog({ entityType: "HazardReport", entityId: doc._id, entityName: doc.title, deletedBy: deletedByUserId, reason: deleteReason }).save();
        await HazardReport.deleteOne({ _id: id });
        return true;
    }

    static async deleteNotice(id, deletedByUserId, deleteReason) {
        const doc = await SafetyNotice.findById(id);
        if (!doc) throw new Error("Safety Notice not found");
        await new DeletionLog({ entityType: "SafetyNotice", entityId: doc._id, entityName: doc.reason, deletedBy: deletedByUserId, reason: deleteReason }).save();
        await SafetyNotice.deleteOne({ _id: id });
        return true;
    }

    static async deletePTW(id, deletedByUserId, deleteReason) {
        const doc = await PermitToWork.findById(id);
        if (!doc) throw new Error("PermitToWork not found");
        await new DeletionLog({ entityType: "PermitToWork", entityId: doc._id, entityName: doc.permitType, deletedBy: deletedByUserId, reason: deleteReason }).save();
        await PermitToWork.deleteOne({ _id: id });
        return true;
    }

    static async createIncident(data) {
        if (data.severity === "Critical" || data.incidentType === "Injury" || data.incidentType === "Fire Hazard") {
            data.requiresImmediateAttention = true;
            data.status = "Under Investigation";

            // Practical Auto-Escalation: Issue a strict Stop Notice immediately for the location!
            if (data.location) {
                await SafetyNotice.create({
                    projectId: data.projectId,
                    location: data.location,
                    reason: `AUTO-ESCALATION LOCATIONAL HOLD: A Critical Incident/Injury (${data.incidentType}) was reported at ${data.location}. Site must be secured.`,
                    status: "Active",
                    issuedBy: data.reportedBy
                });
            }
        }
        return await SafetyIncident.create(data);
    }

    static async updateIncident(id, data) {
        if (data.severity === "Critical" || data.incidentType === "Injury") {
            data.requiresImmediateAttention = true;
        }
        return await SafetyIncident.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    static async deleteIncident(id, deletedByUserId, deleteReason) {
        const doc = await SafetyIncident.findById(id);
        if (!doc) throw new Error("Safety Incident not found");
        await new DeletionLog({ entityType: "SafetyIncident", entityId: doc._id, entityName: doc.title || doc.incidentType, deletedBy: deletedByUserId, reason: deleteReason }).save();
        await doc.deleteOne();
        return true;
    }
    static async getSafetyHazards(projectId) {
        return await HazardReport.find({ projectId, status: { $in: ["Open", "Controlled"] } })
            .select("title description severity status createdAt dueDate")
            .sort({ createdAt: -1 })
            .limit(5);
    }

    static async getSafetySummary(projectId) {
        const [openHazards, activePTWs, activeNotices, totalObservations] = await Promise.all([
            HazardReport.countDocuments({ projectId, status: "Open" }),
            PermitToWork.countDocuments({ projectId, status: { $in: ["Pending", "Approved"] } }),
            SafetyNotice.countDocuments({ projectId, status: "Active" }),
            SafetyObservation.countDocuments({ projectId })
        ]);

        return {
            openHazards,
            activePTWs,
            activeNotices,
            totalObservations
        };
    }
}

export default SafetyService;
