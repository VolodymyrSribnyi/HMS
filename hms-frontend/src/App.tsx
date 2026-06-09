import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { useAuthStore } from './features/auth/stores/authStore';
import { useEffect, useState } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { BookingsPage } from './features/bookings/BookingsPage';
import { apiClient } from './lib/axios';
import { RoomsPage } from './features/rooms/RoomsPage';
const DashboardPage = () => <div className="p-4"><h1>Панель управління готелем</h1></div>;

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />

        {isAuthenticated ? (
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App
