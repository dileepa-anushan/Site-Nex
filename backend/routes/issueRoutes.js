import express from "express";
import { loadIssue, authorizeProjectAccess } from "../middlewares/rbacMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
    createIssueSchema,
    issueIdParamSchema,
    updateIssueSchema,
    assignIssueSchema,
    resolveIssueSchema,
    getIssuesQuerySchema
} from "../validations/schemas.js";
import {
    createIssue,
    getIssuesByProject,
    getIssueById,
    updateIssue,
    assignIssue,
    resolveIssue,
    closeIssue,
} from "../controllers/issueController.js";

const router = express.Router();

// All routes mapped under /api/projects/:projectId/issues
router.post("/", validateRequest({ body: createIssueSchema }), authorizeProjectAccess("STORE_KEEPER"), createIssue);
router.get("/", validateRequest({ query: getIssuesQuerySchema }), authorizeProjectAccess("STORE_KEEPER"), getIssuesByProject);

router.use("/:issueId", validateRequest({ params: issueIdParamSchema }), loadIssue);

router.get("/:issueId", authorizeProjectAccess("STORE_KEEPER"), getIssueById);
router.put("/:issueId", validateRequest({ body: updateIssueSchema }), authorizeProjectAccess("SITE_ENGINEER"), updateIssue);
router.patch("/:issueId/assign", validateRequest({ body: assignIssueSchema }), authorizeProjectAccess("PROJECT_MANAGER"), assignIssue);
router.patch("/:issueId/resolve", validateRequest({ body: resolveIssueSchema }), authorizeProjectAccess("SITE_ENGINEER"), resolveIssue);
router.patch("/:issueId/close", authorizeProjectAccess("PROJECT_MANAGER"), closeIssue);

export default router;
