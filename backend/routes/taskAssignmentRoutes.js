import express from "express";
import { loadAssignment, authorizeProjectAccess } from "../middlewares/rbacMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
    assignmentIdParamSchema,
    createTaskAssignmentSchema,
    updateAssignmentHoursSchema,
    removeAssignmentSchema,
    getAssignmentsQuerySchema
} from "../validations/schemas.js";
import {
    assignUser,
    getAssignmentsByTask,
    updateHours,
    removeAssignment,
} from "../controllers/taskAssignmentController.js";

const router = express.Router();

// All routes mapped under /api/projects/:projectId/task-assignments

// assignUser fetches its taskId internally or from body; since task assignment requires taskId in body, validate it.
// To keep it strictly REST under projectId, we trust req.project
router.post("/", validateRequest({ body: createTaskAssignmentSchema }), authorizeProjectAccess("PROJECT_MANAGER"), assignUser);
router.get("/", validateRequest({ query: getAssignmentsQuerySchema }), authorizeProjectAccess("STORE_KEEPER"), getAssignmentsByTask); // ?taskId=xxx

router.use("/:assignmentId", validateRequest({ params: assignmentIdParamSchema }), loadAssignment);

router.patch("/:assignmentId/hours", validateRequest({ body: updateAssignmentHoursSchema }), authorizeProjectAccess("SITE_ENGINEER"), updateHours);
router.patch("/:assignmentId/remove", validateRequest({ body: removeAssignmentSchema }), authorizeProjectAccess("PROJECT_MANAGER"), removeAssignment);

export default router;
