import { Router, type IRouter } from "express";
import { db, studentsTable, groupsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function fullName(s: { firstName: string; lastName: string; middleName?: string | null }) {
  return [s.lastName, s.firstName, s.middleName].filter(Boolean).join(" ");
}

router.get("/", async (req, res) => {
  const groupId = req.query.groupId ? Number(req.query.groupId) : undefined;

  const query = db
    .select({
      id: studentsTable.id,
      firstName: studentsTable.firstName,
      lastName: studentsTable.lastName,
      middleName: studentsTable.middleName,
      groupId: studentsTable.groupId,
      studentNumber: studentsTable.studentNumber,
      groupName: groupsTable.name,
    })
    .from(studentsTable)
    .leftJoin(groupsTable, eq(studentsTable.groupId, groupsTable.id));

  if (groupId) {
    const rows = await query.where(eq(studentsTable.groupId, groupId));
    res.json(rows);
    return;
  }

  const rows = await query;
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { firstName, lastName, middleName, groupId, studentNumber } = req.body;
  const [student] = await db
    .insert(studentsTable)
    .values({ firstName, lastName, middleName, groupId, studentNumber })
    .returning();
  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, student.groupId));
  res.status(201).json({ ...student, groupName: group?.name ?? "" });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select({
      id: studentsTable.id,
      firstName: studentsTable.firstName,
      lastName: studentsTable.lastName,
      middleName: studentsTable.middleName,
      groupId: studentsTable.groupId,
      studentNumber: studentsTable.studentNumber,
      groupName: groupsTable.name,
    })
    .from(studentsTable)
    .leftJoin(groupsTable, eq(studentsTable.groupId, groupsTable.id))
    .where(eq(studentsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { firstName, lastName, middleName, groupId, studentNumber } = req.body;
  const [student] = await db
    .update(studentsTable)
    .set({ firstName, lastName, middleName, groupId, studentNumber })
    .where(eq(studentsTable.id, id))
    .returning();
  if (!student) { res.status(404).json({ error: "Not found" }); return; }
  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, student.groupId));
  res.json({ ...student, groupName: group?.name ?? "" });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(studentsTable).where(eq(studentsTable.id, id));
  res.status(204).send();
});

export default router;
