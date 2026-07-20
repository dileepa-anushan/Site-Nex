import { ZodError } from "zod";

/**
 * Express middleware to validate req.body, req.query, and req.params against Zod schemas.
 * @param {Object} schemas - { body?, query?, params? }
 */
export const validateRequest = (schemas) => {
    return (req, res, next) => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.query) {
                Object.assign(req.query, schemas.query.parse(req.query));
            }
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
        } catch (error) {
            if (error instanceof ZodError) {
                // Map zod errors into a friendly object
                const issues = error.errors || error.issues || [];
                const formattedErrors = issues.map(err => ({
                    field: err.path.join("."),
                    message: err.message
                }));
                return res.status(400).json({ success: false, message: "Validation failed", errors: formattedErrors });
            }
            return res.status(500).json({ success: false, message: "Internal validation error" });
        }

        // Call next outside try-catch so it doesn't catch downstream errors
        next();
    };
};
