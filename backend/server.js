import express from 'express';
import dotenv from "dotenv/config";
import cors from 'cors';
import connectDB from './configs/mongodb.js';

// Routes
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import taskAssignmentRoutes from './routes/taskAssignmentRoutes.js';
import { catalogRouter as materialCatalogRoutes, projectRouter as materialProjectRoutes } from './routes/materialRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import siteProgressReportRoutes from './routes/siteProgressReportRoutes.js';
import protect from './middlewares/authMiddleware.js';
import { validateRequest } from './middlewares/validateRequest.js';
import { loadProject } from './middlewares/rbacMiddleware.js';
import { projectIdParamSchema } from './validations/schemas.js';

const app = express();
const PORT = process.env.PORT || 5000;

await connectDB();

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());

// ----------------------------------------
// API Routes (Strict REST Nested Structure)
// ----------------------------------------

// Global User endpoints
app.use('/api/users', express.json(), userRoutes);

// Core Project Base endpoints
app.use('/api/projects', express.json(), projectRoutes);

// Nested Resource Routing
// e.g. /api/projects/:projectId/tasks
const projectScopedMiddlewares = [
    protect,
    validateRequest({ params: projectIdParamSchema }),
    loadProject
];

app.use('/api/projects/:projectId/tasks', projectScopedMiddlewares, express.json(), taskRoutes);
app.use('/api/projects/:projectId/issues', projectScopedMiddlewares, express.json(), issueRoutes);
app.use('/api/projects/:projectId/materials', projectScopedMiddlewares, express.json(), materialProjectRoutes);
app.use('/api/projects/:projectId/task-assignments', projectScopedMiddlewares, express.json(), taskAssignmentRoutes);
app.use('/api/projects/:projectId/site-progress-reports', projectScopedMiddlewares, express.json(), siteProgressReportRoutes);

// Legacy flat route for global material catalog endpoints (/api/materials/items)
app.use('/api/materials', express.json(), materialCatalogRoutes);

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found",
        method: req.method,
        path: req.originalUrl
    });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

export default app;