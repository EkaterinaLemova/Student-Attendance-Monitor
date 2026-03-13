import { useState } from "react";
import { useGetSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject, Subject } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, BookOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";

const subjectSchema = z.object({
  name: z.string().min(1, "Введите название"),
  teacherId: z.coerce.number().min(1, "Обязательное поле"),
});

type SubjectForm = z.infer<typeof subjectSchema>;

export default function SubjectsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Usually we'd fetch a list of teachers, but for now we'll assign to current user if they are a teacher
  
  const { data: subjects, isLoading } = useGetSubjects();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const form = useForm<SubjectForm>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: "", teacherId: user?.id || 1 },
  });

  const createMutation = useCreateSubject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
        closeDialog();
      }
    }
  });

  const updateMutation = useUpdateSubject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
        closeDialog();
      }
    }
  });

  const deleteMutation = useDeleteSubject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      }
    }
  });

  const openAddDialog = () => {
    setEditingSubject(null);
    form.reset({ name: "", teacherId: user?.id || 1 });
    setIsDialogOpen(true);
  };

  const openEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    form.reset({ name: subject.name, teacherId: subject.teacherId });
    setIsDialogOpen(true);
  };

  const closeDialog = () => setIsDialogOpen(false);

  const onSubmit = (data: SubjectForm) => {
    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Удалить дисциплину? Это может повлиять на существующие занятия.")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" /> Дисциплины
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Предметы и курсы</p>
        </div>
        <Button onClick={openAddDialog} className="shadow-lg shadow-primary/20 rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Добавить
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Загрузка...</div>
        ) : subjects?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Дисциплины не найдены. Добавьте первую!</div>
        ) : (
          subjects?.map((subject) => (
            <div key={subject.id} className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group">
              <div className="flex-1">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-2">{subject.name}</h3>
                <p className="text-sm text-muted-foreground">Преподаватель: {subject.teacherName}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/50 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="sm" onClick={() => openEditDialog(subject)} className="rounded-lg">
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Изменить
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(subject.id)} className="rounded-lg text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">{editingSubject ? "Редактировать" : "Новая дисциплина"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название дисциплины</Label>
              <Input id="name" {...form.register("name")} className="rounded-xl" placeholder="Например: Высшая математика" />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            {/* Keeping teacherId hidden and mapped to current user for simplicity in this demo */}
            <input type="hidden" {...form.register("teacherId")} />
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-xl">Отмена</Button>
              <Button type="submit" className="rounded-xl" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingSubject ? "Сохранить" : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
