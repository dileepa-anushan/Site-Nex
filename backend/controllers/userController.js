import mongoose from "mongoose";
import User from "../models/users.js";
import { generateToken } from "../middlewares/authMiddleware.js";

const safeUser = (user) => {
    const obj = user.toObject();
    delete obj.__v;
    delete obj.password;
    return obj;
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, userRole, phone, nic } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Name, email, and password are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingEmail = await User.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return res.status(409).json({ success: false, message: "Email is already registered" });
        }

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            userRole: userRole || "SITE_ENGINEER",
            phone,
            nic,
        });

        const token = generateToken(user._id);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: safeUser(user),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Login user with email/password
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: "Your account has been deactivated" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        const token = generateToken(user._id);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: safeUser(user),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get logged-in user's profile
// @route   GET /api/users/me
// @access  Private
export const getUserData = async (req, res) => {
    try {
        return res.status(200).json({ success: true, user: safeUser(req.user) });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update own profile (name, phone, nic only)
// @route   PUT /api/users/me
// @access  Private
export const updateMyProfile = async (req, res) => {
    try {
        const { name, phone, nic } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (phone !== undefined) updates.phone = phone;
        if (nic !== undefined) updates.nic = nic;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select("-password");

        return res.status(200).json({ success: true, message: "Profile updated successfully", user: safeUser(user) });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all users (filterable by role / isActive)
// @route   GET /api/users?userRole=PROJECT_MANAGER&isActive=true
// @access  Admin
export const getAllUsers = async (req, res) => {
    try {
        const { userRole, isActive } = req.query;

        const filter = {};
        if (userRole) filter.userRole = userRole;
        if (isActive !== undefined) filter.isActive = isActive === "true";

        const users = await User.find(filter).select("-password").sort({ createdAt: -1 });

        return res.status(200).json({ success: true, users });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get a single user by Mongo _id
// @route   GET /api/users/:id
// @access  Admin
export const getUserById = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        return res.status(200).json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin updates any user's details
// @route   PUT /api/users/:id
// @access  Admin
export const updateUser = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        const { name, userRole, phone, nic } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (userRole !== undefined) updates.userRole = userRole;
        if (phone !== undefined) updates.phone = phone;
        if (nic !== undefined) updates.nic = nic;

        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        return res.status(200).json({ success: true, message: "User updated successfully", user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle a user's active / inactive status
// @route   PATCH /api/users/:id/toggle-status
// @access  Admin
export const toggleActiveStatus = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.isActive = !user.isActive;
        await user.save();

        return res.status(200).json({
            success: true,
            message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
            user: safeUser(user),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
