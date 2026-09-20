import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Building,
  Upload,
  ExternalLink,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Send,
  Calendar,
  Layers,
  Banknote,
} from 'lucide-react';
import { Application, EligibilityResult, DisbursementPlan, DisbursementMilestone } from '../../types';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Timeline } from '../../components/common/Timeline';
import { ScorecardModal } from '../../components/common/ScorecardModal';
import { Modal } from '../../components/common/Modal';

interface ApplicationDetailsViewProps {
  applicationId: string;
  onBack: () => void;
}

export const ApplicationDetailsView: React.FC<ApplicationDetailsViewProps> = ({
  applicationId,
  onBack,
}) => {
  const { showToast } = useNotifications();

  const [application, setApplication] = useState<Application | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [disbursementPlan, setDisbursementPlan] = useState<DisbursementPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Scorecard modal state
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);

  // Compliance modal state
  const [complianceMilestone, setComplianceMilestone] = useState<DisbursementMilestone | null>(null);
  const [complianceDocName, setComplianceDocName] = useState('Procurement_Vouchers_Signed.pdf');
  const [complianceRemarks, setComplianceRemarks] = useState('Work completion proof and GST vouchers attached.');
  const [isSubmittingCompliance, setIsSubmittingCompliance] = useState(false);

  // Re-application edit state
  const [isReapplying, setIsReapplying] = useState(false);
  const [reapplyIncome, setReapplyIncome] = useState(140000);
  const [reapplyDescription, setReapplyDescription] = useState('');
  const [reapplyDocName, setReapplyDocName] = useState('Revenue Authority Certified Income Proof (2026)');
  const [reapplyRemarks, setReapplyRemarks] = useState('');
  const [isGeneratingAiNote, setIsGeneratingAiNote] = useState(false);

  const handleAiDraftExplanation = async () => {
    if (!application) return;
    setIsGeneratingAiNote(true);
    try {
      const res = await api.getAiCopilotSuggestion({
        action: 'DRAFT_RECTIFICATION',
        data: {
          applicationNumber: application.applicationNumber,
          schemeTitle: application.schemeName,
          officerRemarks: application.reapplicationRequest?.remarks,
          requestedChanges: application.reapplicationRequest?.requestedChanges?.join(', '),
          actionsTaken: `Updated income to ₹${reapplyIncome}, document: ${reapplyDocName || 'Certified proof'}, scope: ${reapplyDescription || 'Revised specifications'}`,
        },
        context: {
          currentView: 'application-details',
          applicationId: application.id,
        },
      });
      if (res.success && res.text) {
        setReapplyRemarks(res.text);
        showToast('AI Sahayak drafted your official rectification note!');
      }
    } catch (e: any) {
      console.error(e);
      showToast('Could not generate AI draft. Please enter note manually.');
    } finally {
      setIsGeneratingAiNote(false);
    }
  };

  const loadDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.getApplicationDetails(applicationId);
      if (res.success) {
        setApplication(res.application);
        setEligibility(res.eligibility || null);
        setHistory(res.history || []);
        setDisbursementPlan(res.disbursementPlan || null);
        if (res.application.applicantData?.income?.annualIncome) {
          setReapplyIncome(res.application.applicantData.income.annualIncome);
        }
        if (res.application.applicantData?.schemeSpecific?.projectDescription) {
          setReapplyDescription(res.application.applicantData.schemeSpecific.projectDescription);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load application details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [applicationId]);

  const handleComplianceSubmit = async () => {
    if (!complianceMilestone) return;
    setIsSubmittingCompliance(true);
    try {
      const res = await api.submitMilestoneCompliance(complianceMilestone.id, {
        docName: complianceDocName,
        docUrl: '/uploads/compliance_proof.pdf',
        remarks: complianceRemarks,
      });
      if (res.success) {
        showToast('Milestone compliance proof submitted for review!');
        setComplianceMilestone(null);
        loadDetails();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit milestone');
    } finally {
      setIsSubmittingCompliance(false);
    }
  };

  const handleResubmitApplication = async () => {
    if (!application) return;
    setIsReapplying(true);
    try {
      const updatedDocs = [...(application.documents || [])];
      if (reapplyDocName) {
        updatedDocs.push({
          id: `doc-${Date.now()}`,
          applicationId: application.id,
          documentType: 'INCOME_PROOF',
          documentName: reapplyDocName,
          documentUrl: '/uploads/rectified_compliance_doc.pdf',
          fileUrl: '/uploads/rectified_compliance_doc.pdf',
          fileSize: '1.2 MB',
          verified: true,
          uploadedAt: new Date().toISOString(),
        });
      }

      const updatedApplicantData = {
        ...application.applicantData,
        income: {
          ...application.applicantData.income,
          annualIncome: Number(reapplyIncome),
        },
        schemeSpecific: {
          ...application.applicantData.schemeSpecific,
          projectDescription: reapplyDescription || application.applicantData.schemeSpecific?.projectDescription,
        },
      };

      const res = await api.resubmitApplication(application.id, {
        applicantData: updatedApplicantData,
        documents: updatedDocs,
        beneficiaryResponse: reapplyRemarks || 'Addressed officer requirements and updated documentation.',
        remarks: reapplyRemarks || 'Addressed officer requirements and updated documentation.',
      });

      if (res.success) {
        showToast(res.message || 'Application rectified and resubmitted! Returned to officer queue.');
        loadDetails();
      }
    } catch (err: any) {
      showToast(err.message || 'Re-submission failed');
    } finally {
      setIsReapplying(false);
    }
  };

  if (isLoading || !application) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-500 font-medium">Fetching application profile and records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Workspace
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 font-mono">
                {application.applicationNumber}
              </h2>
              <StatusBadge status={application.status} />
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Scheme: <strong className="text-slate-900">{application.schemeName}</strong> | Region:{' '}
              {application.region}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {eligibility && (
              <button
                onClick={() => setIsScorecardOpen(true)}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors border border-blue-200 flex items-center gap-2 shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                Scorecard ({application.eligibilityScore || 0}/100)
              </button>
            )}
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 text-xs">
          <div>
            <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px] block">
              Applicant Name
            </span>
            <span className="font-bold text-slate-800 mt-0.5 block">{application.beneficiaryName}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px] block">
              Current Stage
            </span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              {application.currentStage.replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px] block">
              Sanctioned Grant
            </span>
            <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
              ₹{application.grantAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px] block">
              Submitted Date
            </span>
            <span className="font-medium text-slate-600 mt-0.5 block">
              {application.submittedAt
                ? new Date(application.submittedAt).toLocaleDateString('en-IN')
                : 'Draft'}
            </span>
          </div>
        </div>
      </div>

      {/* RE-APPLICATION ACTION BOX (If Verification Officer requested revisions) */}
      {application.status === 'REAPPLICATION_REQUIRED' && application.reapplicationRequest && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="text-base font-bold text-orange-950">
                  Officer Re-Application / Revision Request
                </h4>
                <p className="text-xs text-orange-900 mt-0.5">
                  Requested by: <strong>{application.reapplicationRequest.requestedBy}</strong> (
                  {application.reapplicationRequest.officerRole})
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-orange-200 text-xs text-slate-800 space-y-2">
                <p>
                  <strong className="text-orange-950">Reason:</strong>{' '}
                  {application.reapplicationRequest.reason}
                </p>
                {application.reapplicationRequest.remarks && (
                  <p>
                    <strong className="text-orange-950">Officer Remarks:</strong> "
                    {application.reapplicationRequest.remarks}"
                  </p>
                )}
                {application.reapplicationRequest.requestedChanges?.length > 0 && (
                  <div>
                    <strong className="text-orange-950 block mb-1">Specific Updates Required:</strong>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                      {application.reapplicationRequest.requestedChanges.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Revision Editing Form */}
              <div className="bg-white p-5 rounded-xl border border-orange-200 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h5 className="font-bold text-slate-900 text-sm">Rectify & Update Application Details:</h5>
                  <span className="text-[11px] text-orange-700 font-semibold bg-orange-100 px-2 py-0.5 rounded-full">
                    Reverse Route: Returns to {application.reapplicationRequest.returnToStage ? application.reapplicationRequest.returnToStage.replace(/_/g, ' ') : application.reapplicationRequest.officerRole.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Certified Annual Income (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={reapplyIncome}
                      onChange={(e) => setReapplyIncome(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Rectified Document Proof Title
                    </label>
                    <input
                      type="text"
                      value={reapplyDocName}
                      onChange={(e) => setReapplyDocName(e.target.value)}
                      placeholder="e.g. Tehsildar Certified Income Certificate (2026)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">
                      Updated Project Proposal / Scope Description
                    </label>
                    <textarea
                      rows={2}
                      value={reapplyDescription}
                      onChange={(e) => setReapplyDescription(e.target.value)}
                      placeholder="Provide any additional project clarifications or details requested by officer..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-700 font-semibold">
                        Beneficiary Explanation / Compliance Note to Officer <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAiDraftExplanation}
                        disabled={isGeneratingAiNote}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs transition-all hover:scale-[1.02] disabled:opacity-50"
                        title="Draft a polite, compliant explanation note with AI"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                        <span>{isGeneratingAiNote ? 'Drafting with AI...' : 'Draft Note with AI'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Attached newly certified revenue certificate with updated income declaration as instructed"
                      value={reapplyRemarks}
                      onChange={(e) => setReapplyRemarks(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    When you click <strong>Resubmit Application</strong>, your application will be re-evaluated and returned immediately to the <strong>{application.reapplicationRequest.officerRole.replace(/_/g, ' ')}</strong> verification queue with an updated audit badge.
                  </span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleResubmitApplication}
                    disabled={isReapplying}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {isReapplying ? 'Evaluating & Returning to Officer...' : 'Resubmit Application Back to Officer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Workflow Progress & Historic Log */}
      <Timeline
        currentStatus={application.status}
        currentStage={application.currentStage}
        history={history}
      />

      {/* Staged Fund Disbursement & Compliance Milestones Section */}
      {disbursementPlan && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                Staged Fund Disbursement Schedule & Compliance Proof
              </h3>
              <p className="text-xs text-slate-500">
                Grant tranches are released via Direct Benefit Transfer (DBT) upon verified milestone
                completion
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Sanctioned</span>
              <span className="text-base font-black text-emerald-700">
                ₹{disbursementPlan.totalGrantAmount?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {disbursementPlan.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      Tranche #{milestone.milestoneNumber}: {milestone.milestoneName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        milestone.status === 'RELEASED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : milestone.status === 'APPROVED'
                          ? 'bg-blue-100 text-blue-800'
                          : milestone.status === 'COMPLIANCE_SUBMITTED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {milestone.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-slate-600">{milestone.description}</p>
                  <div className="text-slate-500 text-[11px] flex items-center gap-4 pt-1">
                    <span>
                      Mandatory Proof: <strong>{milestone.requiredComplianceDoc}</strong>
                    </span>
                    <span>Due: {milestone.dueDate}</span>
                  </div>

                  {milestone.transactionRef && (
                    <div className="mt-2 bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-emerald-900 font-mono text-[11px] space-y-0.5">
                      <p>
                        <strong>DBT Reference:</strong> {milestone.transactionRef}
                      </p>
                      <p>
                        <strong>Payment Mode:</strong> {milestone.paymentMode} (Released on:{' '}
                        {new Date(milestone.releasedDate!).toLocaleDateString('en-IN')})
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                  <div className="text-right sm:pr-4 sm:border-r sm:border-slate-200">
                    <span className="text-[10px] text-slate-400 font-semibold block">Tranche Amount</span>
                    <span className="text-base font-bold text-slate-900">
                      ₹{milestone.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {milestone.status === 'PENDING' && (
                    <button
                      onClick={() => setComplianceMilestone(milestone)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Submit Compliance Proof
                    </button>
                  )}

                  {milestone.status === 'COMPLIANCE_SUBMITTED' && (
                    <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-medium text-xs">
                      Under Officer Review
                    </span>
                  )}

                  {milestone.status === 'RELEASED' && (
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-semibold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Funds Disbursed to Bank
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applicant Data Summary Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal & Socio-Economic Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs">
          <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Beneficiary Profile & Socio-Economic Details
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Aadhaar Card</span>
              <span className="font-mono text-slate-800 font-medium">
                {application.applicantData?.personal?.aadhaarNumber}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">DOB / Age</span>
              <span className="text-slate-800 font-medium">
                {application.applicantData?.personal?.dateOfBirth}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Gender</span>
              <span className="text-slate-800 font-medium">
                {application.applicantData?.personal?.gender}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Social Category</span>
              <span className="text-slate-800 font-medium">
                {application.applicantData?.category?.socialCategory}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Annual Income</span>
              <span className="text-slate-800 font-bold font-mono">
                ₹{application.applicantData?.income?.annualIncome?.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Landholding</span>
              <span className="text-slate-800 font-medium">
                {application.applicantData?.income?.landOwnershipAcres} Acres
              </span>
            </div>
          </div>
        </div>

        {/* DBT Bank Account & Project */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs">
          <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Direct Benefit Transfer (DBT) Bank Account
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Bank Name</span>
              <span className="text-slate-800 font-medium">
                {application.applicantData?.schemeSpecific?.bankName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Branch</span>
              <span className="text-slate-800 font-medium">
                {application.applicantData?.schemeSpecific?.branchName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Account Number</span>
              <span className="font-mono text-slate-800 font-bold">
                {application.applicantData?.schemeSpecific?.bankAccountNo}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">IFSC Code</span>
              <span className="font-mono text-slate-800 font-bold uppercase">
                {application.applicantData?.schemeSpecific?.ifscCode}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">
              Proposed Project Title
            </span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {application.applicantData?.schemeSpecific?.proposedProjectTitle}
            </p>
          </div>
        </div>
      </div>

      {/* Attached Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Verified Attached Documentation
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {application.documents?.map((doc, i) => (
            <div
              key={doc.id || i}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs hover:bg-slate-100/80 transition-colors"
            >
              <div>
                <span className="font-semibold text-slate-900 block truncate max-w-[180px]">
                  {doc.documentName}
                </span>
                <span className="text-[10px] text-slate-500 block">{doc.fileSize || '1.2 MB'}</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-medium text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scorecard Modal */}
      <ScorecardModal
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
        result={eligibility}
        schemeName={application.schemeName}
      />

      {/* Submit Milestone Compliance Modal */}
      {complianceMilestone && (
        <Modal
          isOpen={!!complianceMilestone}
          onClose={() => setComplianceMilestone(null)}
          title={`Upload Milestone Compliance: ${complianceMilestone.milestoneName}`}
          subtitle={`Required Proof: ${complianceMilestone.requiredComplianceDoc}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Document Attachment</label>
              <input
                type="text"
                value={complianceDocName}
                onChange={(e) => setComplianceDocName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Work Execution & Utilization Remarks
              </label>
              <textarea
                rows={3}
                value={complianceRemarks}
                onChange={(e) => setComplianceRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px]">
              Upon submission, Field & Finance officers will inspect the vouchers and release Tranche #
              {complianceMilestone.milestoneNumber} (₹{complianceMilestone.amount.toLocaleString('en-IN')})
              directly to your DBT account.
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setComplianceMilestone(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleComplianceSubmit}
                disabled={isSubmittingCompliance}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                {isSubmittingCompliance ? 'Uploading...' : 'Submit Proof'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
