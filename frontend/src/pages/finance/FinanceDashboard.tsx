import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CheckCircle2,
  XCircle,
  Banknote,
  Send,
  Building,
  CreditCard,
  Search,
  Check,
  FileCheck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Application, Scheme, DisbursementPlan, DisbursementMilestone } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';

interface FinanceDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<'SANCTION_QUEUE' | 'DISBURSEMENT_TRANCHES'>('SANCTION_QUEUE');
  const [isLoading, setIsLoading] = useState(true);

  // Sanction Modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [sanctionRemarks, setSanctionRemarks] = useState('All district scrutiny approvals confirmed. Grant funds sanctioned.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAiDraftingSanction, setIsAiDraftingSanction] = useState(false);

  const handleAiDraftSanction = async () => {
    if (!selectedApp) return;
    setIsAiDraftingSanction(true);
    try {
      const res = await api.getAiCopilotSuggestion({
        action: 'DRAFT_SANCTION',
        data: {
          applicationNumber: selectedApp.applicationNumber,
          schemeTitle: selectedApp.schemeName,
          beneficiaryName: selectedApp.beneficiaryName,
          amount: selectedApp.grantAmount,
        },
        context: {
          currentView: 'finance-dashboard',
          applicationId: selectedApp.id,
        },
      });
      if (res.success && res.text) {
        setSanctionRemarks(res.text);
        showToast('AI drafted official GFR 2017 Sanction Memo!');
      }
    } catch (e) {
      console.error(e);
      showToast('Could not generate sanction draft.');
    } finally {
      setIsAiDraftingSanction(false);
    }
  };

  // Release Tranche Modal
  const [selectedMilestone, setSelectedMilestone] = useState<DisbursementMilestone | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentMode, setPaymentMode] = useState('Direct Benefit Transfer (PFMS DBT)');
  const [releaseRemarks, setReleaseRemarks] = useState('Tranche installment sanctioned and disbursed to beneficiary bank account.');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAllApplications();
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
    loadData();
  }, []);

  const sanctionQueue = applications.filter((a) => a.currentStage === 'FINANCE_VERIFICATION');
  const activeDisbursements = applications.filter(
    (a) =>
      a.status === 'APPROVED' ||
      a.status === 'DISBURSEMENT_PENDING' ||
      a.status === 'PARTIALLY_DISBURSED' ||
      a.status === 'FULLY_DISBURSED'
  );

  const handleSanctionApprove = async () => {
    if (!selectedApp) return;
    setIsProcessing(true);
    try {
      const res = await api.approveVerification(selectedApp.id, {
        remarks: sanctionRemarks,
      });
      showToast('Grant officially sanctioned! Disbursement plan initialized.');
      setSelectedApp(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Sanction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendBackToDistrict = async () => {
    if (!selectedApp) return;
    if (!sanctionRemarks.trim()) {
      showToast('Please state official reason/discrepancy for sending back to District Officer.');
      return;
    }
    setIsProcessing(true);
    try {
      const res = await api.requestReverification(selectedApp.id, {
        remarks: sanctionRemarks,
      });
      showToast(res.message || 'Application returned to District Officer for re-scrutiny.');
      setSelectedApp(null);
      setSanctionRemarks('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Send back failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReleaseFund = async () => {
    if (!selectedMilestone) return;
    setIsProcessing(true);
    try {
      const res = await api.releaseMilestoneFund(selectedMilestone.id, {
        transactionRef,
        paymentMode,
        remarks: releaseRemarks,
      });
      showToast(`Funds released! DBT Ref: ${res.milestone.transactionRef}`);
      setSelectedMilestone(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Fund release failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Finance & DBT Treasury Disbursement Desk
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
              Sanctioning Authority
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Director in Charge: <strong>{user?.fullName}</strong> | Direct Benefit Transfer (PFMS)
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right border-r border-slate-200 pr-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Awaiting Sanction
            </span>
            <span className="text-xl font-bold text-purple-700">{sanctionQueue.length}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Active Tranches
            </span>
            <span className="text-xl font-bold text-emerald-700">{activeDisbursements.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('SANCTION_QUEUE')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'SANCTION_QUEUE'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Finance Sanction Queue ({sanctionQueue.length})
        </button>

        <button
          onClick={() => setActiveTab('DISBURSEMENT_TRANCHES')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'DISBURSEMENT_TRANCHES'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Banknote className="w-4 h-4" />
          Staged Milestone Releases & DBT ({activeDisbursements.length})
        </button>
      </div>

      {/* TAB 1: SANCTION QUEUE */}
      {activeTab === 'SANCTION_QUEUE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Applications Endorsed by District Officer
            </h3>
            <p className="text-xs text-slate-500">
              Review and sanction final government grant approval & budget allocation
            </p>
          </div>

          {sanctionQueue.length === 0 ? (
            <div className="text-center py-16 px-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-800">Finance Sanction Queue Clear</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No applications currently pending financial sanction.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-6 py-3">Application ID</th>
                    <th className="px-6 py-3">Beneficiary</th>
                    <th className="px-6 py-3">Scheme</th>
                    <th className="px-6 py-3">Eligibility Score</th>
                    <th className="px-6 py-3">Proposed Grant</th>
                    <th className="px-6 py-3">DBT Bank Account</th>
                    <th className="px-6 py-3 text-right">Sanction Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sanctionQueue.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-700">
                        {app.applicationNumber}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{app.beneficiaryName}</p>
                        <p className="text-[11px] text-slate-500">{app.region}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{app.schemeName}</td>
                      <td className="px-6 py-4 font-bold text-emerald-700">
                        {app.eligibilityScore || 0}/100
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                        ₹{app.grantAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-700">
                        {app.applicantData?.schemeSpecific?.bankName} (
                        {app.applicantData?.schemeSpecific?.bankAccountNo})
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Sanction Grant
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DISBURSEMENT TRANCHES & MILESTONES */}
      {activeTab === 'DISBURSEMENT_TRANCHES' && (
        <div className="space-y-4">
          {activeDisbursements.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700 text-sm">
                      {app.applicationNumber}
                    </span>
                    <StatusBadge status={app.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Beneficiary: <strong>{app.beneficiaryName}</strong> | Scheme:{' '}
                    <strong>{app.schemeName}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Total Sanctioned
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      ₹{app.grantAmount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigate('application-details', app.id)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View All Details
                  </button>
                </div>
              </div>

              {/* Bank Transfer Details */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block font-sans font-bold">
                    Target DBT Bank
                  </span>
                  <span>
                    {app.applicantData?.schemeSpecific?.bankName} - A/C{' '}
                    {app.applicantData?.schemeSpecific?.bankAccountNo}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block font-sans font-bold">
                    IFSC
                  </span>
                  <span>{app.applicantData?.schemeSpecific?.ifscCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block font-sans font-bold">
                    Branch
                  </span>
                  <span>{app.applicantData?.schemeSpecific?.branchName}</span>
                </div>
              </div>

              {/* Quick Milestone Release Button trigger */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    // Trigger simulated tranche release modal
                    const simulatedMilestone: DisbursementMilestone = {
                      id: `ms-${app.id}-1`,
                      planId: `plan-${app.id}`,
                      applicationId: app.id,
                      milestoneNumber: 1,
                      milestoneName: 'Tranche #1: Initial Procurement',
                      description: 'Direct grant installment disbursement',
                      amount: Math.round(app.grantAmount * 0.5),
                      dueDate: '2026-10-15',
                      requiredComplianceDoc: 'Procurement Vouchers',
                      status: 'APPROVED',
                    };
                    setSelectedMilestone(simulatedMilestone);
                    setTransactionRef(`PFMS-DBT-2026-${Math.floor(10000000 + Math.random() * 90000000)}`);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Banknote className="w-4 h-4" />
                  Release Next Tranche (₹{(app.grantAmount * 0.5).toLocaleString('en-IN')})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SANCTION MODAL */}
      {selectedApp && (
        <Modal
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title={`Finance Grant Sanction: ${selectedApp.applicationNumber}`}
          subtitle={`Beneficiary: ${selectedApp.beneficiaryName} | Scheme: ${selectedApp.schemeName}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-purple-950">
              <span className="font-bold block text-sm">
                Sanctioning Grant Amount: ₹{selectedApp.grantAmount?.toLocaleString('en-IN')}
              </span>
              <p className="text-xs opacity-90 mt-1">
                Upon final sanction, the scheme budget allocation will be reserved and a 2-stage milestone
                disbursement plan will be initiated.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-800">
                  Finance Director Sanction Order & Authorization Remarks
                </label>
                <button
                  type="button"
                  onClick={handleAiDraftSanction}
                  disabled={isAiDraftingSanction}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs transition-all hover:scale-[1.02] disabled:opacity-50"
                  title="Draft formal GFR 2017 Sanction Memo with AI"
                >
                  <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                  <span>{isAiDraftingSanction ? 'Drafting Memo...' : 'AI Draft Sanction Memo'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={sanctionRemarks}
                onChange={(e) => setSanctionRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-3.5 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 text-xs"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendBackToDistrict}
                  disabled={isProcessing}
                  className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Send Back to District Officer
                </button>
                <button
                  onClick={handleSanctionApprove}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isProcessing ? 'Sanctioning...' : 'Approve & Sanction Grant'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* RELEASE TRANCHE MODAL */}
      {selectedMilestone && (
        <Modal
          isOpen={!!selectedMilestone}
          onClose={() => setSelectedMilestone(null)}
          title={`Direct Benefit Transfer Release: ${selectedMilestone.milestoneName}`}
          subtitle={`Amount to Release: ₹${selectedMilestone.amount.toLocaleString('en-IN')}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Public Financial Management System (PFMS) Reference No
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Payment Mode / Protocol</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Direct Benefit Transfer (PFMS DBT)">Direct Benefit Transfer (PFMS DBT)</option>
                <option value="National Electronic Fund Transfer (NEFT)">NEFT / RTGS</option>
                <option value="State Treasury Treasury Transfer">State Treasury Transfer</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Treasury Disbursement Remarks</label>
              <textarea
                rows={2}
                value={releaseRemarks}
                onChange={(e) => setReleaseRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedMilestone(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReleaseFund}
                disabled={isProcessing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isProcessing ? 'Transacting...' : 'Confirm DBT Release'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
