import mongoose from 'mongoose'; import dotenv from 'dotenv'; dotenv.config(); import { updateTask } from './controllers/taskController.js'; import Task from './models/task.js'; import Project from './models/projects.js';

mongoose.connect(process.env.MONGODB_URI, { dbName: 'sitenex' }).then(async () => {
    let responseStatus, responseJson;
    const req = {
        body: { percentComplete: 50 },
        task: await Task.findOne(),
        project: await Project.findOne()
    };
    if (!req.task) {
        console.log("No tasks in DB");
        return process.exit(0);
    }
    const res = {
        status: (s) => { responseStatus = s; return res; },
        json: (j) => { responseJson = j; return res; }
    };
    await updateTask(req, res);
    console.log("Update status:", responseStatus);
    console.log("Update json:", responseJson);
    process.exit(0);
}).catch(console.error);
