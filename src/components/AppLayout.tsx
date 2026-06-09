import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Megaphone, 
  Activity, 
  Layers, 
  History, 
  Settings, 
  Bell,
  Search,
  LogOut,
  Rocket,
  Menu,
  X
} from 'lucide-react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';

const SidebarItem = ({ icon: Icon, label, path, active, onClick }: { icon: any, label: string, path: string, active: boolean, onClick?: () => void }) => (
  <Link to={path} onClick={onClick} className={cn(
    "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200",
    active 
      ? "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 font-medium" 
      : "text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:text-slate-700 dark:hover:text-zinc-200"
  )}>
    <Icon size={20} />
    <span className="text-sm">{label}</span>
  </Link>
);

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [logoError, setLogoError] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 🔥 DATA FIX: Dynamic User Profile
  const [userData, setUserData] = useState<{name: string, email?: string}>({ name: "Founder" });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try { setUserData(JSON.parse(storedUser)); } catch (e) {}
    }
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: PlusCircle, label: "Pre-Pitch Room", path: "/setup" },
    { icon: Megaphone, label: "My Pitches", path: "/archive" },
    { icon: Activity, label: "Analytics", path: "/analytics" },
    { icon: Layers, label: "Pitch Decks", path: "/decks" },
    { icon: History, label: "Pitch Replays", path: "/replay" },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans transition-colors duration-300 overflow-x-hidden">
      
      {/* Mobile Drawer Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )} 
        onClick={() => setIsMobileMenuOpen(false)} 
      />

      {/* Sidebar Drawer */}
      <aside className={cn(
        "w-64 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex flex-col p-6 fixed h-full z-50 transition-all duration-300 ease-in-out lg:translate-x-0 lg:left-0",
        isMobileMenuOpen ? "translate-x-0 left-0" : "-translate-x-full"
      )}>
        
        {/* Sidebar Header with Close button for mobile */}
        <div className="flex justify-between items-center mb-10 shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 flex items-center justify-center overflow-hidden rounded-xl",
              logoError && "bg-sky-500 text-white shadow-lg shadow-sky-200"
            )}>
              {!logoError ? (
                <img 
                  src="/logo.svg" 
                  alt="PitchNest Logo" 
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Rocket size={24} fill="currentColor" />
              )}
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">PitchNest</span>
          </Link>

          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <SidebarItem 
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              active={location.pathname === item.path}
              onClick={() => setIsMobileMenuOpen(false)}
            />
          ))}
          <div className="mt-auto">
            <SidebarItem 
              icon={Settings} 
              label="Settings" 
              path="/settings" 
              active={location.pathname === "/settings"}
              onClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </nav>

        <div className="mt-6 p-4 bg-gradient-to-br from-indigo-600 to-sky-500 rounded-2xl text-white relative overflow-hidden group shrink-0">
          <div className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Pro Plan</span>
            <p className="text-xs mt-1 text-white font-medium">Unlimited AI Analysis</p>
            <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className="mt-4 block w-full py-2 bg-white text-sky-600 text-center text-xs font-bold rounded-lg hover:bg-sky-50 transition-colors">
              Manage Subscription
            </Link>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
        </div>

        <div className="mt-6 flex items-center gap-3 p-2 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-800 shrink-0">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`} 
            alt="Avatar" 
            className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-700 shadow-sm bg-sky-100"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{userData.name}</p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium truncate">Founder Plan</p>
          </div>
          <button type="button" onClick={handleLogout} className="p-2 text-slate-400 dark:text-zinc-500 hover:text-rose-500 transition-colors cursor-pointer" aria-label="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col p-4 md:p-8 transition-all duration-300 w-full max-w-full overflow-x-hidden min-w-0">
        
        {/* Top Header */}
        <header className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-8 md:mb-10">
          <div className="flex items-center justify-between w-full md:w-auto">
            {/* Hamburger Button for mobile */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors cursor-pointer flex items-center justify-center"
            >
              <Menu size={22} />
            </button>

            {/* Logo in top header (visible on mobile only) */}
            <div className="lg:hidden flex items-center gap-2 mx-auto">
              <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg bg-sky-500 text-white shadow-md">
                <Rocket size={18} fill="currentColor" />
              </div>
              <span className="font-bold text-slate-900 dark:text-zinc-100">PitchNest</span>
            </div>

            {/* User Avatar on mobile top header */}
            <div className="lg:hidden flex items-center gap-3">
              <ThemeToggle />
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full border border-slate-250 dark:border-zinc-800 bg-sky-100"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Search bar - full-width on mobile, bounded on desktop */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={18} />
            <input 
              type="text" 
              placeholder="Search sessions, decks or reports..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-zinc-100 transition-all shadow-sm"
            />
          </div>

          {/* Desktop Right Header Tools */}
          <div className="hidden lg:flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-6">
              <button className="relative p-2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-50 dark:border-zinc-950" />
              </button>
              <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-zinc-800">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">{userData.name}</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Founder</p>
                </div>
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-700 shadow-sm bg-sky-100"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
