import 'dotenv/config';
import mongoose from "mongoose";
import connectDB from './configs/mongodb.js';
import TaskAssignment from './models/taskAssignment.js';

async function test() {
    await connectDB();
    try {
        await TaskAssignment.deleteMany({}); // clear for clean test

        const taskId = new mongoose.Types.ObjectId();
        const userId = new mongoose.Types.ObjectId();

        // 1. Create first assignment
        await TaskAssignment.create({ taskId, userId, roleOnTask: "Role1" });
        console.log("Created first assignment");

        // 2. Soft remove it
        await TaskAssignment.updateOne({ taskId, userId }, { removedAt: new Date(), removedReason: "Test" });
        console.log("Soft removed first assignment");

        // 3. Create second assignment with same taskId and userId
        await TaskAssignment.create({ taskId, userId, roleOnTask: "Role2" });
        console.log("SUCCESS: Created second assignment after soft removal!");

        // 4. Try creating a third assignment (should fail)
        try {
            await TaskAssignment.create({ taskId, userId, roleOnTask: "Role3" });
            console.log("FAIL: Allowed third assignment without removal");
        } catch (e) {
            console.log("SUCCESS: Blocked duplicate active assignment as expected");
        }

    } catch (e) {
        console.error("TEST FAILED:", e);
    }
    process.exit(0);
}

test();
