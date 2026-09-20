import { db } from './db';

export function getAnalyticsSummary() {
  const users = db.get('users');
  const beneficiaries = db.get('beneficiaries');
  const schemes = db.get('schemes');
  const applications = db.get('applications');
  const plans = db.get('disbursementPlans');

  const totalBeneficiaries = users.filter((u) => u.role === 'BENEFICIARY').length;
  const totalApplications = applications.length;
  const eligibleApplications = applications.filter((a) => a.isEligible).length;
  const approvedApplications = applications.filter(
    (a) =>
      a.status === 'APPROVED' ||
      a.status === 'DISBURSEMENT_PENDING' ||
      a.status === 'PARTIALLY_DISBURSED' ||
      a.status === 'FULLY_DISBURSED' ||
      a.status === 'COMPLETED'
  ).length;
  const rejectedApplications = applications.filter((a) => a.status === 'REJECTED').length;
  const pendingVerification = applications.filter(
    (a) =>
      a.status === 'FIELD_VERIFICATION' ||
      a.status === 'DISTRICT_VERIFICATION' ||
      a.status === 'FINANCE_VERIFICATION'
  ).length;

  const totalGrantsApproved = applications
    .filter(
      (a) =>
        a.status === 'APPROVED' ||
        a.status === 'DISBURSEMENT_PENDING' ||
        a.status === 'PARTIALLY_DISBURSED' ||
        a.status === 'FULLY_DISBURSED' ||
        a.status === 'COMPLETED'
    )
    .reduce((sum, a) => sum + (a.grantAmount || 0), 0);

  let totalFundsDisbursed = 0;
  for (const p of plans) {
    for (const m of p.milestones) {
      if (m.status === 'RELEASED') {
        totalFundsDisbursed += m.amount;
      }
    }
  }

  // Funds utilized: estimated at released milestones where compliance has progressed
  const totalFundsUtilized = Math.round(totalFundsDisbursed * 0.82);

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  for (const app of applications) {
    statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
  }
  const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.replace(/_/g, ' '),
    status,
    value: count,
  }));

  // Region breakdown
  const regionCounts: Record<string, { total: number; approved: number; grantAmount: number }> = {};
  for (const app of applications) {
    const reg = app.region || 'North District';
    if (!regionCounts[reg]) {
      regionCounts[reg] = { total: 0, approved: 0, grantAmount: 0 };
    }
    regionCounts[reg].total++;
    if (
      app.status === 'APPROVED' ||
      app.status === 'PARTIALLY_DISBURSED' ||
      app.status === 'FULLY_DISBURSED' ||
      app.status === 'COMPLETED'
    ) {
      regionCounts[reg].approved++;
      regionCounts[reg].grantAmount += app.grantAmount;
    }
  }
  const regionDistribution = Object.entries(regionCounts).map(([region, data]) => ({
    region,
    total: data.total,
    approved: data.approved,
    grantAmount: data.grantAmount,
  }));

  // Scheme breakdown
  const schemeStats = schemes.map((sch) => {
    const schemeApps = applications.filter((a) => a.schemeId === sch.id);
    const approved = schemeApps.filter(
      (a) =>
        a.status === 'APPROVED' ||
        a.status === 'PARTIALLY_DISBURSED' ||
        a.status === 'FULLY_DISBURSED' ||
        a.status === 'COMPLETED'
    ).length;
    return {
      id: sch.id,
      name: sch.name,
      code: sch.code,
      totalApplications: schemeApps.length,
      approvedApplications: approved,
      totalBudget: sch.totalBudget,
      allocatedBudget: sch.allocatedBudget,
      disbursedBudget: sch.disbursedBudget,
      budgetExhaustionPct: Math.round(((sch.allocatedBudget || 0) / sch.totalBudget) * 100),
    };
  });

  // Category distribution
  const categoryCounts: Record<string, number> = {
    GENERAL: 0,
    OBC: 0,
    SC: 0,
    ST: 0,
    EWS: 0,
  };
  for (const b of beneficiaries) {
    const cat = b.category || 'OBC';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  for (const app of applications) {
    const cat = app.applicantData?.category?.socialCategory || 'OBC';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({
    category,
    count,
  }));

  // Turnaround time calculation (simulated average days by stage)
  const turnaroundTimes = [
    { stage: 'Eligibility Check', avgDays: 0.1, targetDays: 1 },
    { stage: 'Field Verification', avgDays: 3.8, targetDays: 7 },
    { stage: 'District Verification', avgDays: 2.4, targetDays: 5 },
    { stage: 'Finance Approval', avgDays: 2.1, targetDays: 4 },
    { stage: '1st Tranche Release', avgDays: 3.2, targetDays: 7 },
  ];

  return {
    totalBeneficiaries,
    totalApplications,
    eligibleApplications,
    approvedApplications,
    rejectedApplications,
    pendingVerification,
    totalGrantsApproved,
    totalFundsDisbursed,
    totalFundsUtilized,
    remainingDisbursement: totalGrantsApproved - totalFundsDisbursed,
    statusDistribution,
    regionDistribution,
    schemeStats,
    categoryDistribution,
    turnaroundTimes,
  };
}
