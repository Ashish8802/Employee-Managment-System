import { Router } from "express";

import {
    login,
    session,
    changePassword
} from "../controllers/authController.js";

import { protect } from "../middleware/auth.js";

const authRouter = Router();

// Login
authRouter.post("/login", login);

// Get current user session
authRouter.get("/session", protect, session);

// Change password
authRouter.post("/change-password", protect, changePassword);

export default authRouter;