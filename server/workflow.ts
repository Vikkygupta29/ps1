import {
  db,
  Application,
  ApplicationStatus,
  WorkflowHistory,
  VerificationRecord,
  DisbursementPlan,
  DisbursementMilestone,
  AuditLog,
  Notification,
} from './db';

export interface WorkflowTransitionResult {
  success: boolean;
  message: string;
  nextStatus?: ApplicationStatus;
  nextStage?: string;
  application?: Application;
}

export function logAudit(
  userId: string,
  userName: string,
  userRole: string,
  action: string,
  remarks: string,
  applicationId?: string,
  previousStatus?: string,
  newStatus?: string,
  ipAddress = '127.0.0.1'
) {
  const auditLogs = db.get('auditLogs');
  const newLog: AuditLog = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    userName,
    userRole,
    applicationId,
    action,
    previousStatus,
    newStatus,
    remarks,
    ipAddress,
    timestamp: new Date().toISOString(),
  };
  auditLogs.unshift(newLog);
  db.set('auditLogs', auditLogs);
}

export function createNotification(
  userId: string,
  userRole: string | undefined,
  title: string,
  message: string,
  type: Notification['type'],
  link?: string
) {
  const notifications = db.get('notifications');
  const notif: Notification = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    userRole,
    title,
    message,
    type,
    isRead: false,
    link,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(notif);
  db.set('notifications', notifications);
}

