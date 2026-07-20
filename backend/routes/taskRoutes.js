import express from "express";
import { loadTask, authorizeProjectAccess } from "../middlewares/rbacMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { createTaskSchema, updateTaskSchema, taskIdParamSchema, addProgressNoteSchema, requestTaskCompletionSchema, approveTaskCompletionSchema } from "../validations/schemas.js";
import {
    createTask,
    getTasksByProject,
    getTaskById,
    updateTask,
    cancelTask,
    addProgressNote,
    getTaskNotes,
    requestCompletion,
    approveCompletion,
    getBlockedTasks,
} from "../controllers/taskController.js";

const router = express.Router();

// All task routes are mounted under /api/projects/:projectId/tasks
// The project context is already verified by loadProject in projectRoutes/server

router.post("/", validateRequest({ body: createTaskSchema }), authorizeProjectAccess("PROJECT_MANAGER"), createTask);

// Reading — restricted to any project member
router.get("/", authorizeProjectAccess("STORE_KEEPER"), getTasksByProject);

// Blocked Tasks — custom view for Site Engineer
router.get("/blocked", authorizeProjectAccess("SITE_ENGINEER"), getBlockedTasks);

// For specific tasks, load them first
router.use("/:taskId", validateRequest({ params: taskIdParamSchema }), loadTask);

// Reading single task
router.get("/:taskId", authorizeProjectAccess("STORE_KEEPER"), getTaskById);

// Mutation — member + role restricted
router.put("/:taskId", validateRequest({ body: updateTaskSchema }), authorizeProjectAccess("SITE_ENGINEER"), updateTask);
router.patch("/:taskId/cancel", authorizeProjectAccess("PROJECT_MANAGER"), cancelTask);

// Completion Workflow
router.patch("/:taskId/request-completion", validateRequest({ body: requestTaskCompletionSchema }), authorizeProjectAccess("SITE_ENGINEER"), requestCompletion);
router.patch("/:taskId/approve-completion", validateRequest({ body: approveTaskCompletionSchema }), authorizeProjectAccess("PROJECT_MANAGER"), approveCompletion);

// Progress Notes
router.post("/:taskId/notes", validateRequest({ body: addProgressNoteSchema }), authorizeProjectAccess("SITE_ENGINEER"), addProgressNote);
router.get("/:taskId/notes", authorizeProjectAccess("STORE_KEEPER"), getTaskNotes);

export default router;
