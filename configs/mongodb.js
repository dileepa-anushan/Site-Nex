import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on("connected", () => {
            console.log("MongoDB is connected");
        });

        await mongoose.connect(process.env.MONGODB_URI, { dbName: "sitenex" });
        return true;
    } catch (err) {
        console.error("MongoDB connection failed:", err);

        // Allow the app to boot in development even if Mongo is temporarily unreachable.
        // In production, failing fast is safer.
        const isOptional = process.env.MONGODB_OPTIONAL === "true" || process.env.NODE_ENV !== "production";
        if (isOptional) {
            console.warn("Continuing without MongoDB connection (dev mode).");
            return false;
        }

        process.exit(1);
    }
};

export default connectDB;