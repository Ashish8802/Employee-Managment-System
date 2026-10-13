import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { clockInOut,getAttendance } from "../controllers/attendancecontroller.js";

const attendanceRouter = Router();

attendanceRouter.post("/clock-in",protect, clockInOut   );
attendanceRouter.get("/attendance",protect, getAttendance );

export default attendanceRouter;

