import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Building,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { Application } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';

interface BeneficiaryDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

export const BeneficiaryDashboard: React.FC<BeneficiaryDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const appsRes = await api.getMyApplications();
      if (appsRes.success) setApplications(appsRes.applications);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalApps = applications.length;
  const approvedApps = applications.filter(
    (a) =>
      a.status === 'APPROVED' ||
      a.status === 'PARTIALLY_DISBURSED' ||
      a.status === 'FULLY_DISBURSED' ||
      a.status === 'COMPLETED'
  ).length;
  const inProgressApps = applications.filter(
    (a) =>
      a.status === 'SUBMITTED' ||
      a.status === 'ELIGIBILITY_CHECK' ||
      a.status === 'FIELD_VERIFICATION' ||
      a.status === 'DISTRICT_VERIFICATION' ||
      a.status === 'FINANCE_VERIFICATION'
  ).length;
  const reapplicationRequiredApps = applications.filter(
    (a) => a.status === 'REAPPLICATION_REQUIRED'
  );

  const totalSanctionedGrant = applications
    .filter(
      (a) =>
        a.status === 'APPROVED' ||
        a.status === 'PARTIALLY_DISBURSED' ||
        a.status === 'FULLY_DISBURSED' ||
        a.status === 'COMPLETED'
    )
    .reduce((sum, a) => sum + (a.grantAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome & Action Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Welcome, {user?.fullName}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Citizen Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track your subsidy applications, review officer notes, and submit milestone completion.
          </p>
        </div>

        <button
          onClick={() => onNavigate('schemes-catalog')}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 shrink-0"
        >
          <Building className="w-4 h-4" />
          Browse Available Schemes
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Urgent Action Required Banner (Reapplication) */}
      {reapplicationRequiredApps.length > 0 && (
        <div className="bg-orange-50 border border-orange-300 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-orange-950">
                  Revision Requested by Verification Officer
                </h4>
                <p className="text-xs text-orange-800 mt-0.5">
                  Application <strong>{reapplicationRequiredApps[0].applicationNumber}</strong> requires
                  clarification or updated proof. Please review remarks and resubmit.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('application-details', reapplicationRequiredApps[0].id)}
              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Update & Resubmit
            </button>
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Applications</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">{totalApps}</span>
            <span className="text-xs text-slate-400 ml-1.5">filed</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Under Review</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-600">{inProgressApps}</span>
            <span className="text-xs text-slate-400 ml-1.5">in progress</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Approved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-600">{approvedApps}</span>
            <span className="text-xs text-slate-400 ml-1.5">sanctioned</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sanctioned Grant</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">
              ₹{totalSanctionedGrant.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">DBT</span>
          </div>
        </div>
      </div>

      {/* My Applications Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">My Applications</h3>
            <p className="text-xs text-slate-500">Status and verification progression</p>
          </div>
          <button
            onClick={() => onNavigate('schemes-catalog')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Explore Schemes
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-10 px-4">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-xs font-semibold text-slate-700">No applications filed yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You have not applied for any subsidy schemes yet. Browse available schemes to apply.
            </p>
            <button
              onClick={() => onNavigate('schemes-catalog')}
              className="mt-3.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              Browse Schemes
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-5 py-3">Application ID</th>
                  <th className="px-5 py-3">Scheme Name</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Stage</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Grant Amount</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-700">
                      {app.applicationNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{app.schemeName}</p>
                      <p className="text-[11px] text-slate-500">{app.region}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {app.eligibilityScore !== undefined ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                              app.isEligible
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {app.eligibilityScore}/{app.maxScore || 100}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">--</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">
                      {app.currentStage.replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      ₹{app.grantAmount ? app.grantAmount.toLocaleString('en-IN') : 0}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => onNavigate('application-details', app.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
