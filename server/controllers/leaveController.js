
import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";

// 1. CREATE LEAVE
// POST /api/leave
export const createLeave = async (req, res) => {
    try {
        const session = req.session;

        const employee = await Employee.findOne({
            userId: session.userId
        });

        if (!employee) {
            return res.status(404).json({
                error: "Employee not found"
            });
        }

        if (employee.isDeleted) {
            return res.status(403).json({
                error: "Your account is deactivated. You cannot apply for leave"
            });
        }

        const { type, startDate, endDate, reason } = req.body;

        if (!type || !startDate || !endDate || !reason) {
            return res.status(400).json({
                error: "Missing fields"
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime())
        ) {
            return res.status(400).json({
                error: "Invalid leave dates"
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today || end < today) {
            return res.status(400).json({
                error: "Leave dates cannot be in the past"
            });
        }

        if (end < start) {
            return res.status(400).json({
                error: "End date cannot be before start date"
            });
        }

        const leave = await LeaveApplication.create({
            employeeId: employee._id,
            type,
            startDate: start,
            endDate: end,
            reason,
            status: "PENDING"
        });

        return res.status(201).json({
            success: true,
            data: leave
        });

    } catch (error) {
        console.error("Create leave error:", error);

        return res.status(500).json({
            error: "Failed to create leave"
        });
    }
};


// 2. GET LEAVES
// GET /api/leave
export const getLeaves = async (req, res) => {
    try {
        const session = req.session;
        const isAdmin = session.role === "ADMIN";

        if (isAdmin) {
            const status = req.query.status;

            if (
                status &&
                !["PENDING", "APPROVED", "REJECTED"].includes(status)
            ) {
                return res.status(400).json({
                    error: "Invalid status filter"
                });
            }

            const where = status ? { status } : {};

            const leaves = await LeaveApplication.find(where)
                .populate("employeeId")
                .sort({ createdAt: -1 });

            const data = leaves.map((l) => {
                const obj = l.toObject();

                return {
                    ...obj,
                    id: obj._id.toString(),
                    employee: obj.employeeId,
                    employeeId: obj.employeeId?._id?.toString() ?? null
                };
            });

            return res.json({ data });

        } else {
            const employee = await Employee.findOne({
                userId: session.userId
            }).lean();

            if (!employee) {
                return res.status(404).json({
                    error: "Employee not found"
                });
            }

            const leaves = await LeaveApplication.find({
                employeeId: employee._id
            }).sort({ createdAt: -1 });

            return res.json({
                data: leaves,
                employee: {
                    ...employee,
                    id: employee._id.toString()
                }
            });
        }

    } catch (error) {
        console.error("Get leaves error:", error);

        return res.status(500).json({
            error: "Failed to fetch leaves"
        });
    }
};


// 3. UPDATE LEAVE STATUS
// PATCH /api/leave/:id
export const updateLeaveStatus = async (req, res) => {
    try {
        if (req.session.role !== "ADMIN") {
            return res.status(403).json({
                error: "Only admins can update leave status"
            });
        }

        const { status } = req.body;

        if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
            return res.status(400).json({
                error: "Invalid status"
            });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                error: "Invalid leave ID"
            });
        }

        const leave = await LeaveApplication.findByIdAndUpdate(
            req.params.id,
            { status },
            { returnDocument: "after", runValidators: true }
        );

        if (!leave) {
            return res.status(404).json({
                error: "Leave application not found"
            });
        }

        return res.json({
            success: true,
            data: leave
        });

    } catch (error) {
        console.error("Update leave status error:", error);

        return res.status(500).json({
            error: "Failed to update leave status"
        });
    }
};
