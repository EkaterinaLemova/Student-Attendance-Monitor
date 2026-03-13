import { useState } from "react";
import { useGetGroups, useCreateGroup, useUpdateGroup, useDeleteGroup, Group } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const groupSchema = z.object({
  name: z.string().min(1, "Обязательное поле"),
  specialty: z.string().min(1, "Обязательное поле"),
  year: z.coerce.number().min(1).max(6),
});

type GroupForm = z.infer<typeof groupSchema>;

export default function GroupsPage() {
  const queryClient = useQueryClient();
  const { data: groups, isLoading } = useGetGroups();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const form = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: "", specialty: "", year: 1 },
  });

  const createMutation = useCreateGroup({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
        closeDialog();
      }
    }
  });

  const updateMutation = useUpdateGroup({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
        closeDialog();
      }
    }
  });

  const deleteMutation = useDeleteGroup({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      }
    }
  });

  const openAddDialog = () => {
    setEditingGroup(null);
    form.reset({ name: "", specialty: "", year: 1 });
    setIsDialogOpen(true);
  };

  const openEditDialog = (group: Group) => {
    setEditingGroup(group);
    form.reset({ name: group.name, specialty: group.specialty, year: group.year });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  const onSubmit = (data: GroupForm) => {
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Вы уверены, что хотите удалить эту группу? Все связанные данные могут быть удалены.")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Учебные группы</h1>
          <p className="text-muted-foreground text-sm mt-1">Управление группами и специальностями</p>
        </div>
        <Button onClick={openAddDialog} className="shadow-lg shadow-primary/20 rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Добавить группу
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Название</th>
                <th className="px-6 py-4">Специальность</th>
                <th className="px-6 py-4">Курс</th>
                <th className="px-6 py-4">Студентов</th>
                <th className="px-6 py-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Загрузка...</td></tr>
              ) : groups?.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Группы не найдены</td></tr>
              ) : (
                groups?.map((group) => (
                  <tr key={group.id} className="hover:bg-muted/30 transition-colors group/row">
                    <td className="px-6 py-4 font-semibold text-foreground">{group.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{group.specialty}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-primary/10 text-primary font-medium text-xs">
                        {group.year} курс
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {group.studentCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(group)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
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
            <DialogTitle className="text-xl font-display">{editingGroup ? "Редактировать группу" : "Новая группа"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название (например, ИС-201)</Label>
              <Input id="name" {...form.register("name")} className="rounded-xl" />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Специальность</Label>
              <Input id="specialty" {...form.register("specialty")} className="rounded-xl" />
              {form.formState.errors.specialty && <p className="text-xs text-destructive">{form.formState.errors.specialty.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Курс</Label>
              <Input id="year" type="number" min="1" max="6" {...form.register("year")} className="rounded-xl" />
              {form.formState.errors.year && <p className="text-xs text-destructive">{form.formState.errors.year.message}</p>}
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-xl">Отмена</Button>
              <Button type="submit" className="rounded-xl" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingGroup ? "Сохранить" : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
