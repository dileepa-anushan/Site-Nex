import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { loadUsageLog, authorizeProjectAccess, authorizeGlobalRole } from "../middlewares/rbacMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
    createMaterialItemSchema,
    addStockMovementSchema,
    logUsageSchema,
    idParamSchema,
    usageLogIdParamSchema,
    getMovementsByMaterialQuerySchema,
    getUsageByTaskQuerySchema
} from "../validations/schemas.js";
import {
    createMaterialItem,
    getAllMaterialItems,
    updateMaterialItem,
    archiveMaterialItem,
    addStockMovement,
    getMovementsByProject,
    getMovementsByMaterial,
    logUsage,
    getUsageByProject,
    getUsageByTask,
    voidUsage,
    getMaterialUsageSummary,
} from "../controllers/materialController.js";

const catalogRouter = express.Router();
const projectRouter = express.Router();

// ── Material Catalog (global, not project-scoped) ────────────────────
catalogRouter.post("/items", protect, authorizeGlobalRole("ADMIN", "STORE_KEEPER"), validateRequest({ body: createMaterialItemSchema }), createMaterialItem);
catalogRouter.get("/items", protect, getAllMaterialItems);
catalogRouter.put("/items/:id", protect, authorizeGlobalRole("ADMIN", "STORE_KEEPER"), validateRequest({ params: idParamSchema }), updateMaterialItem);
catalogRouter.patch("/items/:id/archive", protect, authorizeGlobalRole("ADMIN"), validateRequest({ params: idParamSchema }), archiveMaterialItem);

// ── Stock Movements (project-scoped) ─────────────────────────────────
// project scoped middlewares (protect, id param validation, loadProject) are handled in server.js now
projectRouter.post("/stock-movements", validateRequest({ body: addStockMovementSchema }), authorizeProjectAccess("STORE_KEEPER"), addStockMovement);
projectRouter.get("/stock-movements", authorizeProjectAccess("STORE_KEEPER"), getMovementsByProject);
projectRouter.get("/stock-movements/by-material", validateRequest({ query: getMovementsByMaterialQuerySchema }), authorizeProjectAccess("STORE_KEEPER"), getMovementsByMaterial);

// ── Usage Logs (project-scoped) ──────────────────────────────────────
projectRouter.get("/usage-summary", authorizeProjectAccess("SITE_ENGINEER"), getMaterialUsageSummary);
projectRouter.post("/usage-logs", validateRequest({ body: logUsageSchema }), authorizeProjectAccess("STORE_KEEPER"), logUsage);
projectRouter.get("/usage-logs", authorizeProjectAccess("STORE_KEEPER"), getUsageByProject);
projectRouter.get("/usage-logs/by-task", validateRequest({ query: getUsageByTaskQuerySchema }), authorizeProjectAccess("STORE_KEEPER"), getUsageByTask);

// Voiding usage targets a specific usage log, so it loads the log (which loads the project implicitly if needed, but project already loaded in server loop)
projectRouter.patch("/usage-logs/:usageLogId/void", validateRequest({ params: usageLogIdParamSchema }), loadUsageLog, authorizeProjectAccess("STORE_KEEPER"), voidUsage);

export { catalogRouter, projectRouter };
