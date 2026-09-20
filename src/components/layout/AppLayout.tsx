import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  CheckSquare,
  DollarSign,
  BarChart3,
  ShieldCheck,
  Bell,
  LogOut,
  UserCheck,
  Building2,
  Users,
  ChevronDown,
  ExternalLink,
  Layers,
  FileSpreadsheet,
  RotateCcw,
  Landmark,
  Sparkles,
  Bot,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { UserRole } from '../../types';
import { AiAssistantDrawer } from '../ai/AiAssistantDrawer';

interface AppLayoutProps {
  currentView: string;
  activeAppId?: string | null;
  onNavigate: (view: string, param?: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ currentView, activeAppId, onNavigate, children }) => {
  const { user, logout, switchDemoRole } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, showToast } = useNotifications();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  const getRoleLabel = (role?: UserRole) => {
    switch (role) {
      case 'BENEFICIARY':
        return 'Beneficiary / Citizen';
      case 'FIELD_OFFICER':
        return 'Field Verification Officer';
      case 'DISTRICT_OFFICER':
        return 'District Welfare Officer';
      case 'FINANCE_APPROVER':
        return 'Finance & Sanction Director';
      case 'ADMIN':
        return 'System Administrator';
      default:
        return 'User';
    }
  };

  const getRoleBadgeColor = (role?: UserRole) => {
    switch (role) {
      case 'BENEFICIARY':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'FIELD_OFFICER':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'DISTRICT_OFFICER':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'FINANCE_APPROVER':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'ADMIN':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    setShowRoleSwitcher(false);
    await switchDemoRole(newRole);
    showToast(`Switched active portal view to: ${getRoleLabel(newRole)}`);
    // Redirect to relevant default dashboard
    if (newRole === 'BENEFICIARY') onNavigate('beneficiary-dashboard');
    else if (newRole === 'FIELD_OFFICER') onNavigate('field-officer-queue');
    else if (newRole === 'DISTRICT_OFFICER') onNavigate('district-officer-queue');
    else if (newRole === 'FINANCE_APPROVER') onNavigate('finance-dashboard');
    else if (newRole === 'ADMIN') onNavigate('admin-analytics');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col text-slate-900 font-sans">
      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Portal Branding */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => {
              if (user?.role === 'BENEFICIARY') onNavigate('beneficiary-dashboard');
              else if (user?.role === 'ADMIN') onNavigate('admin-analytics');
              else if (user?.role === 'FINANCE_APPROVER') onNavigate('finance-dashboard');
              else onNavigate('officer-queue');
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-700 to-blue-800 flex items-center justify-center text-white shadow-md">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                  GrantSetu
                </h1>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">
                  DBT PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-none">
                Digital Subsidy & Grant Administration Platform
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Role Switcher Button */}
            <div className="relative">
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-2xs hover:shadow-xs ${getRoleBadgeColor(
                  user?.role
                )}`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Role:</span>
                <span>{getRoleLabel(user?.role)}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {showRoleSwitcher && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-0 zoom-in-95">
                  <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch Role (Testing)
                    </p>
                    <p className="text-xs text-slate-500">View portal as any actor</p>
                  </div>
                  {(
                    [
                      'BENEFICIARY',
                      'FIELD_OFFICER',
                      'DISTRICT_OFFICER',
                      'FINANCE_APPROVER',
                      'ADMIN',
                    ] as UserRole[]
                  ).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleChange(r)}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        user?.role === r ? 'text-blue-700 bg-blue-50/70 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <span>{getRoleLabel(r)}</span>
                      {user?.role === r && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* AI Sahayak Header Button */}
            <button
              onClick={() => setIsAiDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-semibold shadow-xs transition-all hover:shadow hover:scale-[1.02] border border-white/20"
              title="Open GrantSetu AI Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">AI Sahayak</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-0 zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Notifications
                      </h4>
                      <p className="text-[11px] text-slate-500">{unreadCount} unread alerts</p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] text-blue-600 hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id);
                            if (n.link) {
                              const parts = n.link.split('/');
                              if (parts[1] === 'beneficiary' && parts[2] === 'applications') {
                                onNavigate('application-details', parts[3]);
                              } else if (parts[1] === 'officer') {
                                onNavigate(
                                  user?.role === 'FIELD_OFFICER'
                                    ? 'field-officer-queue'
                                    : 'district-officer-queue'
                                );
                              } else if (parts[1] === 'finance') {
                                onNavigate('finance-dashboard');
                              }
                              setShowNotifMenu(false);
                            }
                          }}
                          className={`p-3.5 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                            !n.isRead ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-slate-900">{n.title}</span>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile info */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-900 leading-tight">{user?.fullName}</p>
                <p className="text-[10px] text-slate-500 leading-none">{user?.region || 'National'}</p>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={() => {
                logout();
                onNavigate('login');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50 text-xs font-semibold transition-all shadow-2xs"
              title="Sign out of your account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar + View Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-1 sticky top-24">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {getRoleLabel(user?.role)} Workspace
            </div>

            {/* BENEFICIARY NAVIGATION */}
            {user?.role === 'BENEFICIARY' && (
              <>
                <button
                  onClick={() => onNavigate('beneficiary-dashboard')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    currentView === 'beneficiary-dashboard'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Beneficiary Dashboard
                </button>

                <button
                  onClick={() => onNavigate('schemes-catalog')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    currentView === 'schemes-catalog'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Available Schemes
                </button>

                <button
                  onClick={() => onNavigate('milestones-compliance')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    currentView === 'milestones-compliance'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  Milestones & Compliance
                </button>
              </>
            )}

            {/* FIELD OFFICER NAVIGATION */}
            {user?.role === 'FIELD_OFFICER' && (
              <>
                <button
                  onClick={() => onNavigate('field-officer-queue')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    currentView === 'field-officer-queue'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  Ground Verification Queue
                </button>

                <button
                  onClick={() => onNavigate('officer-history')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    currentView === 'officer-history'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Verification History
                </button>
              </>
            )}

            {/* DISTRICT OFFICER NAVIGATION */}
            {user?.role === 'DISTRICT_OFFICER' && (
              <>
                <button
                  onClick={() => onNavigate('district-officer-queue')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    currentView === 'district-officer-queue'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  District Scrutiny Queue
                </button>

                <button
                  onClick={() => onNavigate('officer-history')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    currentView === 'officer-history'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Sanction Records
                </button>
              </>
            )}

            {/* FINANCE APPROVER NAVIGATION */}
            {user?.role === 'FINANCE_APPROVER' && (
              <>
                <button
                  onClick={() => onNavigate('finance-dashboard')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    currentView === 'finance-dashboard'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Finance Sanction & Release
                </button>

                <button
                  onClick={() => onNavigate('finance-disbursements')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    currentView === 'finance-disbursements'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  Disbursement Tranches & Milestones
                </button>
              </>
            )}

            {/* ADMIN NAVIGATION */}
            {user?.role === 'ADMIN' && (
              <>
                <button
                  onClick={() => onNavigate('admin-analytics')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    currentView === 'admin-analytics'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics Hub
                </button>

                <button
                  onClick={() => onNavigate('admin-schemes')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    currentView === 'admin-schemes'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Scheme & Criteria Builder
                </button>

                <button
                  onClick={() => onNavigate('admin-applications')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    currentView === 'admin-applications'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  All Applications Registry
                </button>

                <button
                  onClick={() => onNavigate('admin-audit')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    currentView === 'admin-audit'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Audit Trail
                </button>

                <button
                  onClick={() => onNavigate('admin-reports')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    currentView === 'admin-reports'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Reports & PDF/Excel Export
                </button>
              </>
            )}

            {/* Quick Demo Reset & AI Sahayak launcher */}
            <div className="pt-4 mt-4 border-t border-slate-200 space-y-1">
              <button
                onClick={() => setIsAiDrawerOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 text-blue-900 hover:from-blue-100 hover:to-indigo-100 transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span>AI Sahayak Copilot</span>
                </div>
                <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                  AI
                </span>
              </button>

              <button
                onClick={() => onNavigate('schemes-catalog')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-medium"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Scheme Guidelines & Slabs
              </button>
            </div>
          </nav>
        </aside>

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Persistent Floating AI Launcher */}
      <button
        onClick={() => setIsAiDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-xl hover:shadow-2xl rounded-full pl-3.5 pr-4 py-3 flex items-center gap-2.5 transition-all hover:scale-105 group border border-white/20"
        title="Open GrantSetu AI Assistant"
      >
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-amber-300 group-hover:rotate-12 transition-transform shadow-inner">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold leading-tight flex items-center gap-1.5">
            AI Sahayak
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </p>
          <p className="text-[10px] text-blue-200/90 leading-none">Subsidy Copilot</p>
        </div>
      </button>

      {/* AI Assistant Slide-out Drawer */}
      <AiAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        currentView={currentView}
        activeAppId={activeAppId}
        onNavigate={onNavigate}
      />
    </div>
  );
};
