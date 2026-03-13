import { useState } from "react";
import { useGetStudents, useGetGroups, useCreateStudent, useUpdateStudent, useDeleteStudent, Student } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Search, GraduationCap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const studentSchema = z.object({
  firstName: z.string().min(1, "Обязательное поле"),
  lastName: z.string().min(1, "Обязательное поле"),
  middleName: z.string().optional(),
  groupId: z.coerce.number().min(1, "Выберите группу"),
  studentNumber: z.string().optional(),
});

type StudentForm = z.infer<typeof studentSchema>;

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(undefined);
  
  const { data: groups } = useGetGroups();
  const { data: students, isLoading } = useGetStudents(
    selectedGroupId ? { groupId: selectedGroupId } : undefined
  );
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const form = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: { firstName: "", lastName: "", middleName: "", groupId: 0, studentNumber: "" },
  });

  const createMutation = useCreateStudent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/students"] });
        closeDialog();
      }
    }
  });

  const updateMutation = useUpdateStudent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/students"] });
        closeDialog();
      }
    }
  });

  const deleteMutation = useDeleteStudent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      }
    }
  });

  const openAddDialog = () => {
    setEditingStudent(null);
    form.reset({ firstName: "", lastName: "", middleName: "", groupId: selectedGroupId || (groups?.[0]?.id ?? 0), studentNumber: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    form.reset({ 
      firstName: student.firstName, 
      lastName: student.lastName, 
      middleName: student.middleName || "", 
      groupId: student.groupId, 
      studentNumber: student.studentNumber || "" 
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => setIsDialogOpen(false);

  const onSubmit = (data: StudentForm) => {
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Удалить студента? История его посещаемости также будет удалена.")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" /> Студенты
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Список обучающихся и их привязка к группам</p>
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
            <Plus className="w-4 h-4 mr-2" /> Добавить
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">ФИО</th>
                <th className="px-6 py-4">Группа</th>
                <th className="px-6 py-4">Номер билета</th>
                <th className="px-6 py-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Загрузка...</td></tr>
              ) : students?.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Студенты не найдены</td></tr>
              ) : (
                students?.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/30 transition-colors group/row">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {student.lastName} {student.firstName} {student.middleName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md text-xs font-medium">
                        {student.groupName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{student.studentNumber || "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(student)} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
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
            <DialogTitle className="text-xl font-display">{editingStudent ? "Редактировать профиль" : "Добавить студента"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия</Label>
                <Input id="lastName" {...form.register("lastName")} className="rounded-xl" />
                {form.formState.errors.lastName && <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя</Label>
                <Input id="firstName" {...form.register("firstName")} className="rounded-xl" />
                {form.formState.errors.firstName && <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Отчество</Label>
              <Input id="middleName" {...form.register("middleName")} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupId">Группа</Label>
              <select 
                id="groupId" 
                {...form.register("groupId")} 
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value={0} disabled>Выберите группу</option>
                {groups?.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              {form.formState.errors.groupId && <p className="text-xs text-destructive">{form.formState.errors.groupId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentNumber">Номер студ. билета (опционально)</Label>
              <Input id="studentNumber" {...form.register("studentNumber")} className="rounded-xl" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-xl">Отмена</Button>
              <Button type="submit" className="rounded-xl" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingStudent ? "Сохранить" : "Добавить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
