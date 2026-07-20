import Tool from "../models/tool.js";
import StoreService from "../services/storeService.js";

// @desc    Get all tools for a project
// @route   GET /api/projects/:projectId/tools
// @access  Private
export const getTools = async (req, res) => {
    try {
        const tools = await Tool.find({ projectId: req.project._id }).sort({ name: 1 });
        return res.status(200).json({ success: true, tools });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single tool
// @route   GET /api/projects/:projectId/tools/:toolId
// @access  Private
// ...

export const getToolById = async (req, res) => {
    try {
        const tool = await Tool.findOne({ _id: req.params.toolId, projectId: req.project._id });
        if (!tool) return res.status(404).json({ success: false, message: "Tool not found" });
        return res.status(200).json({ success: true, tool });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a tool
// @route   POST /api/projects/:projectId/tools
// @access  Store Keeper / PM
export const createTool = async (req, res) => {
    try {
        const data = { ...req.body, projectId: req.project._id };
        
        // Auto-initialize available to match total
        if (data.totalQuantity && !data.availableQuantity) {
            data.availableQuantity = data.totalQuantity;
        }

        const tool = await Tool.create(data);
        return res.status(201).json({ success: true, message: "Tool registered successfully", tool });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update a tool
// @route   PUT /api/projects/:projectId/tools/:toolId
// @access  Store Keeper / PM
export const updateTool = async (req, res) => {
    try {
        const tool = await Tool.findOneAndUpdate(
            { _id: req.params.toolId, projectId: req.project._id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!tool) return res.status(404).json({ success: false, message: "Tool not found" });
        return res.status(200).json({ success: true, message: "Tool updated", tool });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Toggle Blacklist Status (SPECIAL FUNCTION)
// @route   PATCH /api/projects/:projectId/tools/:toolId/blacklist
// @access  Safety Officer ONLY
export const toggleBlacklist = async (req, res) => {
    try {
        const { isBlacklisted } = req.body;
        const tool = await Tool.findOneAndUpdate(
            { _id: req.params.toolId, projectId: req.project._id },
            { isBlacklisted },
            { new: true }
        );
        if (!tool) return res.status(404).json({ success: false, message: "Tool not found" });
        
        const state = isBlacklisted ? "Blacklisted! It can no longer be checked out." : "Cleared for use.";
        return res.status(200).json({ success: true, message: `Tool is now ${state}`, tool });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete a tool
// @route   DELETE /api/projects/:projectId/tools/:toolId
// @access  PM / Store Keeper
export const deleteTool = async (req, res) => {
    try {
        const { deleteReason } = req.body;
        if (!deleteReason) return res.status(400).json({ success: false, message: "Delete reason is required" });
        
        await StoreService.deleteTool(req.params.toolId, req.user._id, deleteReason);
        return res.status(200).json({ success: true, message: "Tool deleted successfully" });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
