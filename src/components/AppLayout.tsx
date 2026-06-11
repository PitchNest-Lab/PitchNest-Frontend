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
  Menu,
  X,
  Download,
  Sparkles,
  MessageSquare,
  AlertCircle,
  Check,
  Trash2
} from 'lucide-react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '../lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { LogoLink, LogoMark } from './Logo';

const SidebarItem = ({ icon: Icon, label, path, active, onClick }: { icon: any, label: string, path: string, active: boolean, onClick?: () => void }) => (
  <Link to={path} onClick={onClick} className={cn(
    "flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
    active 
      ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-semibold" 
      : "text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:text-slate-700 dark:hover:text-zinc-200 font-medium"
  )}>
    <Icon size={18} strokeWidth={active ? 2.25 : 2} />
    <span className="text-sm">{label}</span>
  </Link>
);

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Install Choice: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };
  
  // 🔥 DATA FIX: Dynamic User Profile
  const [userData, setUserData] = useState<{name: string, email?: string, bio?: string, avatarUrl?: string}>({ name: "Founder" });

  const loadUserData = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try { setUserData(JSON.parse(storedUser)); } catch (e) {}
    }
  };

  useEffect(() => {
    loadUserData();
    window.addEventListener("userUpdate", loadUserData);
    return () => {
      window.removeEventListener("userUpdate", loadUserData);
    };
  }, []);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("notifications");
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch (e) {
        setNotifications([]);
      }
    } else {
      const defaultNotifications = [
        { id: "n1", title: "Pitch Evaluated", message: "Your pitch 'PitchNest' has been analyzed.", time: "2 hours ago", read: false, link: "/report", type: "report" },
        { id: "n2", title: "New AI Insight Available", message: "We have dynamic feedback regarding your market scalability.", time: "1 day ago", read: false, link: "/analytics", type: "insight" },
        { id: "n3", title: "Welcome to PitchNest", message: "Complete setup and invite your first VC panel to get started.", time: "3 days ago", read: true, link: "/setup", type: "alert" }
      ];
      setNotifications(defaultNotifications);
      localStorage.setItem("notifications", JSON.stringify(defaultNotifications));
    }
  }, []);

  const saveNotifications = (newNotifs: any[]) => {
    setNotifications(newNotifs);
    localStorage.setItem("notifications", JSON.stringify(newNotifs));
  };

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const handleClearAll = () => {
    saveNotifications([]);
  };

  const handleNotificationClick = (item: any) => {
    handleMarkAsRead(item.id);
    navigate(item.link);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
    <div className="flex min-h-screen bg-[#FAFBFC] dark:bg-[#09090B] font-sans transition-colors duration-300 overflow-x-hidden">
      
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
        "w-64 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-zinc-800/80 flex flex-col p-6 fixed h-full z-50 transition-all duration-300 ease-in-out lg:translate-x-0 lg:left-0",
        isMobileMenuOpen ? "translate-x-0 left-0" : "-translate-x-full"
      )}>
        
        {/* Sidebar Header with Close button for mobile */}
        <div className="flex justify-between items-center mb-10 shrink-0">
          <LogoLink showText size="md" />

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

        {isInstallable && (
          <div className="mt-4 p-4 bg-slate-50 dark:bg-zinc-800/30 border border-slate-200 dark:border-zinc-800 rounded-2xl text-center shrink-0">
            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mb-2">Get Desktop App</p>
            <button 
              type="button"
              onClick={handleInstallClick}
              className="w-full py-2 btn-primary text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={14} /> Install App
            </button>
          </div>
        )}

        <div className="mt-6 p-4 gradient-brand rounded-2xl text-white relative overflow-hidden group shrink-0">
          <div className="relative z-10">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">Pro Plan</span>
            <p className="text-xs mt-1 text-white font-medium">Unlimited analysis</p>
            <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className="mt-4 block w-full py-2 bg-white text-indigo-600 text-center text-xs font-semibold rounded-lg hover:bg-white/95 transition-colors">
              Manage subscription
            </Link>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
        </div>

        <div className="mt-6 flex items-center gap-3 p-2 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-800 shrink-0">
          <img 
            src={userData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`} 
            alt="Avatar" 
            className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-700 shadow-sm bg-sky-100 object-cover"
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
              <LogoMark size="sm" />
              <span className="font-bold text-slate-900 dark:text-zinc-100">PitchNest</span>
            </div>

            {/* User Avatar on mobile top header */}
            <div className="lg:hidden flex items-center gap-3">
              <ThemeToggle />
              <img 
                src={userData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full border border-slate-250 dark:border-zinc-800 bg-sky-100 object-cover"
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
              className="input-field pl-10 py-2.5 shadow-sm"
            />
          </div>

          {/* Desktop Right Header Tools */}
          <div className="hidden lg:flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-6">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="relative p-2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer outline-none">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-50 dark:border-zinc-950 animate-pulse" />
                    )}
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content 
                    align="end" 
                    sideOffset={10} 
                    className="min-w-[320px] max-w-[360px] bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 p-4 z-50 flex flex-col gap-3 outline-none"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">Notifications</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllAsRead} 
                          className="text-[10px] font-bold text-sky-500 hover:text-sky-600 cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-[280px] overflow-y-auto pr-1 custom-scrollbar flex flex-col gap-2">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 dark:text-zinc-600">
                          <Bell size={24} className="mx-auto mb-2 opacity-40" />
                          <p className="text-xs font-medium">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((item) => {
                          const Icon = item.type === 'report' ? Activity : item.type === 'insight' ? Sparkles : AlertCircle;
                          return (
                            <div 
                              key={item.id}
                              onClick={() => handleNotificationClick(item)}
                              className={cn(
                                "flex gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors relative border border-transparent",
                                !item.read && "bg-sky-50/40 dark:bg-sky-500/5 hover:border-sky-100 dark:hover:border-sky-500/20"
                              )}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                item.type === 'report' ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500" :
                                item.type === 'insight' ? "bg-sky-50 dark:bg-sky-950/20 text-sky-500" :
                                "bg-amber-50 dark:bg-amber-950/20 text-amber-500"
                              )}>
                                <Icon size={16} />
                              </div>
                              <div className="flex-1 min-w-0 font-sans">
                                <div className="flex justify-between items-start gap-1">
                                  <p className={cn("text-xs font-bold truncate text-slate-900 dark:text-zinc-100", !item.read && "text-sky-600 dark:text-sky-400")}>{item.title}</p>
                                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 shrink-0 mt-0.5">{item.time}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{item.message}</p>
                              </div>
                              {!item.read && (
                                <span className="absolute top-1/2 -translate-y-1/2 right-2 w-1.5 h-1.5 bg-sky-500 rounded-full shrink-0" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="border-t border-slate-100 dark:border-zinc-800 pt-2 flex justify-end">
                        <button 
                          onClick={handleClearAll} 
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 size={10} /> Clear all
                        </button>
                      </div>
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
              <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-zinc-800">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate max-w-[120px]">{userData.name}</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Founder</p>
                </div>
                <img 
                  src={userData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-700 shadow-sm bg-sky-100 object-cover"
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
