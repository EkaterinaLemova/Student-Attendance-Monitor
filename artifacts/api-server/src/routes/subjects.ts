import { Router, type IRouter } from "express";
import { db, subjectsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const rows = await db
    .select({
      id: subjectsTable.id,
      name: subjectsTable.name,
      teacherId: subjectsTable.teacherId,
      teacherName: usersTable.fullName,
    })
    .from(subjectsTable)
    .leftJoin(usersTable, eq(subjectsTable.teacherId, usersTable.id));
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { name, teacherId } = req.body;
  const [subject] = await db.insert(subjectsTable).values({ name, teacherId }).returning();
  const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, subject.teacherId));
  res.status(201).json({ ...subject, teacherName: teacher?.fullName ?? "" });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, teacherId } = req.body;
  const [subject] = await db.update(subjectsTable).set({ name, teacherId }).where(eq(subjectsTable.id, id)).returning();
  if (!subject) { res.status(404).json({ error: "Not found" }); return; }
  const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, subject.teacherId));
  res.json({ ...subject, teacherName: teacher?.fullName ?? "" });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(subjectsTable).where(eq(subjectsTable.id, id));
  res.status(204).send();
});

export default router;
