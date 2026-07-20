import mongoose from "mongoose";
import MaterialItem from "../models/materialItem.js";
import MainStorageTool from "../models/mainStorageTool.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── Materials CRUD (Global Main Storage) ─────────────────────────────────────

// @desc    Create a new material in main storage
// @route   POST /api/store/materials
// @access  Store Keeper / Admin
export const createStoreMaterial = async (req, res) => {
    try {
        const { name, code, quantity, category, unit, defaultUnitCost, minStockThreshold } = req.body;

        if (!name || !code) {
            return res.status(400).json({ success: false, message: "Name and code are required" });
        }

        const existingName = await MaterialItem.findOne({ name: name.trim() });
        if (existingName) {
            return res.status(409).json({ success: false, message: "A material with this name already exists" });
        }

        const existingCode = await MaterialItem.findOne({ code: code.trim() });
        if (existingCode) {
            return res.status(409).json({ success: false, message: "A material with this code already exists" });
        }

        const item = await MaterialItem.create({
            name: name.trim(),
            code: code.trim(),
            category: category || "Other",
            unit: unit || "units",
            defaultUnitCost: defaultUnitCost || 0,
            minStockThreshold: minStockThreshold || 0,
            currentStock: quantity || 0,
        });

        return res.status(201).json({ success: true, message: "Material added to main storage", item });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all materials in main storage
// @route   GET /api/store/materials
// @access  Store Keeper / Admin
export const getStoreMaterials = async (req, res) => {
    try {
        const { search } = req.query;
        const filter = { isArchived: false };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { code: { $regex: search, $options: "i" } },
            ];
        }

        const items = await MaterialItem.find(filter).sort({ name: 1 });
        return res.status(200).json({ success: true, items });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a material in main storage
// @route   PUT /api/store/materials/:id
// @access  Store Keeper / Admin
export const updateStoreMaterial = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid material ID" });
        }

        const { name, code, quantity, category, unit, defaultUnitCost, minStockThreshold } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (code !== undefined) updates.code = code.trim();
        if (quantity !== undefined) updates.currentStock = quantity;
        if (category !== undefined) updates.category = category;
        if (unit !== undefined) updates.unit = unit;
        if (defaultUnitCost !== undefined) updates.defaultUnitCost = defaultUnitCost;
        if (minStockThreshold !== undefined) updates.minStockThreshold = minStockThreshold;

        const item = await MaterialItem.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!item) return res.status(404).json({ success: false, message: "Material not found" });

        return res.status(200).json({ success: true, message: "Material updated", item });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "A material with this name or code already exists" });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete (archive) a material from main storage
// @route   DELETE /api/store/materials/:id
// @access  Store Keeper / Admin
export const deleteStoreMaterial = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid material ID" });
        }

        const item = await MaterialItem.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: "Material not found" });

        const timestamp = Date.now();
        item.isArchived = true;
        item.name = `${item.name}_deleted_${timestamp}`;
        item.code = `${item.code}_deleted_${timestamp}`;
        await item.save();

        return res.status(200).json({ success: true, message: "Material removed from main storage" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Tools CRUD (Global Main Storage) ─────────────────────────────────────────

// @desc    Create a new tool in main storage
// @route   POST /api/store/tools
// @access  Store Keeper / Admin
export const createStoreTool = async (req, res) => {
    try {
        const { name, code, quantity, condition } = req.body;

        if (!name || !code) {
            return res.status(400).json({ success: false, message: "Name and code are required" });
        }

        const existingCode = await MainStorageTool.findOne({ code: code.trim() });
        if (existingCode) {
            return res.status(409).json({ success: false, message: "A tool with this code already exists" });
        }

        const tool = await MainStorageTool.create({
            name: name.trim(),
            code: code.trim(),
            quantity: quantity || 0,
            condition: condition || "New",
        });

        return res.status(201).json({ success: true, message: "Tool added to main storage", tool });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all tools in main storage
// @route   GET /api/store/tools
// @access  Store Keeper / Admin
export const getStoreTools = async (req, res) => {
    try {
        const { search } = req.query;
        const filter = { isArchived: false };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { code: { $regex: search, $options: "i" } },
            ];
        }

        const tools = await MainStorageTool.find(filter).sort({ name: 1 });
        return res.status(200).json({ success: true, tools });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a tool in main storage
// @route   PUT /api/store/tools/:id
// @access  Store Keeper / Admin
export const updateStoreTool = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid tool ID" });
        }

        const { name, code, quantity, condition } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (code !== undefined) updates.code = code.trim();
        if (quantity !== undefined) updates.quantity = quantity;
        if (condition !== undefined) updates.condition = condition;

        const tool = await MainStorageTool.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!tool) return res.status(404).json({ success: false, message: "Tool not found" });

        return res.status(200).json({ success: true, message: "Tool updated", tool });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "A tool with this code already exists" });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete (archive) a tool from main storage
// @route   DELETE /api/store/tools/:id
// @access  Store Keeper / Admin
export const deleteStoreTool = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid tool ID" });
        }

        const tool = await MainStorageTool.findById(req.params.id);
        if (!tool) return res.status(404).json({ success: false, message: "Tool not found" });

        const timestamp = Date.now();
        tool.isArchived = true;
        tool.code = `${tool.code}_deleted_${timestamp}`;
        await tool.save();

        return res.status(200).json({ success: true, message: "Tool removed from main storage" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Combined Inventory (for SE request page) ────────────────────────────────

// @desc    Get combined inventory of materials + tools for request forms
// @route   GET /api/store/inventory
// @access  Private (any authenticated user)
export const getCombinedInventory = async (req, res) => {
    try {
        const { search } = req.query;

        const materialFilter = { isArchived: false };
        const toolFilter = { isArchived: false };

        if (search) {
            materialFilter.$or = [
                { name: { $regex: search, $options: "i" } },
                { code: { $regex: search, $options: "i" } },
            ];
            toolFilter.$or = [
                { name: { $regex: search, $options: "i" } },
                { code: { $regex: search, $options: "i" } },
            ];
        }

        const [materials, tools] = await Promise.all([
            MaterialItem.find(materialFilter).sort({ name: 1 }),
            MainStorageTool.find(toolFilter).sort({ name: 1 }),
        ]);

        return res.status(200).json({
            success: true,
            materials: materials.map(m => ({
                _id: m._id,
                name: m.name,
                code: m.code,
                type: "Material",
                quantity: m.currentStock,
                unit: m.unit,
                category: m.category,
            })),
            tools: tools.map(t => ({
                _id: t._id,
                name: t.name,
                code: t.code,
                type: "Tool",
                quantity: t.quantity,
                condition: t.condition,
            })),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
