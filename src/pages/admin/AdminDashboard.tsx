import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Layers,
  FileText,
  ShieldCheck,
  FileSpreadsheet,
  RotateCcw,
  Plus,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  Building,
  DollarSign,
  Users,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { AnalyticsSummary, Scheme, Application, AuditLog } from '../../types';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';

interface AdminDashboardProps {
  initialTab?: string;
  onNavigate: (view: string, param?: string) => void;
}

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialTab = 'ANALYTICS', onNavigate }) => {
  const { showToast } = useNotifications();
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'SCHEMES' | 'APPLICATIONS' | 'AUDIT' | 'REPORTS'>(
    initialTab as any || 'ANALYTICS'
  );

  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Scheme Modal
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [newScheme, setNewScheme] = useState({
    code: 'PM-AGRI-2026',
    name: 'National Horticulture & Cold Chain Subsidy',
    category: 'Agriculture & Solar',
    totalBudget: 15000000,
    maxGrant: 250000,
    minGrant: 50000,
    maxIncome: 450000,
    minAge: 18,
    maxAge: 65,
    targetRegion: 'All Districts',
    description: 'Capital subsidy for micro cold room setups, solar drying units, and grading machinery for small farmers.',
  });

  // Search & Filters
  const [appSearch, setAppSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [anRes, scRes, apRes, auRes] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getSchemes(),
        api.getAllApplications(),
        api.getAuditLogs(),
      ]);
      if (anRes.success) setAnalytics(anRes.data);
      if (scRes.success) setSchemes(scRes.schemes);
      if (apRes.success) setApplications(apRes.applications);
      if (auRes.success) setAuditLogs(auRes.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateScheme = async () => {
    try {
      const res = await api.createScheme(newScheme);
      if (res.success) {
        showToast(`Scheme ${res.scheme.code} created successfully!`);
        setIsSchemeModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create scheme');
    }
  };

  const handleResetDemo = async () => {
    if (confirm('Reset database to clean sample data? All test records will be restored.')) {
      try {
        const res = await api.resetDemoDatabase();
        showToast(res.message);
        loadData();
      } catch (err: any) {
        showToast(err.message || 'Reset failed');
      }
    }
  };

  const handleExportCsv = (type: string) => {
    const token = localStorage.getItem('subsidy_auth_token');
    window.open(`/api/reports/export/${type}`, '_blank');
    showToast(`Exporting ${type} report as CSV...`);
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Platform Administration & Governance Hub
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure schemes, manage eligibility criteria, monitor verification queues, and audit all platform actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDemo}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>

          <button
            onClick={() => setIsSchemeModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Scheme
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-6">
        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ANALYTICS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics & Insights
        </button>

        <button
          onClick={() => setActiveTab('SCHEMES')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'SCHEMES'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Schemes & Criteria ({schemes.length})
        </button>

        <button
          onClick={() => setActiveTab('APPLICATIONS')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'APPLICATIONS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          All Applications ({applications.length})
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'AUDIT'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Audit Trail ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'REPORTS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Reports & Export
        </button>
      </div>

      {/* TAB 1: ANALYTICS & CHARTS */}
      {activeTab === 'ANALYTICS' && analytics && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Total Registered Beneficiaries
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {analytics.totalBeneficiaries}
              </span>
              <span className="text-xs text-slate-500">Citizen applicants</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Applications Filed
              </span>
              <span className="text-2xl font-bold text-blue-600 mt-1 block">
                {analytics.totalApplications}
              </span>
              <span className="text-xs text-emerald-600 font-medium">
                {analytics.eligibleApplications} passed automated eligibility
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Approved Subsidy Grants
              </span>
              <span className="text-2xl font-bold text-emerald-700 mt-1 block">
                ₹{analytics.totalGrantsApproved?.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500">
                {analytics.approvedApplications} sanctioned applications
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Direct Benefit Disbursed
              </span>
              <span className="text-2xl font-bold text-purple-700 mt-1 block">
                ₹{analytics.totalFundsDisbursed?.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500">
                ₹{analytics.totalFundsUtilized?.toLocaleString('en-IN')} verified utilized
              </span>
            </div>
          </div>

          {/* Visual Recharts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Applications by Status */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900">
                Applications Workflow Status Distribution
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.statusDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }: any) => `${name} (${(((percent as number) || 0) * 100).toFixed(0)}%)`}
                    >
                      {analytics.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Regional Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900">
                Applications & Sanctions by District
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.regionDistribution}>
                    <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" name="Total Filed" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="approved" name="Sanctioned" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Scheme-wise Budget & Allocation */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900">
                Scheme Budget Allocation vs DBT Disbursed (INR)
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.schemeStats}>
                    <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="allocatedBudget" name="Allocated" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="disbursedBudget" name="Disbursed" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Verification Turnaround Time by Stage */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900">
                Approval Turnaround Time (Days) Target vs Actual
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.turnaroundTimes} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="targetDays" name="Service SLA Target" fill="#94A3B8" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="avgDays" name="Actual Avg Days" fill="#0EA5E9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEME MANAGEMENT & RULE CONFIGURATOR */}
      {activeTab === 'SCHEMES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Scheme Master Catalog & Rules</h3>
              <p className="text-xs text-slate-500">
                Define criteria, eligibility scoring algorithms, and sanction limits
              </p>
            </div>
            <button
              onClick={() => setIsSchemeModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Scheme
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {schemes.map((scheme) => (
              <div key={scheme.id} className="p-6 space-y-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {scheme.code}
                      </span>
                      <h4 className="text-base font-bold text-slate-900">{scheme.name}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                        {scheme.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                      {scheme.description}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Total Budget
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      ₹{scheme.totalBudget.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Criteria Grid */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                    Automated Eligibility Scoring Rules & Criteria Matrix
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {scheme.criteria?.map((cr) => (
                      <div key={cr.id} className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <div className="flex justify-between font-semibold text-slate-800">
                          <span>{cr.name}</span>
                          <span className="text-blue-600 font-bold">+{cr.points} pts</span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Condition: {cr.operator} {String(cr.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grant Slabs */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Sanction Slabs:</span>
                  {scheme.grantSlabs?.map((slab) => (
                    <span
                      key={slab.id}
                      className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium"
                    >
                      {slab.slabName} (Score {slab.minScore}-{slab.maxScore}): ₹
                      {slab.grantAmount.toLocaleString('en-IN')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ALL APPLICATIONS REGISTRY */}
      {activeTab === 'APPLICATIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Master Applications Registry</h3>
              <p className="text-xs text-slate-500">
                End-to-end repository of all citizen subsidy filings
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search registry..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-60 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-6 py-3">Application ID</th>
                  <th className="px-6 py-3">Applicant Name</th>
                  <th className="px-6 py-3">Scheme & Region</th>
                  <th className="px-6 py-3 text-center">Score</th>
                  <th className="px-6 py-3">Current Stage</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Sanction Amount</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications
                  .filter(
                    (a) =>
                      a.applicationNumber.toLowerCase().includes(appSearch.toLowerCase()) ||
                      a.beneficiaryName.toLowerCase().includes(appSearch.toLowerCase()) ||
                      a.schemeName.toLowerCase().includes(appSearch.toLowerCase())
                  )
                  .map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-700">
                        {app.applicationNumber}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{app.beneficiaryName}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{app.schemeName}</p>
                        <p className="text-[11px] text-slate-500">{app.region}</p>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">
                        {app.eligibilityScore || 0}/100
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {app.currentStage.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={app.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        ₹{app.grantAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onNavigate('application-details', app.id)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL EXPLORER */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Immutable Audit Trail</h3>
              <p className="text-xs text-slate-500">
                Cryptographically tracked log of all system transitions, officer decisions, and fund releases
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-60 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Actor & Role</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Application ID</th>
                  <th className="px-6 py-3">Status Transition</th>
                  <th className="px-6 py-3">Audit Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs
                  .filter(
                    (l) =>
                      l.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
                      l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
                      l.remarks.toLowerCase().includes(auditSearch.toLowerCase())
                  )
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-bold text-slate-900 block">{log.userName}</span>
                        <span className="text-[10px] text-blue-700 font-medium">{log.userRole}</span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs font-semibold text-slate-800">
                        {log.action}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-blue-700">
                        {log.applicationId || '—'}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        {log.previousStatus && log.newStatus ? (
                          <span className="text-[11px] text-slate-600">
                            {log.previousStatus} →{' '}
                            <strong className="text-emerald-700">{log.newStatus}</strong>
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 max-w-sm">{log.remarks}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS & DATA EXPORT */}
      {activeTab === 'REPORTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Government Reports & CSV Export Desk</h3>
            <p className="text-xs text-slate-500">
              Download live platform datasets for audits, legislative committees, and district performance reviews
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-sm">Scheme Utilization Report</span>
                <p className="text-xs text-slate-500 mt-1">
                  Scheme codes, categories, total budget, sanctioned grant, and disbursed amounts.
                </p>
              </div>
              <button
                onClick={() => handleExportCsv('SCHEMES')}
                className="w-full px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                Download Schemes CSV
              </button>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-sm">Master Applications Report</span>
                <p className="text-xs text-slate-500 mt-1">
                  Full list of citizen filings, eligibility scores, approval stages, and sanctioned amounts.
                </p>
              </div>
              <button
                onClick={() => handleExportCsv('APPLICATIONS')}
                className="w-full px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                Download Applications CSV
              </button>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-sm">Official Audit Trail Report</span>
                <p className="text-xs text-slate-500 mt-1">
                  Complete immutable ledger of all approvals, rejections, re-applications, and releases.
                </p>
              </div>
              <button
                onClick={() => handleExportCsv('AUDIT')}
                className="w-full px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                Download Audit Trail CSV
              </button>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-sm">Regional DBT Performance</span>
                <p className="text-xs text-slate-500 mt-1">
                  District-wise breakdown of applications, clearance rate, and average approval turnaround days.
                </p>
              </div>
              <button
                onClick={() => handleExportCsv('REGIONS')}
                className="w-full px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                Download Regional CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SCHEME MODAL */}
      <Modal
        isOpen={isSchemeModalOpen}
        onClose={() => setIsSchemeModalOpen(false)}
        title="Configure New Subsidy Scheme"
        subtitle="Specify eligibility bounds, maximum grant limits, and criteria weights"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Scheme Code</label>
              <input
                type="text"
                value={newScheme.code}
                onChange={(e) => setNewScheme({ ...newScheme, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={newScheme.category}
                onChange={(e) => setNewScheme({ ...newScheme, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Agriculture & Solar">Agriculture & Solar</option>
                <option value="Micro Enterprise">Micro Enterprise</option>
                <option value="Dairy & Animal Husbandry">Dairy & Animal Husbandry</option>
                <option value="Education & Skills">Education & Skills</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Scheme Title</label>
              <input
                type="text"
                value={newScheme.name}
                onChange={(e) => setNewScheme({ ...newScheme, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Description & Objective</label>
              <textarea
                rows={2}
                value={newScheme.description}
                onChange={(e) => setNewScheme({ ...newScheme, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Allocated Budget (₹)</label>
              <input
                type="number"
                value={newScheme.totalBudget}
                onChange={(e) => setNewScheme({ ...newScheme, totalBudget: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Maximum Sanction Grant (₹)</label>
              <input
                type="number"
                value={newScheme.maxGrant}
                onChange={(e) => setNewScheme({ ...newScheme, maxGrant: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Annual Income Ceiling (₹)</label>
              <input
                type="number"
                value={newScheme.maxIncome}
                onChange={(e) => setNewScheme({ ...newScheme, maxIncome: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Geographic Region</label>
              <input
                type="text"
                value={newScheme.targetRegion}
                onChange={(e) => setNewScheme({ ...newScheme, targetRegion: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              onClick={() => setIsSchemeModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateScheme}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Save & Activate Scheme
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
