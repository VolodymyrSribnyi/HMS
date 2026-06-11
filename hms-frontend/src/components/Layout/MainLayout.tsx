import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/stores/authStore';

const itemShadow = 'shadow-[6px_6px_12px_rgba(163,177,198,0.35),-6px_-6px_12px_rgba(255,255,255,0.85)]';
const activeShadow = 'shadow-[inset_5px_5px_10px_rgba(163,177,198,0.35),inset_-5px_-5px_10px_rgba(255,255,255,0.85)]';

export const MainLayout = () => {
  const location = useLocation();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const roles = useAuthStore((state) => state.roles);
  const [isAdminOpen, setIsAdminOpen] = useState(location.pathname.startsWith('/admin'));

  const isActive = (path: string) => location.pathname.startsWith(path);
  const hasRole = (role: string) => roles.some((userRole) => userRole.toLowerCase() === role.toLowerCase());

  const isAdmin = hasRole('Admin');
  const showBookings = isAdmin || hasRole('Guest') || hasRole('Receptionist');
  const showGuestPages = isAdmin || hasRole('Guest');
  const showReception = isAdmin || hasRole('Receptionist');
  const showHousekeeping = isAdmin || hasRole('Maid');
  const showReports = isAdmin || hasRole('Accountant');

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      setIsAdminOpen(true);
    }
  }, [location.pathname]);

  const navClassName = (path: string) =>
    `block rounded-2xl px-4 py-3 transition-all duration-200 ${
      isActive(path)
        ? `bg-[#edf1f7] font-semibold text-[#4f7cff] ${activeShadow}`
        : `bg-[#edf1f7] text-[#718096] hover:scale-[1.01] hover:text-[#2d3748] ${itemShadow}`
    }`;

  return (
    <div className="flex min-h-screen bg-[#e8ecf2]">
      <aside className="flex w-64 flex-col bg-[#edf1f7] shadow-[8px_8px_16px_rgba(163,177,198,0.45),-8px_-8px_16px_rgba(255,255,255,0.9)]">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[#4f7cff]">HMS Admin</h1>
        </div>

        <nav className="flex-1 space-y-3 p-4">
          {isAdmin && (
            <Link to="/dashboard" className={navClassName('/dashboard')}>
              Панель управління
            </Link>
          )}

          {showBookings && (
            <Link to="/bookings" className={navClassName('/bookings')}>
              {showReception && !hasRole('Guest') ? 'Бронювання' : 'Мої бронювання'}
            </Link>
          )}

          {showGuestPages && (
            <>
              <Link to="/guest/search" className={navClassName('/guest')}>
                Знайти номер
              </Link>
            </>
          )}

          {showReception && (
            <Link to="/reception" className={navClassName('/reception')}>
              Рецепція
            </Link>
          )}

          {showHousekeeping && (
            <Link to="/housekeeping/tasks" className={navClassName('/housekeeping')}>
              Прибирання
            </Link>
          )}

          {showReports && (
            <Link to="/reports" className={navClassName('/reports')}>
              Звіти
            </Link>
          )}

          {isAdmin && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsAdminOpen((current) => !current)}
                className={`flex w-full items-center justify-between rounded-2xl bg-[#edf1f7] px-4 py-3 text-left font-semibold transition-all duration-200 ${
                  isActive('/admin') ? `text-[#4f7cff] ${activeShadow}` : `text-[#718096] hover:text-[#2d3748] ${itemShadow}`
                }`}
              >
                <span>Admin</span>
                <span className="text-sm">{isAdminOpen ? '▲' : '▼'}</span>
              </button>

              {isAdminOpen && (
                <div className="space-y-2 pl-4">
                  <Link to="/admin/rooms" className={navClassName('/admin/rooms')}>
                    Керування номерами
                  </Link>
                  <Link to="/admin/room-types" className={navClassName('/admin/room-types')}>
                    Типи номерів
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="p-4">
          <button
            onClick={clearAuth}
            className={`w-full rounded-2xl bg-[#edf1f7] px-4 py-3 text-left font-medium text-[#e45858] transition-all hover:scale-[1.01] ${itemShadow}`}
          >
            Вийти з системи
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};
