import { Router } from "express";

import { protect, protectAdmin } from "../middleware/auth.js";

import {
    createLeave,
    getLeaves,
    updateLeaveStatus
} from "../controllers/leaveController.js";

const leaveRouter = Router();

// Create leave application
leaveRouter.post("/", protect, createLeave);

// Get leave applications
leaveRouter.get("/", protect, getLeaves);

// Update leave status (Admin only)
leaveRouter.patch("/:id", protect, protectAdmin, updateLeaveStatus);

export default leaveRouter;