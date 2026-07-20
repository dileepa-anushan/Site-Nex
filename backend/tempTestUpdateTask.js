import mongoose from 'mongoose'; import dotenv from 'dotenv'; dotenv.config(); import express from 'express'; import supertest from 'supertest'; import taskRoutes from './routes/taskRoutes.js'; import { validateRequest } from './middlewares/validateRequest.js'; import { updateTaskSchema } from './validations/schemas.js'; import * as rbac from './middlewares/rbacMiddleware.js'; import { updateTask } from './controllers/taskController.js'; 

const app = express();
app.use(express.json());
// Mock middlewares for test
const mockProtect = (req, res, next) => { req.user = { _id: new mongoose.Types.ObjectId() }; next(); };
const mockLoadProject = (req, res, next) => { req.project = { _id: new mongoose.Types.ObjectId('69c5f44d6d96266f92632953'), startDate: new Date('2020-01-01'), endDate: new Date('2030-12-31') }; next(); };
const mockLoadTask = (req, res, next) => { req.task = { _id: new mongoose.Types.ObjectId('69c5f91610f9fd0eff352e76'), projectId: req.project._id, startDate: new Date('2026-03-01'), endDate: new Date('2026-03-03'), status: 'Not Started', percentComplete: 0, save: async () => true }; next(); };
const mockAuthProject = (req, res, next) => { next(); };

app.use('/test/:projectId/tasks/:taskId', mockProtect, mockLoadProject, mockLoadTask, validateRequest({ body: updateTaskSchema }), mockAuthProject, updateTask);

mongoose.connect(process.env.MONGODB_URI, { dbName: 'sitenex' }).then(async () => {
    const res = await supertest(app)
        .put('/test/69c5f44d6d96266f92632953/tasks/69c5f91610f9fd0eff352e76')
        .send({
            name: 'Updated Name',
            description: 'Updated Description',
            status: 'Not Started',
            priority: 'Medium',
            percentComplete: 0
        });
    console.log('Update Task Response Status:', res.status);
    console.log('Update Task Response Body:', res.body);
    process.exit(0);
}).catch(console.error);
