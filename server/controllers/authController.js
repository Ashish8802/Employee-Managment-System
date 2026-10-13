
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// 1. LOGIN FOR EMPLOYEE AND ADMIN
// POST /api/auth/login
export const login = async (req, res) => {
    try {
        const { email, password, role_type } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (role_type === "admin" && user.role !== "ADMIN") {
            return res.status(401).json({
                message: "Unauthorized access"
            });
        }

        if (role_type === "employee" && user.role !== "EMPLOYEE") {
            return res.status(401).json({
                message: "Unauthorized access"
            });
        }

        const isValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isValid) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const payload = {
            userId: user._id.toString(),
            role: user.role,
            email: user.email
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json({
            user: payload,
            token
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            error: "Login failed"
        });
    }
};


// 2. GET CURRENT SESSION
// GET /api/auth/session
export const session = (req, res) => {
    return res.json({
        session: req.session
    });
};


// 3. CHANGE PASSWORD
// POST /api/auth/change-password
export const changePassword = async (req, res) => {
    try {
        const session = req.session;

        const {
            currentPassword,
            newPassword
        } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current and new passwords are required"
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: "New password must be at least 8 characters"
            });
        }

        const user = await User.findById(session.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isValid = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isValid) {
            return res.status(400).json({
                message: "Current password is incorrect"
            });
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        await User.findByIdAndUpdate(
            session.userId,
            { password: hashed }
        );

        return res.json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            error: "Change password failed"
        });
    }
};
