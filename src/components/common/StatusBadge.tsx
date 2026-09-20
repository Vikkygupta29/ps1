import React from 'react';
import { ApplicationStatus } from '../../types';

interface StatusBadgeProps {
  status: ApplicationStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyle = () => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'SUBMITTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ELIGIBILITY_CHECK':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse';
      case 'ELIGIBLE':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'INELIGIBLE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'FIELD_VERIFICATION':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'DISTRICT_VERIFICATION':
        return 'bg-sky-50 text-sky-800 border-sky-300';
      case 'FINANCE_VERIFICATION':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'REJECTED':
        return 'bg-red-50 text-red-800 border-red-300';
      case 'REAPPLICATION_REQUIRED':
        return 'bg-orange-50 text-orange-850 border-orange-400 font-medium';
      case 'REVERIFICATION_REQUESTED':
        return 'bg-amber-100 text-amber-900 border-amber-400';
      case 'DISBURSEMENT_PENDING':
        return 'bg-cyan-50 text-cyan-800 border-cyan-300';
      case 'PARTIALLY_DISBURSED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'FULLY_DISBURSED':
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-900 border-emerald-400 font-semibold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getLabel = () => {
    return status.replace(/_/g, ' ');
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium uppercase tracking-wider ${sizeClasses} ${getStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {getLabel()}
    </span>
  );
};
