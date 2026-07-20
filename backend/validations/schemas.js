import { z } from "zod";
import mongoose from "mongoose";

// Custom Zod validation for MongoDB ObjectId
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

export const usageLogIdParamSchema = z.object({
    usageLogId: objectId,
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
    userRole: z.enum(["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "ASSISTANT_ENGINEER", "STORE_KEEPER"]),
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
    clientName: z.string().optional(),
    projectCode: z.string().optional(),
    plannedBudget: z.number().min(0).optional(),
    actualBudgetUsed: z.number().min(0).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const addProjectMemberSchema = z.object({
    userId: objectId,
    role: z.enum(["PROJECT_MANAGER", "SITE_ENGINEER", "ASSISTANT_ENGINEER", "STORE_KEEPER"]),
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
    category: z.string().min(1).optional(),
    unit: z.string().min(1),
    defaultUnitCost: z.number().min(0).optional(),
    minStockThreshold: z.number().min(0).optional(),
});
export const addStockMovementSchema = z.object({
    materialItemId: objectId,
    type: z.enum(["STOCK_IN", "ADJUSTMENT"]),
    quantity: z.number(),
    supplier: z.string().optional(),
    deliveryDate: z.string().optional(),
    unitCost: z.number().optional(),
    note: z.string().optional()
});

export const logUsageSchema = z.object({
    taskId: objectId,
    materialItemId: objectId,
    quantityUsed: z.number().positive(),
    usageDate: z.string()
});

export const getMovementsByMaterialQuerySchema = z.object({
    materialItemId: objectId,
});

export const getUsageByTaskQuerySchema = z.object({
    taskId: objectId,
});
