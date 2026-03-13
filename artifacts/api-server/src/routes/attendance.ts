import { Router, type IRouter } from "express";
import { db, attendanceTable, studentsTable, lessonsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const lessonId = req.query.lessonId ? Number(req.query.lessonId) : undefined;
  const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;

  const query = db
    .select({
      id: attendanceTable.id,
      lessonId: attendanceTable.lessonId,
      studentId: attendanceTable.studentId,
      firstName: studentsTable.firstName,
      lastName: studentsTable.lastName,
      middleName: studentsTable.middleName,
      status: attendanceTable.status,
      note: attendanceTable.note,
    })
    .from(attendanceTable)
    .leftJoin(studentsTable, eq(attendanceTable.studentId, studentsTable.id));

  let rows;
  if (lessonId && studentId) {
    rows = await query.where(and(eq(attendanceTable.lessonId, lessonId), eq(attendanceTable.studentId, studentId)));
  } else if (lessonId) {
    rows = await query.where(eq(attendanceTable.lessonId, lessonId));
  } else if (studentId) {
    rows = await query.where(eq(attendanceTable.studentId, studentId));
  } else {
    rows = await query;
  }

  res.json(
    rows.map((r) => ({
      ...r,
      studentName: [r.lastName, r.firstName, r.middleName].filter(Boolean).join(" "),
    }))
  );
});

router.post("/", async (req, res) => {
  const { lessonId, records } = req.body as {
    lessonId: number;
    records: { studentId: number; status: string; note?: string }[];
  };

  const result = [];
  for (const record of records) {
    const existing = await db
      .select()
      .from(attendanceTable)
      .where(and(eq(attendanceTable.lessonId, lessonId), eq(attendanceTable.studentId, record.studentId)));

    if (existing.length > 0) {
      const [updated] = await db
        .update(attendanceTable)
        .set({ status: record.status, note: record.note })
        .where(and(eq(attendanceTable.lessonId, lessonId), eq(attendanceTable.studentId, record.studentId)))
        .returning();
      result.push(updated);
    } else {
      const [created] = await db
        .insert(attendanceTable)
        .values({ lessonId, studentId: record.studentId, status: record.status, note: record.note })
        .returning();
      result.push(created);
    }
  }

  const rows = await db
    .select({
      id: attendanceTable.id,
      lessonId: attendanceTable.lessonId,
      studentId: attendanceTable.studentId,
      firstName: studentsTable.firstName,
      lastName: studentsTable.lastName,
      middleName: studentsTable.middleName,
      status: attendanceTable.status,
      note: attendanceTable.note,
    })
    .from(attendanceTable)
    .leftJoin(studentsTable, eq(attendanceTable.studentId, studentsTable.id))
    .where(eq(attendanceTable.lessonId, lessonId));

  res.json(
    rows.map((r) => ({
      ...r,
      studentName: [r.lastName, r.firstName, r.middleName].filter(Boolean).join(" "),
    }))
  );
});

export default router;
