import mongoose from "mongoose";
import IssuanceLog from "../models/issuanceLog.js";
import MaterialItem from "../models/materialItem.js";
import MainStorageTool from "../models/mainStorageTool.js";
import MaterialRequest from "../models/materialRequest.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── Get All Pending Requests (for SK to view) ───────────────────────────────

// @desc    Get all pending material/tool requests across all projects
// @route   GET /api/store/requests
// @access  Store Keeper
export const getPendingRequests = async (req, res) => {
    try {
        const requests = await MaterialRequest.find({ status: "Pending" })
            .populate("projectId", "name")
            .populate("taskId", "name status")
            .populate("requestedBy", "name email")
            .populate("materialItemId", "name code unit currentStock")
            .populate("toolId", "name serialNumber")
            .populate("approvedBy", "name")
            .populate("comments.createdBy", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, requests });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all requests (all statuses) for reporting
// @route   GET /api/store/all-requests
// @access  Store Keeper
export const getAllRequests = async (req, res) => {
    try {
        const requests = await MaterialRequest.find({})
            .populate("projectId", "name")
            .populate("taskId", "name status")
            .populate("requestedBy", "name email")
            .populate("materialItemId", "name code unit currentStock")
            .populate("toolId", "name serialNumber")
            .populate("approvedBy", "name")
            .populate("comments.createdBy", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, requests });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Issue Item (Approve request + deduct from main storage) ──────────────────

// @desc    Issue material/tool — deducts from main storage, creates issuance log
// @route   POST /api/store/issue
// @access  Store Keeper
export const issueItem = async (req, res) => {
    try {
        const {
            type, materialItemId, mainStorageToolId, projectId, taskId,
            materialRequestId, requestedBy, issuedQuantity, conditionAtIssue
        } = req.body;

        // Validate stock availability and deduct
        if (type === "Material") {
            if (!materialItemId) {
                return res.status(400).json({ success: false, message: "materialItemId is required for material issuance" });
            }
            const material = await MaterialItem.findById(materialItemId);
            if (!material) return res.status(404).json({ success: false, message: "Material not found in main storage" });

            if (material.currentStock < issuedQuantity) {
                return res.status(422).json({
                    success: false,
                    message: `Insufficient stock. Available: ${material.currentStock}, Requested: ${issuedQuantity}`
                });
            }

            // Deduct from main storage
            material.currentStock -= issuedQuantity;
            await material.save();
        } else if (type === "Tool") {
            if (!mainStorageToolId) {
                return res.status(400).json({ success: false, message: "mainStorageToolId is required for tool issuance" });
            }
            const tool = await MainStorageTool.findById(mainStorageToolId);
            if (!tool) return res.status(404).json({ success: false, message: "Tool not found in main storage" });

            if (tool.quantity < issuedQuantity) {
                return res.status(422).json({
                    success: false,
                    message: `Insufficient stock. Available: ${tool.quantity}, Requested: ${issuedQuantity}`
                });
            }

            // Deduct from main storage
            tool.quantity -= issuedQuantity;
            await tool.save();
        } else {
            return res.status(400).json({ success: false, message: "Invalid type. Must be 'Material' or 'Tool'" });
        }

        // Create issuance log
        const log = await IssuanceLog.create({
            type,
            materialItemId: type === "Material" ? materialItemId : undefined,
            mainStorageToolId: type === "Tool" ? mainStorageToolId : undefined,
            projectId,
            taskId,
            materialRequestId,
            requestedBy,
            issuedBy: req.user._id,
            issuedQuantity,
            issuedDate: new Date(),
            status: "Issued",
            conditionAtIssue: type === "Tool" ? (conditionAtIssue || "Good") : undefined,
        });

        // If linked to a material request, update the request status
        if (materialRequestId) {
            await MaterialRequest.findByIdAndUpdate(materialRequestId, {
                status: "Approved",
                approvedBy: req.user._id,
            });
        }

        return res.status(201).json({ success: true, message: "Item issued successfully", log });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Deny Request ─────────────────────────────────────────────────────────────

// @desc    Deny a material/tool request
// @route   PATCH /api/store/deny-request/:requestId
// @access  Store Keeper
export const denyRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { notes } = req.body;

        const request = await MaterialRequest.findById(requestId);
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });

        if (request.status !== "Pending") {
            return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
        }

        request.status = "Denied";
        request.approvedBy = req.user._id;
        if (notes) request.notes = (request.notes ? request.notes + "\n" : "") + "Store Keeper Note: " + notes;
        await request.save();

        return res.status(200).json({ success: true, message: "Request denied", request });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Issuance Logs ────────────────────────────────────────────────────────────

// @desc    Get all issuance logs
// @route   GET /api/store/issuance-logs
// @access  Store Keeper
export const getIssuanceLogs = async (req, res) => {
    try {
        const logs = await IssuanceLog.find({})
            .populate("materialItemId", "name code unit")
            .populate("mainStorageToolId", "name code condition")
            .populate("projectId", "name")
            .populate("taskId", "name")
            .populate("requestedBy", "name email")
            .populate("issuedBy", "name")
            .sort({ issuedDate: -1 });

        return res.status(200).json({ success: true, logs });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update an issuance log
// @route   PUT /api/store/issuance-logs/:id
// @access  Store Keeper
export const updateIssuanceLog = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid issuance log ID" });
        }

        const log = await IssuanceLog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!log) return res.status(404).json({ success: false, message: "Issuance log not found" });

        return res.status(200).json({ success: true, message: "Issuance log updated", log });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete an issuance log
// @route   DELETE /api/store/issuance-logs/:id
// @access  Store Keeper
export const deleteIssuanceLog = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid issuance log ID" });
        }

        const log = await IssuanceLog.findByIdAndDelete(req.params.id);
        if (!log) return res.status(404).json({ success: false, message: "Issuance log not found" });

        return res.status(200).json({ success: true, message: "Issuance log deleted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Handed-Over Tools (Active tool issuances) ───────────────────────────────

// @desc    Get all tools currently issued (not yet returned)
// @route   GET /api/store/handed-over-tools
// @access  Store Keeper
export const getHandedOverTools = async (req, res) => {
    try {
        const logs = await IssuanceLog.find({ type: "Tool", status: "Issued" })
            .populate("mainStorageToolId", "name code condition")
            .populate("projectId", "name")
            .populate("taskId", "name")
            .populate("requestedBy", "name email")
            .populate("issuedBy", "name")
            .sort({ issuedDate: -1 });

        return res.status(200).json({ success: true, logs });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Return a tool — updates condition, restores stock
// @route   PATCH /api/store/return-tool/:id
// @access  Store Keeper
export const returnToolIssuance = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid issuance log ID" });
        }

        const { returnDate, conditionAtReturn, damageNotes } = req.body;

        const log = await IssuanceLog.findById(req.params.id);
        if (!log) return res.status(404).json({ success: false, message: "Issuance log not found" });
        if (log.type !== "Tool") return res.status(400).json({ success: false, message: "This issuance is not a tool" });
        if (log.status === "Returned") return res.status(400).json({ success: false, message: "Tool is already returned" });

        // Update the issuance log
        log.status = "Returned";
        log.returnDate = returnDate ? new Date(returnDate) : new Date();
        log.conditionAtReturn = conditionAtReturn;
        log.damageNotes = damageNotes || "";
        await log.save();

        // Restore stock to main storage
        const tool = await MainStorageTool.findById(log.mainStorageToolId);
        if (tool) {
            tool.quantity += log.issuedQuantity;
            // Update tool condition based on return condition
            if (conditionAtReturn) {
                tool.condition = conditionAtReturn;
            }
            await tool.save();
        }

        return res.status(200).json({ success: true, message: "Tool returned successfully", log });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Reports ──────────────────────────────────────────────────────────────────

// @desc    Get material issuance report data
// @route   GET /api/store/reports/materials
// @access  Store Keeper
export const getMaterialIssuanceReport = async (req, res) => {
    try {
        const { startDate, endDate, projectId } = req.query;
        const filter = { type: "Material" };

        if (startDate || endDate) {
            filter.issuedDate = {};
            if (startDate) filter.issuedDate.$gte = new Date(startDate);
            if (endDate) filter.issuedDate.$lte = new Date(endDate);
        }
        if (projectId && isValidId(projectId)) {
            filter.projectId = projectId;
        }

        const logs = await IssuanceLog.find(filter)
            .populate("materialItemId", "name code unit category")
            .populate("projectId", "name")
            .populate("taskId", "name")
            .populate("requestedBy", "name email")
            .populate("issuedBy", "name")
            .sort({ issuedDate: -1 });

        return res.status(200).json({ success: true, reports: logs });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get tool return report data
// @route   GET /api/store/reports/tools
// @access  Store Keeper
export const getToolReturnReport = async (req, res) => {
    try {
        const { startDate, endDate, projectId } = req.query;
        const filter = { type: "Tool" };

        if (startDate || endDate) {
            filter.issuedDate = {};
            if (startDate) filter.issuedDate.$gte = new Date(startDate);
            if (endDate) filter.issuedDate.$lte = new Date(endDate);
        }
        if (projectId && isValidId(projectId)) {
            filter.projectId = projectId;
        }

        const logs = await IssuanceLog.find(filter)
            .populate("mainStorageToolId", "name code condition")
            .populate("projectId", "name")
            .populate("taskId", "name")
            .populate("requestedBy", "name email")
            .populate("issuedBy", "name")
            .sort({ issuedDate: -1 });

        return res.status(200).json({ success: true, reports: logs });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
