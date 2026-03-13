import { useGetStats } from "@workspace/api-client-react";
import { Users, BookOpen, CalendarCheck, TrendingUp, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function Dashboard() {
  const { data: stats, isLoading, error } = useGetStats();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-md mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-card rounded-2xl border border-border"></div>)}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Не удалось загрузить данные</h2>
        <p className="text-muted-foreground mt-2">Попробуйте обновить страницу</p>
      </div>
    );
  }

  const statCards = [
    { title: "Всего студентов", value: stats.totalStudents, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Учебных групп", value: stats.totalGroups, icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { title: "Проведено занятий", value: stats.totalLessons, icon: CalendarCheck, color: "text-purple-500", bg: "bg-purple-500/10" },
    { 
      title: "Средняя посещаемость", 
      value: `${stats.averageAttendanceRate}%`, 
      icon: TrendingUp, 
      color: stats.averageAttendanceRate > 80 ? "text-emerald-500" : "text-amber-500", 
      bg: stats.averageAttendanceRate > 80 ? "bg-emerald-500/10" : "bg-amber-500/10"
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Главная</h1>
        <p className="text-muted-foreground mt-1">Обзорная статистика и текущая ситуация</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Lessons */}
        <Card className="border-border/50 shadow-sm col-span-1">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Недавние занятия
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {stats.recentLessons.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">Нет данных о занятиях</div>
              ) : (
                stats.recentLessons.map(lesson => (
                  <div key={lesson.id} className="p-4 hover:bg-muted/30 transition-colors flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-foreground">{lesson.subjectName}</p>
                      <p className="text-sm text-muted-foreground flex gap-2 items-center mt-1">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">{lesson.groupName}</span>
                        <span>{lesson.topic}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(new Date(lesson.date), "d MMM yyyy", { locale: ru })}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize mt-1">{lesson.lessonType}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Attendance Alert */}
        <Card className="border-destructive/20 shadow-sm col-span-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-bl-full -z-10" />
          <CardHeader className="border-b border-border/50 bg-destructive/5">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Низкая посещаемость
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {stats.lowAttendanceStudents.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">Отстающих студентов не найдено. Отлично!</div>
              ) : (
                stats.lowAttendanceStudents.map(student => (
                  <div key={student.studentId} className="p-4 hover:bg-muted/30 transition-colors flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-foreground">{student.studentName}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Пропущено: <span className="font-medium text-destructive">{student.absent}</span> из {student.totalLessons} занятий
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="w-16 h-16 rounded-full border-4 border-destructive/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-destructive">{Math.round(student.attendanceRate)}%</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
