import { useState } from "react";
import { useGetLessons, useGetGroups, useGetSubjects, useCreateLesson, useUpdateLesson, useDeleteLesson, Lesson } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, CalendarDays, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const lessonSchema = z.object({
  date: z.string().min(1, "Укажите дату"),
  topic: z.string().min(1, "Укажите тему"),
  lessonType: z.enum(["lecture", "practice", "lab", "seminar"], { required_error: "Выберите тип" }),
  groupId: z.coerce.number().min(1, "Выберите группу"),
  subjectId: z.coerce.number().min(1, "Выберите предмет"),
});

type LessonForm = z.infer<typeof lessonSchema>;

const lessonTypeNames: Record<string, string> = {
  lecture: "Лекция",
  practice: "Практика",
  lab: "Лабораторная",
  seminar: "Семинар"
};

export default function LessonsPage() {
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(undefined);
  
  const { data: groups } = useGetGroups();
  const { data: subjects } = useGetSubjects();
  const { data: lessons, isLoading } = useGetLessons(
    selectedGroupId ? { groupId: selectedGroupId } : undefined
  );
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const form = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema),
    defaultValues: { 
      date: new Date().toISOString().split('T')[0], 
      topic: "", 
      lessonType: "lecture", 
      groupId: 0, 
      subjectId: 0 
    },
  });

  const createMutation = useCreateLesson({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
        closeDialog();
      }
    }
  });

  const updateMutation = useUpdateLesson({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
        closeDialog();
      }
    }
  });

  const deleteMutation = useDeleteLesson({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      }
    }
  });

  const openAddDialog = () => {
    setEditingLesson(null);
    form.reset({ 
      date: new Date().toISOString().split('T')[0], 
      topic: "", 
      lessonType: "lecture", 
      groupId: selectedGroupId || (groups?.[0]?.id ?? 0), 
      subjectId: subjects?.[0]?.id ?? 0
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    // Convert full ISO date back to YYYY-MM-DD for input type="date"
    const dateStr = lesson.date.split('T')[0];
    form.reset({ 
      date: dateStr, 
      topic: lesson.topic, 
      lessonType: lesson.lessonType as any, 
      groupId: lesson.groupId, 
      subjectId: lesson.subjectId 
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => setIsDialogOpen(false);

  const onSubmit = (data: LessonForm) => {
    // API expects full ISO string, we append time
    const apiData = {
      ...data,
      date: new Date(data.date).toISOString()
    };
    if (editingLesson) {
      updateMutation.mutate({ id: editingLesson.id, data: apiData });
    } else {
      createMutation.mutate({ data: apiData });
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" /> Расписание занятий
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Журнал созданных пар и возможность отметить посещаемость</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <select 
              className="w-full sm:w-48 h-10 px-3 pl-4 pr-8 rounded-xl bg-background border border-border text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={selectedGroupId || ""}
              onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Все группы</option>
              {groups?.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <Button onClick={openAddDialog} className="shadow-lg shadow-primary/20 rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Добавить занятие
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Дата</th>
                <th className="px-6 py-4">Дисциплина / Тема</th>
                <th className="px-6 py-4">Группа</th>
                <th className="px-6 py-4">Тип</th>
                <th className="px-6 py-4 text-right">Посещаемость</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Загрузка...</td></tr>
              ) : lessons?.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Занятия не найдены</td></tr>
              ) : (
                lessons?.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-muted/30 transition-colors group/row">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">
                      {format(new Date(lesson.date), "d MMM yyyy", { locale: ru })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{lesson.subjectName}</div>
                      <div className="text-muted-foreground truncate max-w-[200px]" title={lesson.topic}>{lesson.topic}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md text-xs font-medium">
                        {lesson.groupName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs border border-border px-2 py-1 rounded bg-background">
                        {lessonTypeNames[lesson.lessonType]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/lessons/${lesson.id}/attendance`} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                        Отметить <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(lesson)} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: lesson.id })} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">{editingLesson ? "Редактировать занятие" : "Новое занятие"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Дата</Label>
                <Input id="date" type="date" {...form.register("date")} className="rounded-xl" />
                {form.formState.errors.date && <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lessonType">Тип</Label>
                <select id="lessonType" {...form.register("lessonType")} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm">
                  {Object.entries(lessonTypeNames).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subjectId">Дисциплина</Label>
              <select id="subjectId" {...form.register("subjectId")} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm">
                <option value={0} disabled>Выберите...</option>
                {subjects?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupId">Группа</Label>
              <select id="groupId" {...form.register("groupId")} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm">
                <option value={0} disabled>Выберите...</option>
                {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Тема занятия</Label>
              <Input id="topic" {...form.register("topic")} className="rounded-xl" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-xl">Отмена</Button>
              <Button type="submit" className="rounded-xl" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingLesson ? "Сохранить" : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
