import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, DollarSign, Receipt, Users, FileText,
  Menu, X, Droplets, BarChart2, Settings, LogOut, Loader2
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const navItems = [
  { to: '/',         icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/revenue',  icon: DollarSign,      label: 'Recettes' },
  { to: '/expenses', icon: Receipt,         label: 'Dépenses' },
  { to: '/clients',  icon: Users,           label: 'Clients entreprises' },
  { to: '/invoices', icon: FileText,        label: 'Factures' },
  { to: '/reports',  icon: BarChart2,       label: 'Relevés' },
  { to: '/settings', icon: Settings,        label: 'Paramètres' },
];

export default function Layout({ children }) {
  const { user, signOut }   = useAuth();
  const { dataLoading }     = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut,  setSigningOut]  = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try { await signOut(); } catch { /* ignore */ }
    setSigningOut(false);
  }

  // Get initials from email
  const initials = user?.email ? user.email[0].toUpperCase() : 'A';

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30
        flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-[#D97757] flex items-center justify-center">
            <Droplets size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-none">LavagePro</p>
            <p className="text-xs text-gray-400 mt-0.5">Système de gestion</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-[#FDF1EC] text-[#D97757]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Sign Out */}
        <div className="px-4 py-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-full bg-[#D97757] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>
            <span className="text-xs text-gray-600 truncate flex-1">{user?.email}</span>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {signingOut
              ? <Loader2 size={15} className="animate-spin" />
              : <LogOut size={15} />
            }
            {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 lg:px-8 h-14 flex items-center gap-4">
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          <div className="flex-1" />
          {dataLoading && (
            <Loader2 size={16} className="text-[#D97757] animate-spin" />
          )}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#D97757] flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {user?.email?.split('@')[0]}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
