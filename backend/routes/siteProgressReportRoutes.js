import express from "express";
import { authorizeProjectAccess } from "../middlewares/rbacMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { createSiteProgressReportSchema } from "../validations/schemas.js";
import {
    createReport,
    getReportsByProject,
} from "../controllers/siteProgressReportController.js";

const router = express.Router();

router.post("/", validateRequest({ body: createSiteProgressReportSchema }), authorizeProjectAccess("SITE_ENGINEER"), createReport);
router.get("/", authorizeProjectAccess("STORE_KEEPER"), getReportsByProject);

export default router;
