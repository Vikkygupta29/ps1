import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Search,
  Eye,
  Building,
  User,
  MapPin,
  Coins,
  ShieldAlert,
  Send,
  Sparkles,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import { Application, UserRole } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';

interface OfficerDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Active Review Modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewAction, setReviewAction] = useState<
    'APPROVE' | 'REJECT' | 'REQUEST_REAPPLICATION' | 'REQUEST_REVERIFICATION' | null
  >(null);
  const [officerRemarks, setOfficerRemarks] = useState('');
  const [requestedChanges, setRequestedChanges] = useState('Please update and re-upload valid family income certificate verified by Revenue Authority.');
  const [isProcessing, setIsProcessing] = useState(false);

  // Field Officer Ground Verification Checklist
  const [groundChecklist, setGroundChecklist] = useState([
    { label: 'Physical residence and domicile verified in district', passed: true },
    { label: 'Original Aadhaar and Identity document physically cross-checked', passed: true },
    { label: 'Family income proof and land parcel boundaries examined', passed: true },
    { label: 'Proposed project site and feasibility confirmed on ground', passed: true },
  ]);

  const isFieldOfficer = user?.role === 'FIELD_OFFICER';
  const isDistrictOfficer = user?.role === 'DISTRICT_OFFICER' || user?.role === 'ADMIN';
  const stageTitle = isFieldOfficer
    ? 'Ground Field Verification Desk'
    : 'District Level Scrutiny & Endorsement Desk';

  const [isAiDrafting, setIsAiDrafting] = useState(false);

  const handleAiDraftRemarks = async () => {
    if (!selectedApp) return;
    setIsAiDrafting(true);
    try {
      const res = await api.getAiCopilotSuggestion({
        action: 'DRAFT_REMARKS',
        data: {
          applicationNumber: selectedApp.applicationNumber,
          schemeTitle: selectedApp.schemeName,
          decision: reviewAction || 'APPROVE',
          observations: `${isFieldOfficer ? 'Field site visit and physical asset verification complete' : 'District verification of revenue documentation and eligibility norms'} for applicant ${selectedApp.beneficiaryName}. Score: ${selectedApp.eligibilityScore}/${selectedApp.maxScore}.`,
        },
        context: {
          currentView: 'officer-queue',
          applicationId: selectedApp.id,
        },
      });
      if (res.success && res.text) {
        setOfficerRemarks(res.text);
        showToast('AI Copilot drafted official verification remarks!');
      }
    } catch (e: any) {
      console.error(e);
      showToast('Could not generate AI draft.');
    } finally {
      setIsAiDrafting(false);
    }
  };

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const res = await api.getPendingVerifications();
      if (res.success) {
        setApplications(res.applications);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [user?.role]);

  const handleAction = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_REAPPLICATION' | 'REQUEST_REVERIFICATION') => {
    if (!selectedApp) return;
    setIsProcessing(true);
    try {
      if (action === 'APPROVE') {
        const res = await api.approveVerification(selectedApp.id, {
          remarks: officerRemarks || 'On-ground scrutiny completed. Recommended for advancement.',
          groundChecklist: isFieldOfficer ? groundChecklist : undefined,
        });
        showToast(res.message);
      } else if (action === 'REJECT') {
        if (!officerRemarks) {
          showToast('Please provide official justification for rejection.');
          setIsProcessing(false);
          return;
        }
        const res = await api.rejectVerification(selectedApp.id, { remarks: officerRemarks });
        showToast(res.message);
      } else if (action === 'REQUEST_REAPPLICATION') {
        if (!officerRemarks) {
          showToast('Please state remarks explaining why reapplication is required.');
          setIsProcessing(false);
          return;
        }
        const res = await api.requestReapplication(selectedApp.id, {
          remarks: officerRemarks,
          requestedChanges: [requestedChanges],
        });
        showToast(res.message);
      } else if (action === 'REQUEST_REVERIFICATION') {
        if (!officerRemarks) {
          showToast('Please provide reason for re-verification.');
          setIsProcessing(false);
          return;
        }
        const res = await api.requestReverification(selectedApp.id, { remarks: officerRemarks });
        showToast(res.message);
      }

      setSelectedApp(null);
      setReviewAction(null);
      setOfficerRemarks('');
      loadQueue();
    } catch (err: any) {
      showToast(err.message || 'Action failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredApps = applications.filter(
    (a) =>
      a.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.beneficiaryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.schemeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{stageTitle}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {user?.region || 'North District'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Officer in Charge: <strong>{user?.fullName}</strong> | Role:{' '}
            <span className="font-mono">{user?.role}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Reviews</span>
            <span className="text-2xl font-bold text-blue-600">{applications.length}</span>
          </div>
        </div>
      </div>

      {/* Main Queue Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Verification Inspection Queue</h3>
            <p className="text-xs text-slate-500">
              Applications requiring your official scrutiny and decision
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID or applicant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-64 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        {filteredApps.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-800">Verification Queue Clear</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All applications assigned to your verification stage have been scrutinized. New
              eligible applications will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-6 py-3">Application ID</th>
                  <th className="px-6 py-3">Beneficiary</th>
                  <th className="px-6 py-3">Scheme & Region</th>
                  <th className="px-6 py-3 text-center">Score</th>
                  <th className="px-6 py-3">Sanction Amount</th>
                  <th className="px-6 py-3">Current Status</th>
                  <th className="px-6 py-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-blue-700">
                      <div>{app.applicationNumber}</div>
                      {((app.revisionCount && app.revisionCount > 0) || app.lastResubmittedAt) && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <RotateCcw className="w-2.5 h-2.5" />
                          Resubmitted (Rev #{app.revisionCount || 1})
                        </span>
                      )}
                      {app.reverificationNote && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                          <RotateCcw className="w-2.5 h-2.5" />
                          Re-verification
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{app.beneficiaryName}</p>
                      <p className="text-[11px] text-slate-500">
                        Income: ₹{app.applicantData?.income?.annualIncome?.toLocaleString('en-IN') || 0}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{app.schemeName}</p>
                      <p className="text-[11px] text-slate-500">{app.region}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800">
                        {app.eligibilityScore || 0}/100
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ₹{app.grantAmount ? app.grantAmount.toLocaleString('en-IN') : 0}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setOfficerRemarks('');
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        Scrutinize & Act
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SCRUTINY & ACTION MODAL */}
      {selectedApp && (
        <Modal
          isOpen={!!selectedApp}
          onClose={() => {
            setSelectedApp(null);
            setReviewAction(null);
          }}
          title={`Scrutiny Desk: ${selectedApp.applicationNumber}`}
          subtitle={`Applicant: ${selectedApp.beneficiaryName} | Scheme: ${selectedApp.schemeName}`}
          maxWidth="3xl"
        >
          <div className="space-y-6 text-xs">
            {/* Applicant Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-semibold text-[10px] block">Aadhaar</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedApp.applicantData?.personal?.aadhaarNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold text-[10px] block">Annual Income</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{selectedApp.applicantData?.income?.annualIncome?.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold text-[10px] block">Category</span>
                <span className="font-bold text-slate-800">
                  {selectedApp.applicantData?.category?.socialCategory}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold text-[10px] block">Sanction Grant</span>
                <span className="font-bold text-emerald-700">
                  ₹{selectedApp.grantAmount?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Reverse Process Callout 1: Beneficiary Rectification Note */}
            {selectedApp.beneficiaryResponse && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    Beneficiary Resubmission & Rectification (Revision #{selectedApp.revisionCount || 1})
                  </span>
                  {selectedApp.lastResubmittedAt && (
                    <span className="text-[10px] text-amber-800 font-mono">
                      {new Date(selectedApp.lastResubmittedAt).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <div className="text-xs text-amber-900 bg-white/90 p-2.5 rounded-lg border border-amber-200">
                  <strong>Beneficiary Note:</strong> "{selectedApp.beneficiaryResponse}"
                </div>
              </div>
            )}

            {/* Reverse Process Callout 2: Re-verification Directives from Higher Authority */}
            {selectedApp.reverificationNote && (
              <div className="bg-purple-50 border border-purple-300 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-950 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-purple-700" />
                    Ground Re-verification Request from {selectedApp.reverificationNote.requestedBy} ({selectedApp.reverificationNote.officerRole})
                  </span>
                  <span className="text-[10px] text-purple-800 font-mono">
                    {new Date(selectedApp.reverificationNote.requestedAt).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-xs text-purple-900 bg-white/90 p-2.5 rounded-lg border border-purple-200">
                  <strong>Re-inspection Directives:</strong> "{selectedApp.reverificationNote.reason}"
                </div>
              </div>
            )}

            {/* Attached Documents Quick Check */}
            <div>
              <h5 className="font-bold text-slate-900 mb-2">Attached Documents for Verification:</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {selectedApp.documents?.map((doc, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between"
                  >
                    <span className="font-medium text-slate-800 truncate max-w-[140px]">
                      {doc.documentName}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      VERIFIED
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Field Officer Ground Checklist (Conditional) */}
            {isFieldOfficer && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2.5">
                <h5 className="font-bold text-amber-950 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-amber-700" />
                  Mandatory On-Ground Physical Verification Checklist
                </h5>

                <div className="space-y-2">
                  {groundChecklist.map((item, idx) => (
                    <label key={idx} className="flex items-center gap-2.5 cursor-pointer text-slate-800">
                      <input
                        type="checkbox"
                        checked={item.passed}
                        onChange={(e) => {
                          const updated = [...groundChecklist];
                          updated[idx].passed = e.target.checked;
                          setGroundChecklist(updated);
                        }}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Officer Remarks Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-800">
                  Official Verification Remarks & Audit Justification
                </label>
                <button
                  type="button"
                  onClick={handleAiDraftRemarks}
                  disabled={isAiDrafting}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs transition-all hover:scale-[1.02] disabled:opacity-50"
                  title="Draft compliant scrutiny remarks using AI Copilot"
                >
                  <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                  <span>{isAiDrafting ? 'Drafting Remarks...' : 'AI Draft Remarks'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="Enter mandatory audit remarks and observations..."
                value={officerRemarks}
                onChange={(e) => setOfficerRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Reapplication Specific Note Input */}
            {reviewAction === 'REQUEST_REAPPLICATION' && (
              <div className="p-4 bg-orange-50 border border-orange-300 rounded-xl space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-orange-950 text-xs">
                    Specify Required Changes for Beneficiary Rectification:
                  </label>
                  <span className="text-[10px] text-orange-700 font-medium">Application will return to Beneficiary</span>
                </div>
                <input
                  type="text"
                  value={requestedChanges}
                  onChange={(e) => setRequestedChanges(e.target.value)}
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. Please upload latest Revenue Tehsildar verified income certificate"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-orange-800 font-bold self-center mr-1">Quick Select:</span>
                  {[
                    'Upload latest Revenue Income Certificate',
                    'Provide detailed Equipment Quotation',
                    'Attach updated Land Record / Patta',
                    'Clarify Project Title & Description',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setRequestedChanges(tag)}
                      className="px-2 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-900 border border-orange-200 hover:bg-orange-200 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Re-verification Specific Input for District Officer */}
            {reviewAction === 'REQUEST_REVERIFICATION' && (
              <div className="p-4 bg-purple-50 border border-purple-300 rounded-xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-purple-950 text-xs">
                    Ground Re-verification Directives for Field Officer:
                  </label>
                  <span className="text-[10px] text-purple-700 font-medium">Application will return to Field Queue</span>
                </div>
                <p className="text-[11px] text-purple-800">
                  State the specific discrepancy (e.g. land boundaries survey, discrepancy in caste/income certificate, physical plant inspection) for the Field Officer to re-examine on site.
                </p>
              </div>
            )}

            {/* Decision Actions Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => {
                  setSelectedApp(null);
                  setReviewAction(null);
                }}
                className="px-4 py-2 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {/* Reverse Action 1: Send back to Beneficiary for Rectification */}
                <button
                  onClick={() => {
                    if (reviewAction === 'REQUEST_REAPPLICATION') {
                      handleAction('REQUEST_REAPPLICATION');
                    } else {
                      setReviewAction('REQUEST_REAPPLICATION');
                    }
                  }}
                  disabled={isProcessing}
                  className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {reviewAction === 'REQUEST_REAPPLICATION'
                    ? 'Confirm Return to Beneficiary'
                    : 'Request Re-Application'}
                </button>

                {/* Reverse Action 2: District Officer sends back to Field Officer */}
                {isDistrictOfficer && (
                  <button
                    onClick={() => {
                      if (reviewAction === 'REQUEST_REVERIFICATION') {
                        handleAction('REQUEST_REVERIFICATION');
                      } else {
                        setReviewAction('REQUEST_REVERIFICATION');
                      }
                    }}
                    disabled={isProcessing}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {reviewAction === 'REQUEST_REVERIFICATION'
                      ? 'Confirm Return to Field Officer'
                      : 'Send Back to Field Officer'}
                  </button>
                )}

                <button
                  onClick={() => handleAction('REJECT')}
                  disabled={isProcessing}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 text-xs"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject Application
                </button>

                <button
                  onClick={() => handleAction('APPROVE')}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5 text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isFieldOfficer
                    ? 'Approve & Forward to District Officer'
                    : 'Endorse & Forward to Finance Approver'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