export function advanceWorkflowStage(
  application: Application,
  actor: { id: string; fullName: string; role: string },
  action: 'APPROVE' | 'REJECT' | 'REQUEST_REAPPLICATION' | 'REQUEST_REVERIFICATION',
  remarks: string,
  groundChecklist?: { label: string; passed: boolean }[],
  requestedChanges?: string[],
  evidenceNotes?: string
): WorkflowTransitionResult {
  const currentStage = application.currentStage;
  const currentStatus = application.status;
  let nextStatus: ApplicationStatus = currentStatus;
  let nextStage = currentStage;

  // Record verification record
  const verifications = db.get('verifications');
  const verificationRecord: VerificationRecord = {
    id: `v-${Date.now()}`,
    applicationId: application.id,
    officerId: actor.id,
    officerName: actor.fullName,
    officerRole: actor.role as any,
    stage: currentStage,
    action,
    remarks,
    groundChecklist,
    evidenceNotes,
    timestamp: new Date().toISOString(),
  };
  verifications.unshift(verificationRecord);
  db.set('verifications', verifications);

  if (action === 'REJECT') {
    nextStatus = 'REJECTED';
    nextStage = 'REJECTED';
    application.status = nextStatus;
    application.currentStage = nextStage;
    application.updatedAt = new Date().toISOString();

    createNotification(
      application.beneficiaryId,
      'BENEFICIARY',
      'Application Status: Rejected',
      `Your application ${application.applicationNumber} was rejected during ${currentStage}. Reason: ${remarks}`,
      'WARNING',
      `/beneficiary/applications/${application.id}`
    );
  } else if (action === 'REQUEST_REAPPLICATION') {
    nextStatus = 'REAPPLICATION_REQUIRED';
    nextStage = 'REAPPLICATION';
    application.status = nextStatus;
    application.currentStage = nextStage;
    application.reapplicationRequest = {
      requestedBy: actor.fullName,
      officerRole: actor.role,
      fromStage: currentStage,
      returnToStage: currentStage,
      reason: remarks,
      remarks,
      requestedChanges: requestedChanges && requestedChanges.length > 0 ? requestedChanges : ['Updated income document or project description required'],
      requestedAt: new Date().toISOString(),
    };
    application.updatedAt = new Date().toISOString();

    createNotification(
      application.beneficiaryId,
      'BENEFICIARY',
      'Action Required: Re-application Requested',
      `Officer ${actor.fullName} (${actor.role}) requested revisions for application ${application.applicationNumber}. Remarks: "${remarks}". Please rectify and resubmit.`,
      'ACTION_REQUIRED',
      `/beneficiary/applications/${application.id}`
    );
  } else if (action === 'REQUEST_REVERIFICATION') {
    // Send back to prior officer stage
    let targetOfficerRole = 'FIELD_OFFICER';
    if (actor.role === 'FINANCE_APPROVER') {
      nextStatus = 'DISTRICT_VERIFICATION';
      nextStage = 'DISTRICT_VERIFICATION';
      targetOfficerRole = 'DISTRICT_OFFICER';
    } else if (actor.role === 'DISTRICT_OFFICER') {
      nextStatus = 'FIELD_VERIFICATION';
      nextStage = 'FIELD_VERIFICATION';
      targetOfficerRole = 'FIELD_OFFICER';
    } else {
      nextStatus = 'FIELD_VERIFICATION';
      nextStage = 'FIELD_VERIFICATION';
      targetOfficerRole = 'FIELD_OFFICER';
    }
    application.status = nextStatus;
    application.currentStage = nextStage;
    application.reverificationNote = {
      requestedBy: actor.fullName,
      officerRole: actor.role,
      fromStage: currentStage,
      reason: remarks,
      requestedAt: new Date().toISOString(),
    };
    application.updatedAt = new Date().toISOString();

    const users = db.get('users');
    const targetOfficer = users.find((u) => u.role === targetOfficerRole);
    if (targetOfficer) {
      createNotification(
        targetOfficer.id,
        targetOfficerRole,
        `Application Returned for Re-verification (${application.applicationNumber})`,
        `${actor.fullName} (${actor.role}) sent back application ${application.applicationNumber} to your queue for ground re-inspection: "${remarks}"`,
        'ACTION_REQUIRED',
        targetOfficerRole === 'FIELD_OFFICER' ? '/officer/field-queue' : '/officer/district-queue'
      );
    }

    createNotification(
      application.beneficiaryId,
      'BENEFICIARY',
      'Application Re-verification Scheduled',
      `Application ${application.applicationNumber} sent back to ${targetOfficerRole.replace('_', ' ')} for additional scrutiny: ${remarks}`,
      'INFO',
      `/beneficiary/applications/${application.id}`
    );
  } else if (action === 'APPROVE') {
    // Stage Transitions based on standard workflow
    if (actor.role === 'FIELD_OFFICER') {
      if (currentStage !== 'FIELD_VERIFICATION') {
        return {
          success: false,
          message: `Cannot approve at ${currentStage}. Application must be in FIELD_VERIFICATION.`,
        };
      }
      nextStatus = 'DISTRICT_VERIFICATION';
      nextStage = 'DISTRICT_VERIFICATION';
      application.status = nextStatus;
      application.currentStage = nextStage;

      // Notify District Officer & Beneficiary
      const users = db.get('users');
      const districtOfficer = users.find((u) => u.role === 'DISTRICT_OFFICER');
      if (districtOfficer) {
        createNotification(
          districtOfficer.id,
          'DISTRICT_OFFICER',
          'District Verification Ready',
          `Application ${application.applicationNumber} cleared field check. Awaiting district approval.`,
          'ACTION_REQUIRED',
          '/officer/district-queue'
        );
      }
      createNotification(
        application.beneficiaryId,
        'BENEFICIARY',
        'Field Verification Cleared',
        `Field Officer ${actor.fullName} approved your application. Forwarded to District Officer.`,
        'SUCCESS',
        `/beneficiary/applications/${application.id}`
      );
    } else if (actor.role === 'DISTRICT_OFFICER') {
      if (currentStage !== 'DISTRICT_VERIFICATION') {
        return {
          success: false,
          message: `Cannot approve at ${currentStage}. Application must be in DISTRICT_VERIFICATION.`,
        };
      }
      nextStatus = 'FINANCE_VERIFICATION';
      nextStage = 'FINANCE_VERIFICATION';
      application.status = nextStatus;
      application.currentStage = nextStage;

      // Notify Finance Approver
      const users = db.get('users');
      const financeOfficer = users.find((u) => u.role === 'FINANCE_APPROVER');
      if (financeOfficer) {
        createNotification(
          financeOfficer.id,
          'FINANCE_APPROVER',
          'Application Awaiting Grant Sanction',
          `Application ${application.applicationNumber} cleared district scrutiny for ₹${application.grantAmount.toLocaleString('en-IN')}.`,
          'ACTION_REQUIRED',
          '/finance/queue'
        );
      }
      createNotification(
        application.beneficiaryId,
        'BENEFICIARY',
        'District Approval Cleared',
        `District Officer approved your application. Forwarded to State Finance for fund sanction.`,
        'SUCCESS',
        `/beneficiary/applications/${application.id}`
      );
    } else if (actor.role === 'FINANCE_APPROVER' || actor.role === 'ADMIN') {
      if (currentStage !== 'FINANCE_VERIFICATION' && actor.role !== 'ADMIN') {
        return {
          success: false,
          message: `Cannot approve at ${currentStage}. Application must be in FINANCE_VERIFICATION.`,
        };
      }
      nextStatus = 'APPROVED';
      nextStage = 'DISBURSEMENT_PENDING';
      application.status = nextStatus;
      application.currentStage = nextStage;

      // Automatically generate Staged Disbursement Plan
      const schemes = db.get('schemes');
      const scheme = schemes.find((s) => s.id === application.schemeId);
      const milestoneTemplates = scheme?.defaultMilestones || [
        { name: 'Milestone 1: Project Setup', percentage: 40, requiredDoc: 'Setup Invoices & Receipts', dueDays: 30 },
        { name: 'Milestone 2: Commercial Operation Proof', percentage: 60, requiredDoc: 'Utilization Certificate & Photos', dueDays: 90 },
      ];

      const disbursementPlans = db.get('disbursementPlans');
      const planId = `dp-${Date.now()}`;
      const now = new Date();

      const milestones: DisbursementMilestone[] = milestoneTemplates.map((tpl, idx) => {
        const dueDate = new Date();
        dueDate.setDate(now.getDate() + tpl.dueDays);
        const milestoneAmount = Math.round((application.grantAmount * tpl.percentage) / 100);

        return {
          id: `ms-${Date.now()}-${idx + 1}`,
          planId,
          applicationId: application.id,
          milestoneNumber: idx + 1,
          milestoneName: tpl.name,
          description: `Disbursement tranche ${idx + 1} upon verification of ${tpl.requiredDoc}`,
          amount: milestoneAmount,
          dueDate: dueDate.toISOString().split('T')[0],
          requiredComplianceDoc: tpl.requiredDoc,
          status: idx === 0 ? 'PENDING' : 'PENDING',
          remarks: 'Milestone schedule created upon Finance approval.',
        };
      });

      const newPlan: DisbursementPlan = {
        id: planId,
        applicationId: application.id,
        schemeId: application.schemeId,
        totalGrantAmount: application.grantAmount,
        totalMilestones: milestones.length,
        status: 'ACTIVE',
        createdAt: now.toISOString(),
        approvedAt: now.toISOString(),
        milestones,
      };

      disbursementPlans.push(newPlan);
      db.set('disbursementPlans', disbursementPlans);

      // Deduct/allocate budget from scheme
      if (scheme) {
        scheme.allocatedBudget = (scheme.allocatedBudget || 0) + application.grantAmount;
        db.set('schemes', schemes);
      }

      createNotification(
        application.beneficiaryId,
        'BENEFICIARY',
        'Grant Approved & Sanctioned!',
        `Congratulations! Your grant of ₹${application.grantAmount.toLocaleString('en-IN')} is approved. Staged disbursement plan created.`,
        'SUCCESS',
        `/beneficiary/applications/${application.id}`
      );
    }
  }

  application.updatedAt = new Date().toISOString();

  // Update application in DB
  const applications = db.get('applications');
  const appIndex = applications.findIndex((a) => a.id === application.id);
  if (appIndex !== -1) {
    applications[appIndex] = application;
    db.set('applications', applications);
  }

  // Record Workflow History
  const history = db.get('workflowHistory');
  const historyItem: WorkflowHistory = {
    id: `wf-${Date.now()}`,
    applicationId: application.id,
    fromStage: currentStage,
    toStage: nextStage,
    fromStatus: currentStatus,
    toStatus: nextStatus,
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    action,
    remarks,
    timestamp: new Date().toISOString(),
  };
  history.unshift(historyItem);
  db.set('workflowHistory', history);

  // Log Audit
  logAudit(
    actor.id,
    actor.fullName,
    actor.role,
    `${actor.role}_${action}`,
    remarks,
    application.id,
    currentStatus,
    nextStatus
  );

  return {
    success: true,
    message: `Application workflow advanced to ${nextStage} (${nextStatus}).`,
    nextStatus,
    nextStage,
    application,
  };
}
