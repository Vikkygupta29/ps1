import React from 'react';
import { CheckCircle, XCircle, Award, AlertTriangle } from 'lucide-react';
import { EligibilityResult } from '../../types';
import { Modal } from './Modal';

interface ScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: EligibilityResult | null | undefined;
  schemeName?: string;
}

export const ScorecardModal: React.FC<ScorecardModalProps> = ({
  isOpen,
  onClose,
  result,
  schemeName,
}) => {
  if (!result) return null;

  const scorePercentage = Math.round((result.totalScore / (result.maxScore || 100)) * 100);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Automated Eligibility Scorecard"
      subtitle={schemeName || 'Rules-based algorithmic evaluation report'}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Score Banner */}
        <div
          className={`p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            result.eligible
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xs ${
                result.eligible ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {result.totalScore}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold">
                  {result.eligible ? 'Eligible for Subsidy Grant' : 'Did Not Meet Scheme Threshold'}
                </h4>
                {result.eligible ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
              </div>
              <p className="text-xs opacity-80 mt-0.5">
                Evaluated against scheme eligibility matrix (Qualifying cut-off: 50/100 points)
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-300/60 sm:pl-6">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block">
              Sanctioned Grant Slab
            </span>
            <span className="text-xl font-bold text-slate-900">
              ₹{result.calculatedGrantAmount?.toLocaleString('en-IN') || 0}
            </span>
          </div>
        </div>

        {/* Failed Criteria Warning */}
        {result.failedCriteria && result.failedCriteria.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Non-Compliant Criteria
                </h5>
                <ul className="mt-1 space-y-1 text-xs text-amber-800 list-disc list-inside">
                  {result.failedCriteria.map((fc, i) => (
                    <li key={i}>{fc}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Criteria Evaluation Breakdown Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Evaluated Rule Breakdown
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Total Awarded: {result.totalScore} / {result.maxScore} pts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Criterion</th>
                  <th className="px-4 py-2.5">Rule Mandate</th>
                  <th className="px-4 py-2.5">Applicant Data</th>
                  <th className="px-4 py-2.5 text-center">Score</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.evaluatedCriteria?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.criterionName}</td>
                    <td className="px-4 py-3 text-slate-600">{item.ruleDescription}</td>
                    <td className="px-4 py-3 font-mono text-slate-700 font-medium">
                      {String(item.actualValue)}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                      +{item.pointsAwarded}{' '}
                      <span className="text-slate-400 font-normal">/ {item.maxPoints}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.passed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3" /> Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Evaluation Metadata Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Evaluated on: {new Date(result.evaluatedAt).toLocaleString('en-IN')}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
          >
            Close Scorecard
          </button>
        </div>
      </div>
    </Modal>
  );
};
