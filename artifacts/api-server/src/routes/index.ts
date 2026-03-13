import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import groupsRouter from "./groups";
import studentsRouter from "./students";
import subjectsRouter from "./subjects";
import lessonsRouter from "./lessons";
import attendanceRouter from "./attendance";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/groups", groupsRouter);
router.use("/students", studentsRouter);
router.use("/subjects", subjectsRouter);
router.use("/lessons", lessonsRouter);
router.use("/attendance", attendanceRouter);
router.use("/reports", reportsRouter);

export default router;
