import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/stores/authStore';

export const MainLayout = () => {
    const location = useLocation();
    const clearAuth = useAuthStore((state) => state.clearAuth);

    const isActive = (path: string) => location.pathname.startsWith(path);
    return(
        <div className="flex min-h-screen bg-slate-50">
      {/* Бокове меню (Sidebar) */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-blue-600">HMS Admin</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/dashboard"
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive('/dashboard') 
                ? 'bg-blue-50 text-blue-700 font-semibold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Панель управління
          </Link>
          <Link
            to="/bookings"
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive('/bookings') 
                ? 'bg-blue-50 text-blue-700 font-semibold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Мої бронювання
          </Link>
          <Link
            to="/rooms"
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive('/rooms') 
                ? 'bg-blue-50 text-blue-700 font-semibold' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Номерний фонд
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={clearAuth}
            className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            Вийти з системи
          </button>
        </div>
      </aside>

      {/* Основна робоча зона */}
      <main className="flex-1 p-8">
        {/* Outlet - це магічний компонент React Router, сюди буде підставлятися сторінка (Dashboard, Bookings тощо) */}
        <Outlet /> 
      </main>
    </div>
    )
}
