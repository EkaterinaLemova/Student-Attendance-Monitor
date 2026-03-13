import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout";

// Pages
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import GroupsPage from "@/pages/groups";
import StudentsPage from "@/pages/students";
import SubjectsPage from "@/pages/subjects";
import LessonsPage from "@/pages/lessons";
import AttendancePage from "@/pages/attendance";
import ReportsPage from "@/pages/reports";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background"><div className="animate-pulse w-8 h-8 rounded-full bg-primary/50"></div></div>;
  }

  if (!isAuthenticated) {
    window.location.href = `${import.meta.env.BASE_URL}login`;
    return null;
  }

  return (
    <AppLayout>
      <Component {...rest} />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      
      {/* Protected Routes wrapped in AppLayout */}
      <Route path="/">{(params) => <ProtectedRoute component={Dashboard} params={params} />}</Route>
      <Route path="/groups">{(params) => <ProtectedRoute component={GroupsPage} params={params} />}</Route>
      <Route path="/students">{(params) => <ProtectedRoute component={StudentsPage} params={params} />}</Route>
      <Route path="/subjects">{(params) => <ProtectedRoute component={SubjectsPage} params={params} />}</Route>
      <Route path="/lessons">{(params) => <ProtectedRoute component={LessonsPage} params={params} />}</Route>
      <Route path="/lessons/:id/attendance">{(params) => <ProtectedRoute component={AttendancePage} params={params} />}</Route>
      <Route path="/reports">{(params) => <ProtectedRoute component={ReportsPage} params={params} />}</Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
