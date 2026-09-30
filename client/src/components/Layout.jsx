import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, Dumbbell, Images, Users, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Accueil', icon: Home, show: () => true },
  { to: '/sport', label: 'Sport', icon: Dumbbell, show: () => true },
  { to: '/photos', label: 'Photos', icon: Images, show: () => true },
  { to: '/annuaire', label: 'Annuaire', icon: Users, show: (hasRole) => hasRole('cadre') },
  { to: '/admin', label: 'Admin', icon: Shield, show: (hasRole, isAdmin) => isAdmin },
];

export function Layout() {
  const { user, hasRole, logout } = useAuth();
  const location = useLocation();

  const items = NAV_ITEMS.filter((item) => item.show(hasRole, user?.isAdmin));

  return (
    <div className="min-h-svh flex flex-col md:flex-row bg-base-950">
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-base-800 md:bg-base-900 md:p-6">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-accent-400">Section Armée</p>
          <p className="text-lg font-semibold text-base-100">422</p>
        </div>
        <nav className="flex-1 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-500/15 text-accent-300'
                    : 'text-base-400 hover:bg-base-800 hover:text-base-100'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-base-800 pt-4">
          <p className="truncate text-sm text-base-200">{user?.firstName} {user?.lastName}</p>
          <button
            onClick={logout}
            className="mt-2 flex items-center gap-2 text-sm text-base-400 hover:text-base-100"
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-base-800 bg-base-900/80 px-4 py-3 backdrop-blur md:hidden">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-accent-400">Section Armée</p>
            <p className="text-base font-semibold text-base-100">422</p>
          </div>
          <button onClick={logout} className="text-base-400">
            <LogOut size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="mx-auto w-full max-w-3xl px-4 py-6"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-base-800 bg-base-900/95 backdrop-blur md:hidden">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  isActive ? 'text-accent-400' : 'text-base-500'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
