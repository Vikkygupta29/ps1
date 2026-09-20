import { db, DisbursementPlan, DisbursementMilestone, Application } from './db';
import { logAudit, createNotification } from './workflow';

export function submitMilestoneCompliance(
  milestoneId: string,
  docName: string,
  docUrl: string,
  remarks: string,
  actor: { id: string; fullName: string; role: string }
) {
  const plans = db.get('disbursementPlans');
  let targetMilestone: DisbursementMilestone | null = null;
  let targetPlan: DisbursementPlan | null = null;

  for (const p of plans) {
    const ms = p.milestones.find((m) => m.id === milestoneId);
    if (ms) {
      targetMilestone = ms;
      targetPlan = p;
      break;
    }
  }

  if (!targetMilestone || !targetPlan) {
    throw new Error('Milestone not found');
  }

  targetMilestone.submittedDocName = docName;
  targetMilestone.submittedDocUrl = docUrl || '/docs/compliance_proof.pdf';
  targetMilestone.submittedAt = new Date().toISOString();
  targetMilestone.complianceRemarks = remarks;
  targetMilestone.status = 'COMPLIANCE_SUBMITTED';

  db.set('disbursementPlans', plans);

  // Notify Finance & Field Officers
  const users = db.get('users');
  const financeUser = users.find((u) => u.role === 'FINANCE_APPROVER');
  if (financeUser) {
    createNotification(
      financeUser.id,
      'FINANCE_APPROVER',
      'Compliance Proof Submitted',
      `Milestone compliance proof submitted for Milestone #${targetMilestone.milestoneNumber} (${targetMilestone.milestoneName}). Ready for review.`,
      'ACTION_REQUIRED',
      `/finance/disbursements`
    );
  }

  logAudit(
    actor.id,
    actor.fullName,
    actor.role,
    'COMPLIANCE_PROOF_SUBMITTED',
    `Submitted compliance document: ${docName} for ${targetMilestone.milestoneName}`,
    targetMilestone.applicationId
  );

  return targetMilestone;
}

export function reviewMilestoneCompliance(
  milestoneId: string,
  decision: 'APPROVE' | 'REJECT',
  remarks: string,
  actor: { id: string; fullName: string; role: string }
) {
  const plans = db.get('disbursementPlans');
  let targetMilestone: DisbursementMilestone | null = null;
  let targetPlan: DisbursementPlan | null = null;

  for (const p of plans) {
    const ms = p.milestones.find((m) => m.id === milestoneId);
    if (ms) {
      targetMilestone = ms;
      targetPlan = p;
      break;
    }
  }

  if (!targetMilestone || !targetPlan) {
    throw new Error('Milestone not found');
  }

  if (decision === 'APPROVE') {
    targetMilestone.status = 'APPROVED';
    targetMilestone.remarks = remarks || 'Compliance documents approved. Ready for DBT fund release.';
  } else {
    targetMilestone.status = 'FAILED';
    targetMilestone.remarks = remarks || 'Compliance proof rejected. Resubmission required.';
  }

  db.set('disbursementPlans', plans);

  const applications = db.get('applications');
  const app = applications.find((a) => a.id === targetPlan!.applicationId);
  if (app) {
    createNotification(
      app.beneficiaryId,
      'BENEFICIARY',
      decision === 'APPROVE' ? 'Milestone Compliance Approved' : 'Milestone Compliance Rejected',
      `Your compliance verification for ${targetMilestone.milestoneName} was ${decision.toLowerCase()}d: ${remarks}`,
      decision === 'APPROVE' ? 'SUCCESS' : 'WARNING',
      `/beneficiary/applications/${app.id}`
    );
  }

  logAudit(
    actor.id,
    actor.fullName,
    actor.role,
    `COMPLIANCE_${decision}D`,
    remarks,
    targetMilestone.applicationId
  );

  return targetMilestone;
}

export function releaseMilestoneFund(
  milestoneId: string,
  transactionRef: string,
  paymentMode: string,
  remarks: string,
  actor: { id: string; fullName: string; role: string }
) {
  const plans = db.get('disbursementPlans');
  let targetMilestone: DisbursementMilestone | null = null;
  let targetPlan: DisbursementPlan | null = null;

  for (const p of plans) {
    const ms = p.milestones.find((m) => m.id === milestoneId);
    if (ms) {
      targetMilestone = ms;
      targetPlan = p;
      break;
    }
  }

  if (!targetMilestone || !targetPlan) {
    throw new Error('Milestone not found');
  }

  const generatedTx = transactionRef || `PFMS-DBT-${new Date().getFullYear()}-${Math.floor(10000000 + Math.random() * 90000000)}`;

  targetMilestone.status = 'RELEASED';
  targetMilestone.releasedDate = new Date().toISOString();
  targetMilestone.transactionRef = generatedTx;
  targetMilestone.paymentMode = paymentMode || 'Direct Benefit Transfer (PFMS DBT)';
  targetMilestone.remarks = remarks || 'Grant installment funds released to beneficiary bank account.';

  db.set('disbursementPlans', plans);

  // Update Scheme Disbursed Budget
  const schemes = db.get('schemes');
  const scheme = schemes.find((s) => s.id === targetPlan!.schemeId);
  if (scheme) {
    scheme.disbursedBudget = (scheme.disbursedBudget || 0) + targetMilestone.amount;
    db.set('schemes', schemes);
  }

  // Update Application Status
  const applications = db.get('applications');
  const app = applications.find((a) => a.id === targetPlan!.applicationId);
  if (app) {
    const allReleased = targetPlan.milestones.every((m) => m.status === 'RELEASED');
    const anyReleased = targetPlan.milestones.some((m) => m.status === 'RELEASED');

    if (allReleased) {
      app.status = 'FULLY_DISBURSED';
      app.currentStage = 'COMPLETED';
    } else if (anyReleased) {
      app.status = 'PARTIALLY_DISBURSED';
      app.currentStage = 'DISBURSEMENT_MILESTONES';
    }
    app.updatedAt = new Date().toISOString();
    db.set('applications', applications);

    createNotification(
      app.beneficiaryId,
      'BENEFICIARY',
      'Fund Released to Bank Account!',
      `Tranche amount ₹${targetMilestone.amount.toLocaleString('en-IN')} released via ${targetMilestone.paymentMode}. Ref: ${generatedTx}`,
      'SUCCESS',
      `/beneficiary/applications/${app.id}`
    );

    logAudit(
      actor.id,
      actor.fullName,
      actor.role,
      'FUND_TRANCHE_RELEASED',
      `Released ₹${targetMilestone.amount.toLocaleString('en-IN')} for ${targetMilestone.milestoneName} Ref: ${generatedTx}`,
      app.id,
      'DISBURSEMENT_PENDING',
      app.status
    );
  }

  return { milestone: targetMilestone, plan: targetPlan };
}
