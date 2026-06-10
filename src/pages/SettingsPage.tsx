import React, { useState, useEffect, useRef } from 'react';
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
  LogOut,
  Trash2,
  AlertTriangle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import * as Switch from '@radix-ui/react-switch';
import * as Tabs from '@radix-ui/react-tabs';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

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
  const { logout, authFetch } = useAuth();
  const [notifications, setNotifications] = useState({
    pitchAlerts: true,
    weeklyReport: false,
    investorInquiries: true
  });
  
  const [aiToughness, setAiToughness] = useState(85);
  const [activeSector, setActiveSector] = useState("Venture Capital");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  const [userData, setUserData] = useState<{name: string, email?: string, bio?: string, avatarUrl?: string}>({ 
    name: "Founder", 
    email: "founder@pitchnest.io",
    bio: "Building the next generation of AI-driven tools for venture building. Focused on creating scalable technologies and empowering startups to nail their stories and secure funding."
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editBio, setEditBio] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try { 
        const parsed = JSON.parse(storedUser);
        setUserData(prev => ({
          ...prev,
          ...parsed,
          bio: parsed.bio || prev.bio
        })); 
      } catch (e) {}
    }
  }, []);

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditName(userData.name);
      setEditEmail(userData.email || "");
      setEditBio(userData.bio || "");
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = () => {
    const updated = {
      ...userData,
      name: editName,
      email: editEmail,
      bio: editBio
    };
    setUserData(updated);
    localStorage.setItem("user", JSON.stringify(updated));
    window.dispatchEvent(new Event("userUpdate"));
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const updated = {
        ...userData,
        avatarUrl: base64String
      };
      setUserData(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      window.dispatchEvent(new Event("userUpdate"));
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deleteConfirmed) {
      setDeleteError('Please confirm you understand this is permanent.');
      return;
    }
    if (!deletePassword) {
      setDeleteError('Enter your password to confirm deletion.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await authFetch('/api/auth/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete account.');
      logout();
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account.');
    } finally {
      setIsDeleting(false);
    }
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
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Profile Details</h2>
              {!isEditing && (
                <button 
                  onClick={handleEditToggle}
                  className="text-sm font-bold text-sky-500 hover:text-sky-600 flex items-center gap-1 transition-colors active:scale-95 cursor-pointer"
                >
                  <Edit3 size={14} />
                  Edit Profile
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 dark:bg-zinc-800/50 rounded-[32px] transition-colors">
              <div className="relative shrink-0">
                <img 
                  src={userData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`} 
                  className="w-24 h-24 rounded-full border-4 border-white dark:border-zinc-800 shadow-lg bg-sky-100 object-cover"
                  alt="Profile Avatar"
                />
                <button 
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 p-2 bg-white dark:bg-zinc-900 rounded-full shadow-md text-slate-400 dark:text-zinc-500 hover:text-sky-500 transition-colors border border-slate-100 dark:border-zinc-800 active:scale-95 cursor-pointer"
                >
                  <Edit3 size={14} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 flex-1 w-full">
                {isEditing ? (
                  <>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Full Name</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Email Address</label>
                      <input 
                        type="email" 
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Founder Bio</label>
                      <textarea 
                        rows={4}
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 resize-none leading-relaxed"
                        placeholder="Tell investors about yourself..."
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveProfile}
                        className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </div>
                  </>
                ) : (
                  <>
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
                        {userData.bio}
                      </p>
                    </div>
                  </>
                )}
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
                  <Link
                    to="/forgot-password"
                    className="px-4 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors w-full sm:w-auto active:scale-95 inline-block text-center"
                  >
                    Change Password
                  </Link>
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

            <SettingSection title="Privacy & Legal">
              <div className="space-y-2">
                {[
                  { to: '/privacy', label: 'Privacy Policy' },
                  { to: '/terms', label: 'Terms of Service' },
                  { to: '/support', label: 'Support' },
                  { to: '/delete-account', label: 'Delete Account (web)' },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center justify-between p-4 border border-slate-100 dark:border-zinc-800 rounded-2xl hover:border-sky-200 dark:hover:border-sky-700 transition-colors"
                  >
                    <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">{item.label}</span>
                    <ExternalLink size={16} className="text-slate-400" />
                  </Link>
                ))}
              </div>
            </SettingSection>

            <SettingSection title="Delete Account">
              <div className="p-5 border border-rose-100 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl space-y-4">
                <div className="flex gap-3">
                  <AlertTriangle className="text-rose-500 shrink-0" size={20} />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">Permanently delete your account</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 leading-relaxed">
                      Removes your profile, pitch sessions, decks, and recordings. Active App Store / Play subscriptions must be cancelled separately in your device settings.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(true);
                    setDeletePassword('');
                    setDeleteConfirmed(false);
                    setDeleteError('');
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={16} /> Delete Account
                </button>
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

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-2">Delete Account</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-500 mb-4">
              This cannot be undone. All your pitch data will be permanently removed.
            </p>
            {deleteError && (
              <p className="text-sm text-rose-600 font-medium mb-3">{deleteError}</p>
            )}
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">Password</label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full px-4 py-3 mb-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm"
              placeholder="Confirm your password"
              autoComplete="current-password"
            />
            <label className="flex items-start gap-2 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteConfirmed}
                onChange={(e) => setDeleteConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-xs text-slate-600 dark:text-zinc-400">
                I understand this permanently deletes my account and data.
              </span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-slate-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={16} /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}