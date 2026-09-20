import React, { useState } from 'react';
import {
  Landmark,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  CheckSquare,
  DollarSign,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface LoginPageProps {
  onLoginSuccess: (role: UserRole) => void;
}

interface DemoAccount {
  role: UserRole;
  title: string;
  roleBadge: string;
  badgeColor: string;
  name: string;
  username: string;
  email: string;
  destination: string;
  icon: React.ReactNode;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'BENEFICIARY',
    title: 'Beneficiary / Citizen',
    roleBadge: 'Beneficiary',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    name: 'Priya Sharma',
    username: 'beneficiary',
    email: 'beneficiary@gov.in',
    destination: 'Beneficiary Dashboard (Track, Apply & Milestones)',
    icon: <User className="w-4 h-4 text-emerald-600" />,
  },
  {
    role: 'FIELD_OFFICER',
    title: 'Field Verification Officer',
    roleBadge: 'Field Officer',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    name: 'Rajesh Kumar',
    username: 'field_officer',
    email: 'field@gov.in',
    destination: 'Field Officer Queue (Ground Inspections & Checklists)',
    icon: <Search className="w-4 h-4 text-amber-600" />,
  },
  {
    role: 'DISTRICT_OFFICER',
    title: 'District Welfare Officer',
    roleBadge: 'District Officer',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    name: 'Dr. Ananya Verma',
    username: 'district_officer',
    email: 'district@gov.in',
    destination: 'District Scrutiny Desk (Approval, Endorsement & Revisions)',
    icon: <CheckSquare className="w-4 h-4 text-blue-600" />,
  },
  {
    role: 'FINANCE_APPROVER',
    title: 'Finance & Sanction Director',
    roleBadge: 'Finance Approver',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    name: 'Vikram Sengupta',
    username: 'finance_officer',
    email: 'finance@gov.in',
    destination: 'Finance Sanctions & DBT Disbursement Releases',
    icon: <DollarSign className="w-4 h-4 text-purple-600" />,
  },
  {
    role: 'ADMIN',
    title: 'System Administrator',
    roleBadge: 'Admin',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    name: 'Sunil Mehta, IAS',
    username: 'admin',
    email: 'admin@gov.in',
    destination: 'Admin Analytics, Scheme Rules & Audit Logs',
    icon: <Settings className="w-4 h-4 text-rose-600" />,
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('beneficiary@gov.in');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!emailOrUsername || !password) {
      setError('Please enter your email or username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login(emailOrUsername, password);
      onLoginSuccess(loggedUser.role);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (account: DemoAccount) => {
    setEmailOrUsername(account.email);
    setPassword('password123');
    setError(null);
    setIsSubmitting(true);
    try {
      const loggedUser = await login(account.email, 'password123');
      onLoginSuccess(loggedUser.role);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-700 text-white shadow-md mb-3">
            <Landmark className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">GrantSetu</h1>
          <p className="text-sm text-slate-500 mt-1">
            Digital Subsidy & Grant Administration Platform
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Sign In to Your Account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Access your role-based workspace or click any role below to test instantly.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="e.g. beneficiary@gov.in or beneficiary"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-hidden"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <span className="text-[11px] text-slate-400">Default: password123</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In to Portal
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Role Selection */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800">
                Or Quick Login as Any Role:
              </span>
              <span className="text-[11px] text-slate-400">Click to open dashboard</span>
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  disabled={isSubmitting}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-white">
                      {acc.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{acc.name}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${acc.badgeColor}`}
                        >
                          {acc.roleBadge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-none">
                        {acc.email} • {acc.destination}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
