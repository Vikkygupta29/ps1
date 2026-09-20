import React from 'react';
import { CheckCircle2, Clock, CircleAlert, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { ApplicationStatus, WorkflowHistory } from '../../types';

interface TimelineProps {
  currentStatus: ApplicationStatus;
  currentStage: string;
  history?: WorkflowHistory[];
}

interface WorkflowStageConfig {
  id: string;
  name: string;
  actor: string;
}

const ORDERED_STAGES: WorkflowStageConfig[] = [
  { id: 'SUBMITTED', name: 'Application Submitted', actor: 'Beneficiary' },
  { id: 'ELIGIBILITY_CHECK', name: 'Automatic Eligibility Scoring', actor: 'Scoring Engine' },
  { id: 'FIELD_VERIFICATION', name: 'Field Ground Verification', actor: 'Field Officer' },
  { id: 'DISTRICT_VERIFICATION', name: 'District Review & Scrutiny', actor: 'District Officer' },
  { id: 'FINANCE_VERIFICATION', name: 'Finance Grant Sanction', actor: 'Finance Approver' },
  { id: 'DISBURSEMENT_MILESTONES', name: 'Staged Fund Disbursement', actor: 'Treasury & PFMS' },
  { id: 'COMPLETED', name: 'Compliance & Completion', actor: 'State Administration' },
];

export const Timeline: React.FC<TimelineProps> = ({ currentStatus, currentStage, history = [] }) => {
  const getStageIndex = (stage: string, status: string): number => {
    if (status === 'DRAFT') return -1;
    if (status === 'SUBMITTED') return 0;
    if (status === 'ELIGIBILITY_CHECK') return 1;
    if (status === 'ELIGIBLE' || stage === 'FIELD_VERIFICATION') return 2;
    if (stage === 'DISTRICT_VERIFICATION') return 3;
    if (stage === 'FINANCE_VERIFICATION') return 4;
    if (
      status === 'APPROVED' ||
      status === 'DISBURSEMENT_PENDING' ||
      status === 'PARTIALLY_DISBURSED' ||
      stage === 'DISBURSEMENT_MILESTONES'
    )
      return 5;
    if (status === 'FULLY_DISBURSED' || status === 'COMPLETED') return 6;
    if (status === 'REJECTED' || status === 'INELIGIBLE') return 2;
    return 2;
  };

  const activeIndex = getStageIndex(currentStage, currentStatus);
  const isRejected = currentStatus === 'REJECTED' || currentStatus === 'INELIGIBLE';
  const isReapplication = currentStatus === 'REAPPLICATION_REQUIRED';

  return (
    <div className="space-y-6">
      {/* Visual Stepper Bar */}
      <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between overflow-x-auto pb-2 gap-2">
          {ORDERED_STAGES.map((step, idx) => {
            const isDone = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const isPending = idx > activeIndex;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center min-w-[110px] text-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs transition-colors ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isCurrent
                        ? isRejected
                          ? 'bg-red-600 text-white ring-4 ring-red-100'
                          : isReapplication
                          ? 'bg-orange-500 text-white ring-4 ring-orange-100'
                          : 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isCurrent ? (
                      isRejected ? (
                        <XCircle className="w-5 h-5" />
                      ) : isReapplication ? (
                        <CircleAlert className="w-5 h-5" />
                      ) : (
                        idx + 1
                      )
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-800 mt-2 leading-tight">
                    {step.name}
                  </span>
                  <span className="text-[10px] text-slate-500">{step.actor}</span>
                </div>
                {idx < ORDERED_STAGES.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 min-w-[20px] self-center -mt-6 ${
                      idx < activeIndex ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* History Log Timeline */}
      <div className="border border-slate-200 rounded-xl bg-white p-5 shadow-xs">
        <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Workflow Transition & Verification History
        </h4>

        {history.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-2">No historical transitions recorded yet.</p>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {history.map((record, index) => {
              const isReverse =
                record.action === 'REQUEST_REAPPLICATION' || record.action === 'REQUEST_REVERIFICATION';
              const isResubmit = record.action === 'APPLICATION_RESUBMITTED';

              return (
                <div key={record.id || index} className="relative group">
                  <div
                    className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${
                      isReverse
                        ? 'bg-orange-600'
                        : isResubmit
                        ? 'bg-amber-600'
                        : 'bg-blue-600'
                    }`}
                  />
                  <div
                    className={`p-3.5 rounded-lg border transition-colors ${
                      isReverse
                        ? 'bg-orange-50/70 border-orange-200'
                        : isResubmit
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{record.actorName}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            isReverse
                              ? 'bg-orange-100 text-orange-900 border border-orange-200'
                              : isResubmit
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {record.actorRole}
                        </span>
                        {isReverse && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-orange-200 text-orange-950 flex items-center gap-1">
                            <RotateCcw className="w-2.5 h-2.5" />
                            Reverse Flow
                          </span>
                        )}
                        {isResubmit && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            <RotateCcw className="w-2.5 h-2.5" />
                            Returned to Queue
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(record.timestamp).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1.5">
                      <span className="font-medium text-slate-700">{record.action.replace(/_/g, ' ')}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span
                        className={`font-semibold ${
                          isReverse
                            ? 'text-orange-800'
                            : isResubmit
                            ? 'text-amber-800'
                            : 'text-emerald-700'
                        }`}
                      >
                        {record.toStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {record.remarks && (
                      <p className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200 mt-1 leading-relaxed">
                        "{record.remarks}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
