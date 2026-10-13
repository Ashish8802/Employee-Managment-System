import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },

        date: {
            type: Date,
            required: true
        },

        checkInTime: {
            type: Date,
            required: true
        },

        checkOutTime: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: ["PRESENT", "ABSENT", "LEAVE"],
            default: "PRESENT"
        },

        dayType: {
            type: String,
            enum: [
                "full day",
                "Three quarter day",
                "half day",
                "short day"
            ],
            default: null
        },

        workingHours: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate attendance records for the same day
attendanceSchema.index(
    { employeeId: 1, date: 1 },
    { unique: true }
);

const Attendance =
    mongoose.models.Attendance ||
    mongoose.model("Attendance", attendanceSchema);

export default Attendance;