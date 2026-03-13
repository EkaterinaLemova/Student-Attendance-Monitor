import { Router, type IRouter } from "express";
import { db, groupsTable, subjectsTable, usersTable, studentsTable, lessonsTable, attendanceTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/group/:groupId", async (req, res) => {
  const groupId = Number(req.params.groupId);
  const subjectId = req.query.subjectId ? Number(req.query.subjectId) : undefined;

  const [group] = await db
    .select({ id: groupsTable.id, name: groupsTable.name, specialty: groupsTable.specialty, year: groupsTable.year })
    .from(groupsTable)
    .where(eq(groupsTable.id, groupId));

  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  let lessonsQuery = db
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

  let lessons;
  if (subjectId) {
    lessons = await lessonsQuery.where(and(eq(lessonsTable.groupId, groupId), eq(lessonsTable.subjectId, subjectId)));
  } else {
    lessons = await lessonsQuery.where(eq(lessonsTable.groupId, groupId));
  }

  const students = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.groupId, groupId));

  const lessonIds = lessons.map((l) => l.id);

  let subjectInfo = null;
  if (subjectId) {
    const [s] = await db
      .select({ id: subjectsTable.id, name: subjectsTable.name, teacherId: subjectsTable.teacherId, teacherName: usersTable.fullName })
      .from(subjectsTable)
      .leftJoin(usersTable, eq(subjectsTable.teacherId, usersTable.id))
      .where(eq(subjectsTable.id, subjectId));
    subjectInfo = s;
  }

  const studentSummaries = await Promise.all(
    students.map(async (student) => {
      const records = lessonIds.length > 0
        ? await db.select().from(attendanceTable).where(
            and(
              eq(attendanceTable.studentId, student.id),
              sql`${attendanceTable.lessonId} = ANY(${JSON.stringify(lessonIds)}::int[])`
            )
          )
        : [];

      const present = records.filter((r) => r.status === "present").length;
      const absent = records.filter((r) => r.status === "absent").length;
      const late = records.filter((r) => r.status === "late").length;
      const excused = records.filter((r) => r.status === "excused").length;
      const total = lessons.length;
      const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

      return {
        studentId: student.id,
        studentName: [student.lastName, student.firstName, student.middleName].filter(Boolean).join(" "),
        totalLessons: total,
        present,
        absent,
        late,
        excused,
        attendanceRate,
      };
    })
  );

  const attendanceMatrix: Record<string, any>[] = [];
  for (const student of students) {
    const row: Record<string, any> = {
      studentId: student.id,
      studentName: [student.lastName, student.firstName, student.middleName].filter(Boolean).join(" "),
    };
    for (const lesson of lessons) {
      const records = await db
        .select()
        .from(attendanceTable)
        .where(and(eq(attendanceTable.lessonId, lesson.id), eq(attendanceTable.studentId, student.id)));
      row[`lesson_${lesson.id}`] = records[0]?.status ?? null;
    }
    attendanceMatrix.push(row);
  }

  res.json({
    group: { ...group, studentCount: students.length },
    subject: subjectInfo,
    lessons,
    students: studentSummaries,
    attendanceMatrix,
  });
});

router.get("/stats", async (_req, res) => {
  const [{ totalStudents }] = await db.select({ totalStudents: sql<number>`count(*)::int` }).from(studentsTable);
  const [{ totalGroups }] = await db.select({ totalGroups: sql<number>`count(*)::int` }).from(groupsTable);
  const [{ totalLessons }] = await db.select({ totalLessons: sql<number>`count(*)::int` }).from(lessonsTable);

  const recentLessons = await db
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
    .leftJoin(usersTable, eq(subjectsTable.teacherId, usersTable.id))
    .orderBy(sql`${lessonsTable.date} DESC`)
    .limit(5);

  const totalAttendance = await db.select({ count: sql<number>`count(*)::int` }).from(attendanceTable);
  const presentAttendance = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(attendanceTable)
    .where(sql`${attendanceTable.status} IN ('present', 'late')`);

  const avgRate =
    totalAttendance[0].count > 0
      ? Math.round((presentAttendance[0].count / totalAttendance[0].count) * 100)
      : 0;

  res.json({
    totalStudents,
    totalGroups,
    totalLessons,
    averageAttendanceRate: avgRate,
    recentLessons,
    lowAttendanceStudents: [],
  });
});

export default router;
