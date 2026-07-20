import mongoose from "mongoose";
import User from "./models/users.js";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, { dbName: "sitenex" }).then(async () => {
    const users = await User.find({ userRole: 'SITE_ENGINEER' });
    console.log("SE EMAILS:", users.map(u => u.email).join(', '));
    process.exit(0);
}).catch(console.error);
