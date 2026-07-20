import { z } from "zod";
import mongoose from "mongoose";

const objectId = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
});

// ----------------------------------------
// Common
// ----------------------------------------
export const idParamSchema = z.object({
    id: objectId,
});

export const projectIdParamSchema = z.object({
    projectId: objectId,
});

export const taskIdParamSchema = z.object({
    taskId: objectId,
});

export const issueIdParamSchema = z.object({
    issueId: objectId,
});

export const assignmentIdParamSchema = z.object({
    assignmentId: objectId,
});

export const userIdParamSchema = z.object({
    userId: objectId,
});

export const taskParamSchema = z.object({
    projectId: objectId,
    taskId: objectId,
});

// ----------------------------------------
// Users
// ----------------------------------------
export const registerUserSchema = z.object({
    userId: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    userRole: z.enum(["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "ASSISTANT_ENGINEER", "STORE_KEEPER", "SAFETY_OFFICER", "WORKER"]),
    phone: z.string().optional(),
    nic: z.string().optional(),
});

export const updateProfileSchema = z.object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
    nic: z.string().optional(),
});

export const syncUserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
});

// ----------------------------------------
// Projects
// ----------------------------------------
export const createProjectSchema = z.object({
    name: z.string().min(1),
    location: z.string().min(1),
    startDate: z.string(), // ISO string
    endDate: z.string(),
    description: z.string().optional(),
    budget: z.number().min(0).optional(),
    status: z.enum(["Planning", "Active", "On Hold", "Completed"]).optional(),
    clientName: z.string().optional(),
    projectCode: z.string().optional(),
    plannedBudget: z.number().min(0).optional(),
    actualBudgetUsed: z.number().min(0).optional(),
    assignedSiteEngineers: z.array(z.string()).optional(),
    assignedStoreKeepers: z.array(z.string()).optional(),
    assignedSafetyOfficers: z.array(z.string()).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const addProjectMemberSchema = z.object({
    userId: objectId,
    role: z.enum(["PROJECT_MANAGER", "SAFETY_OFFICER", "SITE_ENGINEER", "ASSISTANT_ENGINEER", "STORE_KEEPER", "WORKER"]),
    isPrimary: z.boolean().optional(),
});

// ----------------------------------------
// Tasks
// ----------------------------------------
export const createTaskSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    status: z.enum(["Not Started", "In Progress", "Under Review", "Completed", "Cancelled", "On Hold"]).optional(),
    priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
    startDate: z.string(),
    endDate: z.string(),
    percentComplete: z.number().min(0).max(100).optional(),
    dependencyTaskIds: z.array(objectId).optional(),
    estimatedHours: z.number().min(0).optional(),
    actualHours: z.number().min(0).optional(),
    assignedWorkers: z.array(z.string()).optional(),
    assignedSiteEngineers: z.array(z.string()).optional(),
    assignedStoreKeepers: z.array(z.string()).optional(),
    parentTaskId: z.string().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const addProgressNoteSchema = z.object({
    note: z.string().min(1, "Note content cannot be empty"),
});

export const requestTaskCompletionSchema = z.object({
    note: z.string().optional(),
});

export const approveTaskCompletionSchema = z.object({
    note: z.string().optional(),
});

export const createSiteProgressReportSchema = z.object({
    reportDate: z.string(),
    summary: z.string().min(1),
    workCompleted: z.string().min(1),
    plannedNextSteps: z.string().optional(),
    delaysOrRisks: z.string().optional(),
    weatherNotes: z.string().optional()
});

// ----------------------------------------
// Task Assignments
// ----------------------------------------
export const createTaskAssignmentSchema = z.object({
    taskId: objectId,
    userId: objectId,
    roleOnTask: z.string().min(1),
    expectedHours: z.number().min(0).optional(),
});

export const updateAssignmentHoursSchema = z.object({
    expectedHours: z.number().min(0).optional(),
    actualHours: z.number().min(0).optional(),
    workStarted: z.boolean().optional(),
});

export const removeAssignmentSchema = z.object({
    removedReason: z.string().optional(),
    reason: z.string().optional(),
});

export const getAssignmentsQuerySchema = z.object({
    taskId: objectId,
});

// ----------------------------------------
// Issues
// ----------------------------------------
export const createIssueSchema = z.object({
    taskId: objectId.optional(),
    title: z.string().min(1),
    description: z.string().min(1),
    type: z.enum(["Defect", "Safety", "Material Shortage", "Design Request", "Other"]),
    priority: z.enum(["Low", "Medium", "High", "Critical"]),
    dueDate: z.string().optional(),
    reportedLocation: z.string().optional(),
    severity: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
});

export const updateIssueSchema = createIssueSchema.partial();

export const resolveIssueSchema = z.object({
    resolutionNote: z.string().min(1),
});

export const assignIssueSchema = z.object({
    assignedTo: objectId,
});

export const getIssuesQuerySchema = z.object({
    status: z.enum(["Open", "Assigned", "In Progress", "Resolved", "Closed"]).optional(),
    priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
});

// ----------------------------------------
// Materials
// ----------------------------------------
export const createMaterialItemSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    category: z.string().min(1).optional(),
    unit: z.string().min(1),
    defaultUnitCost: z.number().min(0).optional(),
    minStockThreshold: z.number().min(0).optional(),
});
// ----------------------------------------
// Safety Incidents
// ----------------------------------------
export const createSafetyIncidentSchema = z.object({
    incidentDate: z.string(),
    incidentType: z.enum(["Near Miss", "Injury", "Equipment Accident", "Fire Hazard", "Unsafe Act", "Other"]),
    location: z.string().min(1),
    description: z.string().min(1),
    severity: z.enum(["Low", "Medium", "High", "Critical"]),
    injuryReported: z.boolean().optional(),
    affectedPersons: z.number().min(0).optional(),
    immediateActionTaken: z.string().optional(),
    followUpAction: z.string().optional(),
    status: z.enum(["Open", "Under Investigation", "Resolved", "Closed"]).optional(),
    requiresImmediateAttention: z.boolean().optional()
});

