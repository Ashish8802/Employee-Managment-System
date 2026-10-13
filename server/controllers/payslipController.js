import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import Payslip from "../models/PaySlip.js";


// 1. CREATE PAYSLIP
// POST /api/payslips
export const createPayslip = async (req, res) => {
    try {
        const {
            employeeId,
            month,
            year,
            basicSalary,
            allowances,
            deductions
        } = req.body;

        if (
            !employeeId ||
            month == null ||
            year == null ||
            basicSalary == null
        ) {
            return res.status(400).json({
                message: "Required fields are missing"
            });
        }

        if (!mongoose.isValidObjectId(employeeId)) {
            return res.status(400).json({
                message: "Invalid employee ID"
            });
        }

        const employee = await Employee.findOne({
            _id: employeeId,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        const salary = Number(basicSalary);
        const allowanceAmount = Number(allowances ?? 0);
        const deductionAmount = Number(deductions ?? 0);
        const monthNumber = Number(month);
        const yearNumber = Number(year);

        if (
            !Number.isFinite(salary) ||
            !Number.isFinite(allowanceAmount) ||
            !Number.isFinite(deductionAmount) ||
            !Number.isInteger(monthNumber) ||
            monthNumber < 1 ||
            monthNumber > 12 ||
            !Number.isInteger(yearNumber) ||
            yearNumber < 1
        ) {
            return res.status(400).json({
                message: "Invalid payslip values"
            });
        }

        const netSalary =
            salary + allowanceAmount - deductionAmount;

        const payslip = await Payslip.create({
            employeeId,
            month: monthNumber,
            year: yearNumber,
            basicSalary: salary,
            allowances: allowanceAmount,
            deductions: deductionAmount,
            netSalary
        });

        return res.status(201).json({
            success: true,
            data: payslip
        });

    } catch (error) {
        console.error("Error creating payslip:", error);

        return res.status(500).json({
            error: "Failed to create payslip"
        });
    }
};


// 2. GET PAYSLIPS
// GET /api/payslips
export const getPayslips = async (req, res) => {
    try {
        const session = req.session;
        const isAdmin = session.role === "ADMIN";

        if (isAdmin) {
            const payslips = await Payslip.find()
                .populate("employeeId")
                .sort({ createdAt: -1 })
                .lean();

            const data = payslips.map((p) => ({
                ...p,
                id: p._id.toString(),
                employee: p.employeeId,
                employeeId: p.employeeId?._id?.toString() ?? null
            }));

            return res.json({ data });
        }

        const employee = await Employee.findOne({
            userId: session.userId,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                error: "Employee not found"
            });
        }

        const payslips = await Payslip.find({
            employeeId: employee._id
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            data: payslips
        });

    } catch (error) {
        console.error("Error fetching payslips:", error);

        return res.status(500).json({
            error: "Failed to fetch payslips"
        });
    }
};


// 3. GET PAYSLIP BY ID
// GET /api/payslips/:id
export const getPayslipId = async (req, res) => {
    try {
        const session = req.session;
        const id = req.params.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                error: "Invalid payslip ID"
            });
        }

        const payslip = await Payslip.findById(id)
            .populate("employeeId")
            .lean();

        if (!payslip) {
            return res.status(404).json({
                error: "Payslip not found"
            });
        }

        if (session.role !== "ADMIN") {
            const employee = await Employee.findOne({
                userId: session.userId,
                isDeleted: false
            });

            if (
                !employee ||
                !payslip.employeeId ||
                employee._id.toString() !==
                    payslip.employeeId._id.toString()
            ) {
                return res.status(403).json({
                    error: "Access denied"
                });
            }
        }

        const result = {
            ...payslip,
            id: payslip._id.toString(),
            employee: payslip.employeeId
        };

        return res.json(result);

    } catch (error) {
        console.error("Error fetching payslip:", error);

        return res.status(500).json({
            error: "Failed to fetch payslip"
        });
    }
};