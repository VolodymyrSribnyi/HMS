import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { useAuthStore } from './features/auth/stores/authStore';
import { useEffect, useState, type ReactNode } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { BookingsPage } from './features/bookings/BookingsPage';
import { apiClient } from './lib/axios';
import { RoomsPage } from './features/rooms/RoomsPage';
import { SearchRoomsPage } from './features/guest/SearchRoomsPage';
import { CreateBookingPage } from './features/guest/CreateBookingPage';
import { ReceptionDashboardPage } from './features/reception/ReceptionDashboardPage';
import { CleaningTasksPage } from './features/housekeeping/CleaningTasksPage';
import { AdminRoomsPage } from './features/admin/AdminRoomsPage';
const DashboardPage = () => <div className="p-4"><h1>Панель управління готелем</h1></div>;

interface RoleRouteProps {
  allowedRoles: string[];
  fallbackPath: string;
  roles: string[];
  children: ReactNode;
}

const RoleRoute = ({ allowedRoles, fallbackPath, roles, children }: RoleRouteProps) => {
  const hasRole = (role: string) => roles.some((userRole) => userRole.toLowerCase() === role.toLowerCase());
  const canAccess = hasRole('Admin') || allowedRoles.some(hasRole);
  return canAccess ? children : <Navigate to={fallbackPath} replace />;
};

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const roles = useAuthStore((state) => state.roles);
  const setToken = useAuthStore((state) => state.setToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [isInitializing,setIsInitializing] = useState(true);

  useEffect(() => {
    const attemptSilentRefresh = async () => {
      try {
        const {data} = await apiClient.post('/auth/refresh');
        setToken(data.accessToken);
      } catch (error) {
        clearAuth();
      } finally {
        setIsInitializing(false);
      }
    };
    attemptSilentRefresh();
  },[clearAuth, setToken]);

  if(isInitializing){
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-xl font-semibold text-slate-500 animate-pulse">
          Session verification...
        </div>
      </div>
    )
  }

  const hasRole = (role: string) => roles.some((userRole) => userRole.toLowerCase() === role.toLowerCase());
  const fallbackPath = hasRole('Admin')
    ? '/dashboard'
    : hasRole('Receptionist')
      ? '/reception'
      : hasRole('Maid')
        ? '/housekeeping/tasks'
        : '/bookings';

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />

        {isAuthenticated ? (
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={
              <RoleRoute allowedRoles={['Admin']} fallbackPath={fallbackPath} roles={roles}>
                <DashboardPage />
              </RoleRoute>
            } />
            <Route path="/bookings" element={
              <RoleRoute allowedRoles={['Guest']} fallbackPath={fallbackPath} roles={roles}>
                <BookingsPage />
              </RoleRoute>
            } />
            <Route path="/guest/search" element={
              <RoleRoute allowedRoles={['Guest']} fallbackPath={fallbackPath} roles={roles}>
                <SearchRoomsPage />
              </RoleRoute>
            } />
            <Route path="/guest/book/:roomId" element={
              <RoleRoute allowedRoles={['Guest']} fallbackPath={fallbackPath} roles={roles}>
                <CreateBookingPage />
              </RoleRoute>
            } />
            <Route path="/reception" element={
              <RoleRoute allowedRoles={['Receptionist']} fallbackPath={fallbackPath} roles={roles}>
                <ReceptionDashboardPage />
              </RoleRoute>
            } />
            <Route path="/housekeeping/tasks" element={
              <RoleRoute allowedRoles={['Maid']} fallbackPath={fallbackPath} roles={roles}>
                <CleaningTasksPage />
              </RoleRoute>
            } />
            <Route path="/admin/rooms" element={
              <RoleRoute allowedRoles={['Admin']} fallbackPath={fallbackPath} roles={roles}>
                <AdminRoomsPage />
              </RoleRoute>
            } />
            <Route path="/admin/room-types" element={
              <RoleRoute allowedRoles={['Admin']} fallbackPath={fallbackPath} roles={roles}>
                <RoomsPage />
              </RoleRoute>
            } />
            <Route path="/rooms" element={<Navigate to="/admin/room-types" />} />
            <Route path="*" element={<Navigate to={fallbackPath} />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App
