import MaterialRequest from "../models/materialRequest.js";
// @desc    Get all material requests for a project
// @route   GET /api/projects/:projectId/material-requests
// @access  Private
export const getMaterialRequests = async (req, res) => {
    try {
        const requests = await MaterialRequest.find({ projectId: req.project._id })
            .populate("taskId", "name status")
            .populate("requestedBy", "name")
            .populate("materialItemId", "name unit")
            .populate("toolId", "name serialNumber")
            .populate("approvedBy", "name")
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, requests });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single material request
// @route   GET /api/projects/:projectId/material-requests/:requestId
// @access  Private
// ...
export const getMaterialRequestById = async (req, res) => {
    try {
        const request = await MaterialRequest.findOne({ _id: req.params.requestId, projectId: req.project._id })
            .populate("taskId", "name")
            .populate("materialItemId", "name unit")
            .populate("toolId", "name serialNumber")
            .populate("requestedBy", "name")
            .populate("approvedBy", "name");
        
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });
        return res.status(200).json({ success: true, request });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Submit new Material/Tool Requests (Batch)
// @route   POST /api/projects/:projectId/material-requests
// @access  Site Engineer
export const createMaterialRequest = async (req, res) => {
    try {
        const { taskId, items, notes } = req.body; // items: [{ requestType, itemId, quantityRequested }]

        if (!taskId) {
            return res.status(400).json({ success: false, message: "A Target Task ID is strictly required." });
        }

        if (!items || !items.length) {
            return res.status(400).json({ success: false, message: "Please provide valid items to request." });
        }

        const requestDocs = items.map(item => {
            const doc = {
                projectId: req.project._id,
                taskId,
                requestedBy: req.user._id,
                requestType: item.requestType || "Material",
                requestedQuantity: item.quantityRequested,
                notes
            };
            if (doc.requestType === "Tool") {
                doc.toolId = item.itemId;
            } else {
                doc.materialItemId = item.itemId;
            }
            return doc;
        });

        const requests = await MaterialRequest.insertMany(requestDocs);

        return res.status(201).json({ success: true, message: "Requests submitted successfully", requests });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    SE specifically approves a Worker's Request, forwarding it to StoreKeeper
// @route   PATCH /api/projects/:projectId/material-requests/:requestId/se-approve
// @access  Site Engineer
export const approveWorkerMaterialRequest = async (req, res) => {
    try {
        const { _id: projectId } = req.project;
        const { requestId } = req.params;

        const request = await MaterialRequest.findOne({ _id: requestId, projectId });
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });

        if (request.status !== "Pending SE Approval") {
            return res.status(400).json({ success: false, message: `Cannot approve request with status: ${request.status}` });
        }

        // Elevate it to Pending so the Store Keeper can process it
        request.status = "Pending";
        
        // Optionally add a trace comment
        request.comments.push({
            text: "Request authorized by Site Engineer. Forwarded to Store Keeper.",
            createdBy: req.user._id
        });

        await request.save();

        return res.status(200).json({ success: true, message: "Request approved and forwarded to Store Keeper.", request });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    SE denies a Worker's Material Request
// @route   PATCH /api/projects/:projectId/material-requests/:requestId/se-deny
// @access  Site Engineer
export const denyWorkerMaterialRequest = async (req, res) => {
    try {
        const { _id: projectId } = req.project;
        const { requestId } = req.params;
        const { reason } = req.body;

        const request = await MaterialRequest.findOne({ _id: requestId, projectId });
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });

        if (request.status !== "Pending SE Approval") {
            return res.status(400).json({ success: false, message: `Cannot deny request with status: ${request.status}` });
        }

        request.status = "Denied";
        request.approvedBy = req.user._id;

        request.comments.push({
            text: `Request denied by Site Engineer. ${reason ? "Reason: " + reason : "No reason provided."}`,
            createdBy: req.user._id
        });

        await request.save();

        return res.status(200).json({ success: true, message: "Request has been denied.", request });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add a comment to a Material Request
// @route   POST /api/projects/:projectId/material-requests/:requestId/comments
// @access  Site Engineer / Store Keeper
export const addCommentToRequest = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: "Comment text is required." });
        }

        const request = await MaterialRequest.findOne({ _id: req.params.requestId, projectId: req.project._id });
        if (!request) return res.status(404).json({ success: false, message: "Material Request not found" });

        request.comments.push({
            text: text.trim(),
            createdBy: req.user._id
        });

        await request.save();

        // Re-fetch with populated comments
        const updated = await MaterialRequest.findById(request._id)
            .populate("comments.createdBy", "name email");

        return res.status(201).json({ success: true, message: "Comment added.", request: updated });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