export const updateSafetyIncidentSchema = createSafetyIncidentSchema.partial();

export const deleteSafetyIncidentSchema = z.object({
    deleteReason: z.string().min(1, "Delete reason is required")
});

export const incidentIdParamSchema = z.object({
    incidentId: objectId,
});

// ----------------------------------------
// Safety Observations
// ----------------------------------------
export const createSafetyObservationSchema = z.object({
    title: z.string().min(1),
    type: z.enum(["Unsafe Condition", "Unsafe Act", "Environmental", "Other"]),
    severity: z.enum(["Low", "Medium", "High", "Critical"]),
    location: z.string().min(1),
    dueDate: z.string().optional(),
    photos: z.array(z.string()).optional(),
    status: z.enum(["Open", "Resolved", "Closed"]).optional(),
    notes: z.string().optional()
});

export const updateSafetyObservationSchema = createSafetyObservationSchema.partial();

export const deleteSafetyObservationSchema = z.object({
    deleteReason: z.string().min(1, "Delete reason is required")
});

export const observationIdParamSchema = z.object({
    observationId: objectId,
});

// ----------------------------------------
// Hazard Reports
// ----------------------------------------
export const createHazardReportSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    controlActions: z.string().min(1),
    dueDate: z.string().optional(),
    status: z.enum(["Open", "Controlled", "Closed"]).optional()
});

export const updateHazardReportSchema = createHazardReportSchema.partial();

export const deleteHazardReportSchema = z.object({
    deleteReason: z.string().min(1, "Delete reason is required")
});

export const hazardIdParamSchema = z.object({
    hazardId: objectId,
});

// ----------------------------------------
// Safety Notices (Stop/Hold)
// ----------------------------------------
export const createSafetyNoticeSchema = z.object({
    taskId: objectId.optional(),
    location: z.string().optional(),
    reason: z.string().min(1),
    status: z.enum(["Active", "Lifted"]).optional()
});

export const updateSafetyNoticeSchema = createSafetyNoticeSchema.partial();

export const deleteSafetyNoticeSchema = z.object({
    deleteReason: z.string().min(1, "Delete reason is required")
});

export const noticeIdParamSchema = z.object({
    noticeId: objectId,
});

// ----------------------------------------
// Permits To Work (PTW)
// ----------------------------------------
export const createPTWSchema = z.object({
    taskId: objectId,
    permitType: z.enum(["Hot Work", "Confined Space", "Working at Heights", "Excavation", "General"]),
    status: z.enum(["Pending", "Approved", "Denied", "Revoked"]).optional(),
    validUntil: z.string().optional(),
    notes: z.string().optional()
});

export const updatePTWSchema = createPTWSchema.partial();

export const deletePTWSchema = z.object({
    deleteReason: z.string().min(1, "Delete reason is required")
});

export const ptwIdParamSchema = z.object({
    ptwId: objectId,
});

// ----------------------------------------
// Tools & Equipment
// ----------------------------------------
export const createToolSchema = z.object({
    name: z.string().min(1),
    serialNumber: z.string().optional(),
    condition: z.enum(["New", "Good", "Fair", "Poor"]).optional(),
    totalQuantity: z.number().min(1).optional(),
    notes: z.string().optional()
});

export const updateToolSchema = createToolSchema.partial().extend({
    isBlacklisted: z.boolean().optional(),
    availableQuantity: z.number().min(0).optional()
});

export const toolIdParamSchema = z.object({
    toolId: objectId,
});

export const blacklistToolSchema = z.object({
    isBlacklisted: z.boolean()
});

// ----------------------------------------
// Material Requests
// ----------------------------------------
export const createMaterialRequestSchema = z.object({
    taskId: objectId,
    items: z.array(z.object({
        requestType: z.enum(["Material", "Tool"]).optional(),
        itemId: objectId,
        quantityRequested: z.number().positive(),
    })).min(1),
    notes: z.string().optional()
});

export const materialRequestIdParamSchema = z.object({
    requestId: objectId,
});

// ----------------------------------------
// Main Storage Tools (Store Keeper)
// ----------------------------------------
export const createMainStorageToolSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    quantity: z.number().min(0),
    condition: z.enum(["New", "Good", "Fair", "Poor", "Damaged"]).optional(),
});

export const updateMainStorageToolSchema = createMainStorageToolSchema.partial();

export const mainStorageToolIdParamSchema = z.object({
    id: objectId,
});

// ----------------------------------------
// Issuance Logs (Store Keeper)
// ----------------------------------------
export const createIssuanceLogSchema = z.object({
    type: z.enum(["Material", "Tool"]),
    materialItemId: objectId.optional(),
    mainStorageToolId: objectId.optional(),
    projectId: objectId,
    taskId: objectId.optional(),
    materialRequestId: objectId.optional(),
    requestedBy: objectId,
    issuedQuantity: z.number().min(1),
    conditionAtIssue: z.enum(["New", "Good", "Fair", "Poor", "Damaged"]).optional(),
});

export const returnToolIssuanceSchema = z.object({
    returnDate: z.string(),
    conditionAtReturn: z.enum(["New", "Good", "Fair", "Poor", "Damaged"]),
    damageNotes: z.string().optional(),
});

export const issuanceLogIdParamSchema = z.object({
    id: objectId,
});
