import { Router, type IRouter } from "express";
import { db, groupsTable, studentsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const groups = await db.select().from(groupsTable);
  const result = await Promise.all(
    groups.map(async (g) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(studentsTable)
        .where(eq(studentsTable.groupId, g.id));
      return { ...g, studentCount: count };
    })
  );
  res.json(result);
});

router.post("/", async (req, res) => {
  const { name, specialty, year } = req.body;
  const [group] = await db
    .insert(groupsTable)
    .values({ name, specialty, year })
    .returning();
  res.status(201).json({ ...group, studentCount: 0 });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, id));
  if (!group) { res.status(404).json({ error: "Not found" }); return; }
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(studentsTable)
    .where(eq(studentsTable.groupId, id));
  res.json({ ...group, studentCount: count });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, specialty, year } = req.body;
  const [group] = await db
    .update(groupsTable)
    .set({ name, specialty, year })
    .where(eq(groupsTable.id, id))
    .returning();
  if (!group) { res.status(404).json({ error: "Not found" }); return; }
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(studentsTable)
    .where(eq(studentsTable.groupId, id));
  res.json({ ...group, studentCount: count });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(groupsTable).where(eq(groupsTable.id, id));
  res.status(204).send();
});

export default router;
