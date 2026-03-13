import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useGetLesson, useGetStudents, useSaveAttendance, AttendanceRecordStatus } from "@workspace/api-client-react";
import { ArrowLeft, Save, Loader2, Check, X, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

const statusConfig = {
  present: { label: "Присутствовал", icon: Check, color: "text-emerald-700 bg-emerald-100 border-emerald-200 hover:bg-emerald-200", active: "bg-emerald-500 text-white border-emerald-600 ring-4 ring-emerald-500/20" },
  absent: { label: "Отсутствовал", icon: X, color: "text-destructive bg-destructive/10 border-destructive/20 hover:bg-destructive/20", active: "bg-destructive text-white border-red-700 ring-4 ring-destructive/20" },
  late: { label: "Опоздал", icon: Clock, color: "text-amber-700 bg-amber-100 border-amber-200 hover:bg-amber-200", active: "bg-amber-500 text-white border-amber-600 ring-4 ring-amber-500/20" },
  excused: { label: "Уваж. причина", icon: Info, color: "text-blue-700 bg-blue-100 border-blue-200 hover:bg-blue-200", active: "bg-blue-500 text-white border-blue-600 ring-4 ring-blue-500/20" },
};

export default function AttendancePage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const lessonId = Number(params.id);

  const { data: lessonData, isLoading: isLoadingLesson } = useGetLesson(lessonId);
  
  // We need to fetch all students in the group because lessonData.attendance might be empty initially
  const { data: students, isLoading: isLoadingStudents } = useGetStudents(
    lessonData?.lesson.groupId ? { groupId: lessonData.lesson.groupId } : undefined,
    { query: { enabled: !!lessonData?.lesson.groupId } }
  );

  const [records, setRecords] = useState<Record<number, AttendanceRecordStatus>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Initialize state from existing attendance
  useEffect(() => {
    if (lessonData?.attendance && students) {
      const initialRecords: Record<number, AttendanceRecordStatus> = {};
      // default all to present
      students.forEach(s => {
        initialRecords[s.id] = "present";
      });
      // override with saved
      lessonData.attendance.forEach(rec => {
        initialRecords[rec.studentId] = rec.status;
      });
      setRecords(initialRecords);
      setIsDirty(false);
    }
  }, [lessonData, students]);

  const saveMutation = useSaveAttendance({
    mutation: {
      onSuccess: () => {
        setIsDirty(false);
        // show brief success state then navigate back
        setTimeout(() => setLocation("/lessons"), 500);
      }
    }
  });

  const handleStatusChange = (studentId: number, status: AttendanceRecordStatus) => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
    setIsDirty(true);
  };

  const handleSave = () => {
    const payload = Object.entries(records).map(([studentId, status]) => ({
      studentId: Number(studentId),
      status,
    }));
    saveMutation.mutate({ data: { lessonId, records: payload } });
  };

  if (isLoadingLesson || isLoadingStudents) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!lessonData || !students) return <div>Ошибка загрузки</div>;

  const { lesson } = lessonData;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <Button variant="ghost" onClick={() => setLocation("/lessons")} className="text-muted-foreground -ml-4 mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Назад к расписанию
      </Button>

      <div className="bg-gradient-to-br from-primary to-blue-700 rounded-3xl p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BookOpen className="w-32 h-32 transform rotate-12" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              {lesson.groupName}
            </span>
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              {format(new Date(lesson.date), "d MMMM yyyy", { locale: ru })}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold leading-tight mb-2">
            {lesson.subjectName}
          </h1>
          <p className="text-blue-100 text-lg opacity-90">{lesson.topic || "Тема не указана"}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/50 bg-muted/20 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-foreground">Список студентов ({students.length})</h2>
          <Button 
            onClick={handleSave} 
            disabled={!isDirty || saveMutation.isPending}
            className="rounded-xl shadow-lg transition-all"
            variant={isDirty ? "default" : "secondary"}
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Сохранить журнал
          </Button>
        </div>

        <div className="divide-y divide-border/50">
          {students.map((student, index) => {
            const currentStatus = records[student.id] || "present";
            return (
              <div key={student.id} className="p-4 sm:p-6 hover:bg-muted/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-base">
                      {student.lastName} {student.firstName} {student.middleName}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                  {(Object.keys(statusConfig) as AttendanceRecordStatus[]).map((status) => {
                    const config = statusConfig[status];
                    const isActive = currentStatus === status;
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(student.id, status)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200",
                          isActive ? config.active : config.color
                        )}
                      >
                        <config.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Sticky mobile save bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50">
        <Button 
          onClick={handleSave} 
          disabled={!isDirty || saveMutation.isPending}
          className="w-full h-12 rounded-xl text-base"
        >
          {saveMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
        </Button>
      </div>
    </div>
  );
}
