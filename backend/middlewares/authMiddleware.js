import { createClerkClient, verifyToken } from "@clerk/backend";
import User from "../models/users.js";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// @desc    Verifies Clerk session token ONLY -> attaches req.auth.userId
export const requireClerkToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
        }

        const token = authHeader.split(" ")[1];

        // Verify with Clerk — throws if token is invalid/expired
        const { sub: clerkUserId } = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });

        req.auth = { userId: clerkUserId };
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Token verification failed" });
    }
};

// @desc    Verifies Clerk session token AND attaches full MongoDB user to req.user (Auto-Provisions if missing)
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
        }

        const token = authHeader.split(" ")[1];
        console.log("Auth token on login:", token);

        // Verify with Clerk — throws if token is invalid/expired
        const { sub: clerkUserId } = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });

        // Look up the user in our own DB using the stored Clerk userId string
        let user = await User.findOne({ userId: clerkUserId });

        // Auto-provision user if they exist in Clerk but not our DB yet (Point A fix)
        if (!user) {
            try {
                // Fetch user details from Clerk to populate DB
                const clerkUser = await clerkClient.users.getUser(clerkUserId);

                const email = clerkUser.emailAddresses[0]?.emailAddress || `${clerkUserId}@placeholder.com`;
                const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || "New User";

                user = await User.create({
                    userId: clerkUserId,
                    name,
                    email: email.toLowerCase(),
                    userRole: "ADMIN", // Changed to ADMIN so the user can freely test tasks without strict role bindings
                    isActive: true
                });
            } catch (clerkError) {
                console.error("Failed to auto-provision user from Clerk:", clerkError);
                return res.status(401).json({ success: false, message: "User account not found and auto-provisioning failed" });
            }
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: "Your account has been deactivated" });
        }

        // Update last login (fire and forget, don't await blocking)
        user.lastLoginAt = new Date();
        user.save().catch(err => console.error("Failed updating last login:", err));

        // Attach the full MongoDB doc — controllers use req.user._id (Mongo ObjectId)
        req.user = user;
        req.auth = { userId: clerkUserId }; // Provide both just in case

        next();
    } catch (error) {
        console.error("Clerk verifyToken error:", error);
        return res.status(401).json({ success: false, message: "Token verification failed" });
    }
};

export default protect;
