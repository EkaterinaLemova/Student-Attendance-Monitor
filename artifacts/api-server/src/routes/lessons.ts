import { Router, type IRouter } from "express";
import { db, lessonsTable, groupsTable, subjectsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

const lessonWithJoins = () =>
  db
    .select({
      id: lessonsTable.id,
      date: lessonsTable.date,
      topic: lessonsTable.topic,
      lessonType: lessonsTable.lessonType,
      groupId: lessonsTable.groupId,
      groupName: groupsTable.name,
      subjectId: lessonsTable.subjectId,
      subjectName: subjectsTable.name,
      teacherId: subjectsTable.teacherId,
      teacherName: usersTable.fullName,
    })
    .from(lessonsTable)
    .leftJoin(groupsTable, eq(lessonsTable.groupId, groupsTable.id))
    .leftJoin(subjectsTable, eq(lessonsTable.subjectId, subjectsTable.id))
    .leftJoin(usersTable, eq(subjectsTable.teacherId, usersTable.id));

router.get("/", async (req, res) => {
  const groupId = req.query.groupId ? Number(req.query.groupId) : undefined;
  const subjectId = req.query.subjectId ? Number(req.query.subjectId) : undefined;

  let query = lessonWithJoins();

  if (groupId && subjectId) {
    const rows = await query.where(and(eq(lessonsTable.groupId, groupId), eq(lessonsTable.subjectId, subjectId)));
    res.json(rows);
    return;
  }
  if (groupId) {
    const rows = await query.where(eq(lessonsTable.groupId, groupId));
    res.json(rows);
    return;
  }
  if (subjectId) {
    const rows = await query.where(eq(lessonsTable.subjectId, subjectId));
    res.json(rows);
    return;
  }

  const rows = await query;
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { date, topic, lessonType, groupId, subjectId } = req.body;
  const [lesson] = await db
    .insert(lessonsTable)
    .values({ date, topic, lessonType, groupId, subjectId })
    .returning();
  const [row] = await lessonWithJoins().where(eq(lessonsTable.id, lesson.id));
  res.status(201).json(row);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [lesson] = await lessonWithJoins().where(eq(lessonsTable.id, id));
  if (!lesson) { res.status(404).json({ error: "Not found" }); return; }

  const { attendanceTable, studentsTable } = await import("@workspace/db");
  const attendance = await db
    .select({
      id: attendanceTable.id,
      lessonId: attendanceTable.lessonId,
      studentId: attendanceTable.studentId,
      studentName: studentsTable.lastName,
      status: attendanceTable.status,
      note: attendanceTable.note,
      firstName: studentsTable.firstName,
      middleName: studentsTable.middleName,
    })
    .from(attendanceTable)
    .leftJoin(studentsTable, eq(attendanceTable.studentId, studentsTable.id))
    .where(eq(attendanceTable.lessonId, id));

  res.json({
    lesson,
    attendance: attendance.map((a) => ({
      ...a,
      studentName: [a.studentName, a.firstName, a.middleName].filter(Boolean).join(" "),
    })),
  });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { date, topic, lessonType, groupId, subjectId } = req.body;
  const [lesson] = await db
    .update(lessonsTable)
    .set({ date, topic, lessonType, groupId, subjectId })
    .where(eq(lessonsTable.id, id))
    .returning();
  if (!lesson) { res.status(404).json({ error: "Not found" }); return; }
  const [row] = await lessonWithJoins().where(eq(lessonsTable.id, id));
  res.json(row);
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(lessonsTable).where(eq(lessonsTable.id, id));
  res.status(204).send();
});

export default router;
