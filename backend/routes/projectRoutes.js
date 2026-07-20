import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { loadProject, authorizeProjectAccess, authorizeGlobalRole } from "../middlewares/rbacMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
    createProjectSchema,
    updateProjectSchema,
    projectIdParamSchema,
    userIdParamSchema,
    addProjectMemberSchema
} from "../validations/schemas.js";
import {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
    getProjectDashboard,
    getProjectGantt
} from "../controllers/projectController.js";

const router = express.Router();

// Only ADMIN maps globally
router.post("/", protect, authorizeGlobalRole("ADMIN"), validateRequest({ body: createProjectSchema }), createProject);

router.get("/", protect, getAllProjects); // Controller handles membership filter

// All down-line routes must load the project first
router.use("/:projectId", protect, validateRequest({ params: projectIdParamSchema }), loadProject);

router.get("/:projectId", authorizeProjectAccess("STORE_KEEPER"), getProjectById);
router.get("/:projectId/dashboard", authorizeProjectAccess("STORE_KEEPER"), getProjectDashboard);
router.get("/:projectId/gantt", authorizeProjectAccess("STORE_KEEPER"), getProjectGantt);
router.put("/:projectId", validateRequest({ body: updateProjectSchema }), authorizeProjectAccess("PROJECT_MANAGER"), updateProject);
router.delete("/:projectId", authorizeGlobalRole("ADMIN"), deleteProject);

router.post("/:projectId/members", validateRequest({ body: addProjectMemberSchema }), authorizeProjectAccess("PROJECT_MANAGER"), addMember);
router.delete("/:projectId/members/:userId", validateRequest({ params: userIdParamSchema }), authorizeProjectAccess("PROJECT_MANAGER"), removeMember);

export default router;
