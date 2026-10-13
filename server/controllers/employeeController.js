
import Employee from "../models/Employee.js";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import mongoose from "mongoose";
import { DEPARTMENTS } from "../constants/departments.js";

// =====================================
// 1. GET ALL EMPLOYEES
// GET /api/employees
// =====================================

export const getEmployees = async (req, res) => {
    try {
        const { department } = req.query;

        const where = { isDeleted: false };

        if (department) {
            where.department = department;
        }

        const employees = await Employee.find(where)
            .sort({ createdAt: -1 })
            .populate("userId", "email role")
            .lean();

        const result = employees.map((emp) => ({
            ...emp,
            id: emp._id.toString(),
            user: emp.userId
                ? {
                    email: emp.userId.email,
                    role: emp.userId.role
                }
                : null
        }));

        return res.json(result);

    } catch (error) {
        console.error("Error fetching employees:", error);

        return res.status(500).json({
            message: "Failed to fetch employees"
        });
    }
};


// =====================================
// 2. CREATE EMPLOYEE
// POST /api/employees
// =====================================

export const createEmployee = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            position,
            department,
            basicSalary,
            allowances,
            deductions,
            joinDate,
            password,
            bio
        } = req.body;

        if (
            !firstName ||
            !lastName ||
            !email ||
            !phone ||
            !position ||
            !password
        ) {
            return res.status(400).json({
                message: "Required fields are missing"
            });
        }

        const selectedDepartment = department ?? "Engineering";

        if (!DEPARTMENTS.includes(selectedDepartment)) {
            return res.status(400).json({
                message: "Invalid department"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({
            email,
            password: hashed,
            role: "EMPLOYEE"
        });

        try {
            const employee = await Employee.create({
                userId: user._id,
                firstName,
                lastName,
                email,
                phone,
                position,
                department: selectedDepartment,
                basicSalary: basicSalary ?? 0,
                allowances: allowances ?? 0,
                deductions: deductions ?? 0,
                joinDate: joinDate || new Date(),
                bio: bio ?? ""
            });

            return res.status(201).json({
                success: true,
                employee
            });

        } catch (employeeError) {
            // Best-effort cleanup if employee creation fails.
            await User.findByIdAndDelete(user._id).catch(
                (cleanupError) => console.error(
                    "User cleanup failed:",
                    cleanupError
                )
            );

            throw employeeError;
        }

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email or unique field already exists"
            });
        }

        if (error.name === "ValidationError" ||
            error.name === "CastError") {
            return res.status(400).json({
                message: error.message
            });
        }

        console.error("Error creating employee:", error);

        return res.status(500).json({
            message: "Failed to create employee"
        });
    }
};


// =====================================
// 3. UPDATE EMPLOYEE
// PUT /api/employees/:id
// =====================================

export const updateEmployee = async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid employee ID"
            });
        }

        const employee = await Employee.findOne({
            _id: id,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        const {
            firstName,
            lastName,
            email,
            phone,
            position,
            department,
            basicSalary,
            allowances,
            deductions,
            employmentStatus,
            bio
        } = req.body;

        const updateData = {};

        if (firstName !== undefined)
            updateData.firstName = firstName;

        if (lastName !== undefined)
            updateData.lastName = lastName;

        if (email !== undefined)
            updateData.email = email;

        if (phone !== undefined)
            updateData.phone = phone;

        if (position !== undefined)
            updateData.position = position;

        if (department !== undefined)
            updateData.department = department;

        if (basicSalary !== undefined)
            updateData.basicSalary = Number(basicSalary);

        if (allowances !== undefined)
            updateData.allowances = Number(allowances);

        if (deductions !== undefined)
            updateData.deductions = Number(deductions);

        if (employmentStatus !== undefined)
            updateData.employmentStatus = employmentStatus;

        if (bio !== undefined)
            updateData.bio = bio;

        // Validate changes before writing to either collection.
        employee.set(updateData);
        await employee.validate();

        const userUpdate = {};

        if (email !== undefined) {
            userUpdate.email = email;
        }

        // Role changes are intentionally not accepted here.
        // Use a separate, admin-authorized workflow for those.

        if (Object.keys(userUpdate).length > 0) {
            const updatedUser = await User.findByIdAndUpdate(
                employee.userId,
                { $set: userUpdate },
                { runValidators: true, new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({
                    message: "Linked user not found"
                });
            }
        }

        await employee.save();

        return res.json({
            success: true,
            employee
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        if (error.name === "ValidationError" ||
            error.name === "CastError") {
            return res.status(400).json({
                message: error.message
            });
        }

        console.error("Error updating employee:", error);

        return res.status(500).json({
            message: "Failed to update employee"
        });
    }
};


// =====================================
// 4. DELETE EMPLOYEE (SOFT DELETE)
// DELETE /api/employees/:id
// =====================================

export const deleteEmployee = async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid employee ID"
            });
        }

        const employee = await Employee.findOne({
            _id: id,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        employee.isDeleted = true;
        employee.employmentStatus = "INACTIVE";

        await employee.save();

        return res.json({
            success: true,
            message: "Employee deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting employee:", error);

        return res.status(500).json({
            message: "Failed to delete employee"
        });
    }
};
