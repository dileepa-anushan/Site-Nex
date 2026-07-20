import express from "express";
import protect, { requireClerkToken } from "../middlewares/authMiddleware.js";
import { authorizeGlobalRole } from "../middlewares/rbacMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
    registerUserSchema,
    updateProfileSchema,
    syncUserSchema,
    idParamSchema
} from "../validations/schemas.js";
import {
    registerUser,
    getUserData,
    updateMyProfile,
    getAllUsers,
    getUserById,
    updateUser,
    toggleActiveStatus,
    syncUser,
} from "../controllers/userController.js";

const router = express.Router();

// Auto-provision or sync Clerk user on login
router.post("/sync", requireClerkToken, validateRequest({ body: syncUserSchema }), syncUser);

// Admin — register / onboard a new staff member
router.post("/register", protect, authorizeGlobalRole("ADMIN"), validateRequest({ body: registerUserSchema }), registerUser);

// Private — logged-in user's own profile
router.get("/me", protect, getUserData);
router.put("/me", protect, validateRequest({ body: updateProfileSchema }), updateMyProfile);

// Admin — manage all users
router.get("/", protect, authorizeGlobalRole("ADMIN"), getAllUsers);
router.get("/:id", protect, authorizeGlobalRole("ADMIN"), validateRequest({ params: idParamSchema }), getUserById);
router.put("/:id", protect, authorizeGlobalRole("ADMIN"), validateRequest({ params: idParamSchema, body: updateProfileSchema }), updateUser);
router.patch("/:id/toggle-status", protect, authorizeGlobalRole("ADMIN"), validateRequest({ params: idParamSchema }), toggleActiveStatus);

export default router;
