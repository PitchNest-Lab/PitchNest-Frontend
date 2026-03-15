import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Shield, 
  CreditCard, 
  Sparkles, 
  Bell, 
  Lock, 
  CheckCircle2,
  Globe,
  Edit3,
  Users,
  LogOut
} from 'lucide-react';
import * as Switch from '@radix-ui/react-switch';
import * as Tabs from '@radix-ui/react-tabs';
import { cn } from '../lib/utils';

// --- Subcomponents ---
const SettingSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 border-b border-slate-100 dark:border-zinc-800 pb-4">{title}</h3>
    {children}
  </div>
);

const SettingItem = ({ label, description, children }: { label: string, description?: string, children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-2">
    <div className="max-w-md pr-4">
      <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">{label}</p>
      {description && <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">{description}</p>}
    </div>
    {children}
  </div>
);

// --- Main Component ---
export default function SettingsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    pitchAlerts: true,
    weeklyReport: false,
    investorInquiries: true
  });
  
  const [aiToughness, setAiToughness] = useState(85);
  const [activeSector, setActiveSector] = useState("Venture Capital");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  const [userData, setUserData] = useState<{name: string, email?: string}>({ 
    name: "Founder", 
    email: "founder@pitchnest.io" 
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try { 
        setUserData(JSON.parse(storedUser)); 
      } catch (e) {}
    }
  }, []);

  // 🔥 FIX: Added full Logout handler to clear local storage and redirect
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate('/login');
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-2">Settings</h1>
        <p className="text-slate-500 dark:text-zinc-500">Manage your account, billing, and AI customization.</p>
      </div>

      <Tabs.Root defaultValue="profile" className="flex flex-col md:flex-row gap-12">
        <Tabs.List className="flex flex-row md:flex-col gap-1 w-full md:w-64 shrink-0 overflow-x-auto pb-4 md:pb-0 custom-scrollbar">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "account", label: "Account", icon: Shield },
            { id: "subscription", label: "Subscription", icon: CreditCard },
            { id: "ai", label: "AI Preferences", icon: Sparkles },
            { id: "notifications", label: "Notifications", icon: Bell },
          ].map((tab) => (
            <Tabs.Trigger 
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 dark:text-zinc-400 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-sky-600 dark:data-[state=active]:text-sky-400 data-[state=active]:shadow-sm transition-all text-left whitespace-nowrap outline-none"
            >
              <tab.icon size={18} />
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="flex-1 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 md:p-10 shadow-sm min-h-[600px] transition-colors">
          
          {/* PROFILE TAB */}
          <Tabs.Content value="profile" className="space-y-10 outline-none flex flex-col h-full">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Profile Details</h2>
              <button className="text-sm font-bold text-sky-500 hover:text-sky-600 flex items-center gap-1 transition-colors active:scale-95">
                <Edit3 size={14} />
                Edit Profile
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 dark:bg-zinc-800/50 rounded-[32px] transition-colors">
              <div className="relative shrink-0">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`} 
                  className="w-24 h-24 rounded-full border-4 border-white dark:border-zinc-800 shadow-lg bg-sky-100"
                  alt="Profile Avatar"
                />
                <button className="absolute bottom-0 right-0 p-2 bg-white dark:bg-zinc-900 rounded-full shadow-md text-slate-400 dark:text-zinc-500 hover:text-sky-500 transition-colors border border-slate-100 dark:border-zinc-800 active:scale-95">
                  <Edit3 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 flex-1 w-full">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Full Name</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">{userData.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Email Address</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">{userData.email || "No email provided"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Founder Bio</p>
                  <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                    Building the next generation of AI-driven tools for venture building. Focused on creating scalable technologies and empowering startups to nail their stories and secure funding.
                  </p>
                </div>
              </div>
            </div>

            {/* 🔥 FIX: Added Sign Out button at the bottom of the profile tab */}
            <div className="mt-auto pt-10 flex justify-end border-t border-slate-100 dark:border-zinc-800">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 font-bold text-sm rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors active:scale-95"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </Tabs.Content>

          {/* ACCOUNT TAB */}
          <Tabs.Content value="account" className="space-y-10 outline-none">
            <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Account Security</h2>
            <SettingSection title="Security Settings">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 dark:border-zinc-800 rounded-2xl gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-zinc-500 shrink-0">
                      <Lock size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">Password</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-500">Last changed 3 months ago</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors w-full sm:w-auto active:scale-95">
                    Change Password
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 dark:border-zinc-800 rounded-2xl gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      twoFactorEnabled ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500" : "bg-slate-50 dark:bg-zinc-800 text-slate-400"
                    )}>
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">Two-factor Authentication</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-500">
                        {twoFactorEnabled ? "Active via Authenticator App" : "Not configured"}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className={cn(
                      "px-4 py-2 text-xs font-bold rounded-lg transition-colors w-full sm:w-auto active:scale-95",
                      twoFactorEnabled 
                        ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40" 
                        : "bg-sky-50 dark:bg-sky-900/20 text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-900/40"
                    )}
                  >
                    {twoFactorEnabled ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            </SettingSection>
          </Tabs.Content>

          {/* SUBSCRIPTION TAB */}
          <Tabs.Content value="subscription" className="space-y-10 outline-none">
            <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Subscription</h2>
            
            <div className="bg-gradient-to-br from-indigo-600 to-sky-500 rounded-[32px] p-8 sm:p-10 text-white relative overflow-hidden shadow-xl shadow-sky-500/20">
              <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Active Plan</span>
                  <h3 className="text-4xl font-bold mt-2 mb-1">Founder Pro</h3>
                  <p className="text-white/80 text-sm">Next billing on June 15, 2026</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-4xl font-bold">$49<span className="text-lg font-medium">/mo</span></p>
                  <p className="text-white/70 text-xs mt-1">Billed monthly</p>
                </div>
              </div>
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-widest">Plan Features</h4>
                <ul className="space-y-4">
                  {[
                    { text: "Unlimited AI Pitch Reviews", active: true },
                    { text: "Full Analytics Dashboard", active: true },
                    { text: "Priority Support (Scale Plan)", active: false }
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-zinc-400">
                      <CheckCircle2 size={18} className={!feature.active ? "text-slate-300 dark:text-zinc-700" : "text-emerald-500 dark:text-emerald-400"} />
                      {feature.text}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3 justify-center">
                <button className="w-full py-4 bg-sky-500 text-white font-bold rounded-2xl shadow-xl shadow-sky-200 dark:shadow-sky-500/10 hover:bg-sky-600 transition-all active:scale-95">
                  Upgrade to Scale
                </button>
                <button className="w-full py-4 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all active:scale-95">
                  Manage Billing
                </button>
              </div>
            </div>
          </Tabs.Content>

          {/* AI PREFERENCES TAB */}
          <Tabs.Content value="ai" className="space-y-10 outline-none">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">AI Preferences</h2>
              <span className="px-2 py-1 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-[10px] font-bold uppercase rounded">Beta</span>
            </div>

            <SettingSection title="Global Investor Persona 'Toughness'">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-600 dark:text-zinc-400">How critical should the AI feedback be by default?</p>
                  <span className="text-sm font-bold text-sky-500">
                    {aiToughness < 33 ? 'Supportive' : aiToughness < 66 ? 'Balanced' : 'Aggressive'}
                  </span>
                </div>
                
                <div className="relative h-2 bg-slate-100 dark:bg-zinc-800 rounded-full">
                  <div className="absolute top-0 left-0 h-full bg-sky-500 rounded-full transition-all" style={{ width: `${aiToughness}%` }} />
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={aiToughness}
                    onChange={(e) => setAiToughness(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-zinc-100 border-2 border-sky-500 rounded-full shadow-md pointer-events-none" 
                    style={{ left: `calc(${aiToughness}% - 8px)` }} 
                  />
                </div>
                
                <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                  <span>Supportive</span>
                  <span>Balanced</span>
                  <span>Aggressive</span>
                </div>
              </div>
            </SettingSection>

            <SettingSection title="Default Sector Expertise Profile">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Venture Capital", icon: CreditCard },
                  { label: "Angel Investor", icon: Users },
                  { label: "Strategic Corporate", icon: Globe }
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => setActiveSector(item.label)}
                    className={cn(
                      "p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center",
                      activeSector === item.label 
                        ? "border-sky-500 bg-sky-50/50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400" 
                        : "border-slate-100 dark:border-zinc-800 hover:border-slate-200 dark:hover:border-zinc-700 text-slate-500 dark:text-zinc-500"
                    )}
                  >
                    <item.icon size={24} />
                    <span className="text-xs font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
            </SettingSection>
          </Tabs.Content>

          {/* NOTIFICATIONS TAB */}
          <Tabs.Content value="notifications" className="space-y-10 outline-none">
            <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Notifications</h2>
            
            <div className="space-y-8">
              <SettingItem 
                label="Pitch Analysis Alerts" 
                description="Email when your pitch analysis is ready."
              >
                <Switch.Root 
                  checked={notifications.pitchAlerts}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, pitchAlerts: checked }))}
                  className="w-11 h-6 bg-slate-200 dark:bg-zinc-800 rounded-full relative data-[state=checked]:bg-sky-500 transition-colors cursor-pointer outline-none"
                >
                  <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow-sm transition-transform translate-x-1 data-[state=checked]:translate-x-6" />
                </Switch.Root>
              </SettingItem>

              <SettingItem 
                label="Weekly Progress Report" 
                description="Summary of your improvement and deck views."
              >
                <Switch.Root 
                  checked={notifications.weeklyReport}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyReport: checked }))}
                  className="w-11 h-6 bg-slate-200 dark:bg-zinc-800 rounded-full relative data-[state=checked]:bg-sky-500 transition-colors cursor-pointer outline-none"
                >
                  <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow-sm transition-transform translate-x-1 data-[state=checked]:translate-x-6" />
                </Switch.Root>
              </SettingItem>

              <SettingItem 
                label="Investor Inquiries" 
                description="In-app notifications when an investor requests access."
              >
                <Switch.Root 
                  checked={notifications.investorInquiries}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, investorInquiries: checked }))}
                  className="w-11 h-6 bg-slate-200 dark:bg-zinc-800 rounded-full relative data-[state=checked]:bg-sky-500 transition-colors cursor-pointer outline-none"
                >
                  <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow-sm transition-transform translate-x-1 data-[state=checked]:translate-x-6" />
                </Switch.Root>
              </SettingItem>
            </div>
          </Tabs.Content>

        </div>
      </Tabs.Root>
    </div>
  );
}