import { useState } from "react";
import { useGetGroups, useGetSubjects, useGetGroupReport } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { FileBarChart, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const [groupId, setGroupId] = useState<number | undefined>(undefined);
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);
  
  const { data: groups } = useGetGroups();
  const { data: subjects } = useGetSubjects();

  // Only fetch report when a group is selected
  const { data: report, isLoading } = useGetGroupReport(
    groupId!, 
    subjectId ? { subjectId } : undefined,
    { query: { enabled: !!groupId } }
  );

  return (
    <div className="space-y-6 pb-8 h-full flex flex-col">
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileBarChart className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">Отчеты посещаемости</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground w-full sm:w-auto">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Фильтры:</span>
          </div>
          
          <select 
            className="h-10 px-3 rounded-lg border border-input bg-background text-sm min-w-[200px]"
            value={groupId || ""}
            onChange={(e) => setGroupId(Number(e.target.value))}
          >
            <option value="" disabled>Выберите группу...</option>
            {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>

          <select 
            className="h-10 px-3 rounded-lg border border-input bg-background text-sm min-w-[200px]"
            value={subjectId || ""}
            onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Все дисциплины</option>
            {subjects?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {!groupId ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border border-dashed">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <FileBarChart className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Выберите группу</h3>
          <p className="text-muted-foreground mt-2 text-center max-w-sm">
            Для формирования матрицы посещаемости и сводной статистики выберите учебную группу в фильтрах выше.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="animate-pulse space-y-4 w-full max-w-2xl">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded-xl w-full"></div>
          </div>
        </div>
      ) : report ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Группа</p>
              <p className="text-xl font-bold mt-1">{report.group.name}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Дисциплина</p>
              <p className="text-lg font-bold mt-1 line-clamp-1">{report.subject?.name || "Все"}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Занятий</p>
              <p className="text-xl font-bold mt-1">{report.lessons.length}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Экспорт</p>
                <p className="text-sm font-medium mt-1">Скачать Excel</p>
              </div>
              <Button size="icon" variant="secondary" className="rounded-lg">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border/50 bg-muted/20">
              <h3 className="font-semibold">Сводная статистика по студентам</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-background text-muted-foreground text-xs uppercase border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">ФИО студента</th>
                    <th className="px-4 py-3 font-medium text-center">Всего</th>
                    <th className="px-4 py-3 font-medium text-center text-emerald-600">Присутствовал</th>
                    <th className="px-4 py-3 font-medium text-center text-destructive">Отсутствовал</th>
                    <th className="px-4 py-3 font-medium text-center text-amber-600">Опоздал</th>
                    <th className="px-4 py-3 font-medium text-center text-blue-600">Уваж.</th>
                    <th className="px-4 py-3 font-medium text-right">% Посещ.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {report.students.map(s => (
                    <tr key={s.studentId} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{s.studentName}</td>
                      <td className="px-4 py-3 text-center">{s.totalLessons}</td>
                      <td className="px-4 py-3 text-center text-emerald-600 font-semibold">{s.present}</td>
                      <td className="px-4 py-3 text-center text-destructive font-semibold">{s.absent}</td>
                      <td className="px-4 py-3 text-center text-amber-600 font-semibold">{s.late}</td>
                      <td className="px-4 py-3 text-center text-blue-600 font-semibold">{s.excused}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded font-bold ${
                          s.attendanceRate >= 80 ? 'text-emerald-700 bg-emerald-100' :
                          s.attendanceRate >= 50 ? 'text-amber-700 bg-amber-100' :
                          'text-destructive bg-destructive/10'
                        }`}>
                          {Math.round(s.attendanceRate)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
