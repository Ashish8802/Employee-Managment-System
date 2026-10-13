import { Router } from "express";

import {
    createEmployee,
    getEmployees,
    updateEmployee,
    deleteEmployee
} from "../controllers/employeeController.js";

import {
    protect,
    protectAdmin
} from "../middleware/auth.js";

const employeeRouter = Router();

// GET ALL EMPLOYEES
// GET /api/employees
employeeRouter.get("/", protect, protectAdmin, getEmployees);

// CREATE EMPLOYEE
// POST /api/employees
employeeRouter.post("/", protect, protectAdmin, createEmployee);

// UPDATE EMPLOYEE
// PUT /api/employees/:id
employeeRouter.put("/:id", protect, protectAdmin, updateEmployee);

// DELETE EMPLOYEE
// DELETE /api/employees/:id
employeeRouter.delete("/:id", protect, protectAdmin, deleteEmployee);

export default employeeRouter;