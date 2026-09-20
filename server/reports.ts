import { db } from './db';

export function generateCsvData(type: 'SCHEMES' | 'REGIONS' | 'APPLICATIONS' | 'AUDIT'): string {
  if (type === 'SCHEMES') {
    const schemes = db.get('schemes');
    const headers = ['Scheme Code', 'Scheme Name', 'Category', 'Total Budget (INR)', 'Allocated (INR)', 'Disbursed (INR)', 'Max Grant (INR)', 'Active'];
    const rows = schemes.map((s) => [
      `"${s.code}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.category}"`,
      s.totalBudget,
      s.allocatedBudget,
      s.disbursedBudget,
      s.maxGrant,
      s.isActive ? 'YES' : 'NO',
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  if (type === 'APPLICATIONS') {
    const applications = db.get('applications');
    const headers = ['Application ID', 'Scheme', 'Beneficiary', 'Region', 'Status', 'Current Stage', 'Score', 'Eligible', 'Grant (INR)', 'Submitted At'];
    const rows = applications.map((a) => [
      `"${a.applicationNumber}"`,
      `"${a.schemeName.replace(/"/g, '""')}"`,
      `"${a.beneficiaryName}"`,
      `"${a.region}"`,
      `"${a.status}"`,
      `"${a.currentStage}"`,
      a.eligibilityScore || 0,
      a.isEligible ? 'YES' : 'NO',
      a.grantAmount || 0,
      `"${a.submittedAt || a.createdAt}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  if (type === 'AUDIT') {
    const logs = db.get('auditLogs');
    const headers = ['Timestamp', 'User Name', 'Role', 'Application ID', 'Action', 'Prev Status', 'New Status', 'Remarks', 'IP Address'];
    const rows = logs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.applicationId || 'N/A'}"`,
      `"${l.action}"`,
      `"${l.previousStatus || ''}"`,
      `"${l.newStatus || ''}"`,
      `"${l.remarks.replace(/"/g, '""')}"`,
      `"${l.ipAddress}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  return '';
}
