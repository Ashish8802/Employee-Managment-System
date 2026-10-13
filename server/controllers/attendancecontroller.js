import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";

// Clock In/Out for employees
export const clockInOut = async (req, res) => {
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
                error: "Employee is inactive"
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await Attendance.findOne({
            employeeId: employee._id,
            date: today
        });

        const now = new Date();

        // CLOCK IN
        if (!existing) {
            const cutoff = new Date(now);
            cutoff.setHours(9, 0, 0, 0);

            const isLate = now > cutoff;

            const attendance = await Attendance.create({
                employeeId: employee._id,
                date: today,
                checkInTime: now,
                status: "PRESENT"
            });

            return res.json({
                success: true,
                type: "CHECK_IN",
                isLate,
                data: attendance
            });
        }

        // CLOCK OUT
        else if (!existing.checkOutTime) {
            const checkInTime = new Date(
                existing.checkInTime
            ).getTime();

            const diffMs = now.getTime() - checkInTime;
            const diffHours = diffMs / (1000 * 60 * 60);

            existing.checkOutTime = now;

            const workingHours = Number(diffHours.toFixed(2));

            let dayType = "short day";

            if (workingHours >= 8) {
                dayType = "full day";
            } else if (workingHours >= 6) {
                dayType = "Three quarter day";
            } else if (workingHours >= 4) {
                dayType = "half day";
            }

            existing.workingHours = workingHours;
            existing.dayType = dayType;

            await existing.save();

            return res.json({
                success: true,
                type: "CHECK_OUT",
                data: existing
            });
        }

        return res.status(409).json({
            error: "Attendance already completed for today"
        });

    } catch (error) {
        console.error("Error in clockInOut:", error);

        return res.status(500).json({
            error: "Failed to process attendance"
        });
    }
};


// Get attendance for employees
export const getAttendance = async (req, res) => {
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

        const limit = Math.min(
            Math.max(parseInt(req.query.limit, 10) || 30, 1),
            100
        );

        const history = await Attendance.find({
            employeeId: employee._id
        })
            .sort({ date: -1 })
            .limit(limit);

        return res.json({
            data: history,
            employee: {
                isDeleted: employee.isDeleted
            }
        });

    } catch (error) {
        console.error("Error fetching attendance:", error);

        return res.status(500).json({
            error: "Failed to fetch attendance"
        });
    }
};