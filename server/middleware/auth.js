import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Unauthorized access"
            });
        }

        const token = authHeader.split(" ")[1];

        const session = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.session = session;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

export const protectAdmin = (req, res, next) => {
    if (req.session?.role !== "ADMIN") {
        return res.status(403).json({
            error: "Admin access required"
        });
    }

    next();
};