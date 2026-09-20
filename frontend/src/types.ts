export type UserRole =
  | 'BENEFICIARY'
  | 'FIELD_OFFICER'
  | 'DISTRICT_OFFICER'
  | 'FINANCE_APPROVER'
  | 'ADMIN';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone: string;
  region: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface SchemeCriterion {
  id: string;
  name: string;
  type: 'INCOME' | 'AGE' | 'CATEGORY' | 'REGION' | 'LAND' | 'PREVIOUS_SUBSIDY' | 'DOCUMENTS' | 'CUSTOM';
  operator: '<=' | '>=' | 'BETWEEN' | 'IN' | 'EQUALS' | 'BOOLEAN';
  value: any;
  points: number;
  isMandatory: boolean;
  description: string;
}

export interface GrantSlab {
  id: string;
  minScore: number;
  maxScore: number;
  grantAmount: number;
  slabName: string;
}

export interface Scheme {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  maxGrant: number;
  minGrant: number;
  totalBudget: number;
  allocatedBudget: number;
  disbursedBudget: number;
  targetRegion: string;
  minAge: number;
  maxAge: number;
  maxIncome: number;
  eligibleCategories: string[];
  requiredDocuments: { type: string; label: string; mandatory: boolean }[];
  criteria: SchemeCriterion[];
  grantSlabs: GrantSlab[];
  workflowStages: string[];
  defaultMilestones: { name: string; percentage: number; requiredDoc: string; dueDays: number }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ELIGIBILITY_CHECK'
  | 'ELIGIBLE'
  | 'INELIGIBLE'
  | 'FIELD_VERIFICATION'
  | 'DISTRICT_VERIFICATION'
  | 'FINANCE_VERIFICATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'REAPPLICATION_REQUIRED'
  | 'REVERIFICATION_REQUESTED'
  | 'DISBURSEMENT_PENDING'
  | 'PARTIALLY_DISBURSED'
  | 'FULLY_DISBURSED'
  | 'COMPLETED';

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  fileUrl?: string;
  fileSize: string;
  uploadedAt: string;
  verified: boolean;
  remarks?: string;
}

export interface EligibilityEvaluation {
  criterionId: string;
  criterionName: string;
  pointsAwarded: number;
  maxPoints: number;
  passed: boolean;
  actualValue: string | number | boolean;
  ruleDescription: string;
}

export interface EligibilityResult {
  id: string;
  applicationId: string;
  totalScore: number;
  maxScore: number;
  eligible: boolean;
  calculatedGrantAmount: number;
  evaluatedCriteria: EligibilityEvaluation[];
  failedCriteria: string[];
  evaluatedAt: string;
}

export interface VerificationRecord {
  id: string;
  applicationId: string;
  officerId: string;
  officerName: string;
  officerRole: UserRole;
  stage: string;
  action: 'APPROVE' | 'REJECT' | 'REQUEST_REAPPLICATION' | 'REQUEST_REVERIFICATION';
  remarks: string;
  groundChecklist?: { label: string; passed: boolean }[];
  evidenceNotes?: string;
  timestamp: string;
}

export interface WorkflowHistory {
  id: string;
  applicationId: string;
  fromStage: string;
  toStage: string;
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  remarks: string;
  timestamp: string;
}

export interface DisbursementMilestone {
  id: string;
  planId: string;
  applicationId: string;
  milestoneNumber: number;
  milestoneName: string;
  description: string;
  amount: number;
  dueDate: string;
  requiredComplianceDoc: string;
  status: 'PENDING' | 'COMPLIANCE_SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'RELEASED' | 'FAILED';
  submittedDocUrl?: string;
  submittedDocName?: string;
  submittedAt?: string;
  complianceRemarks?: string;
  releasedDate?: string;
  transactionRef?: string;
  paymentMode?: string;
  remarks?: string;
}

export interface DisbursementPlan {
  id: string;
  applicationId: string;
  schemeId: string;
  totalGrantAmount: number;
  totalMilestones: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  approvedAt: string;
  milestones: DisbursementMilestone[];
}

export interface Application {
  id: string;
  applicationNumber: string;
  schemeId: string;
  schemeName: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryEmail: string;
  beneficiaryPhone: string;
  region: string;
  status: ApplicationStatus;
  currentStage: string;
  submittedAt?: string;
  eligibilityScore?: number;
  maxScore?: number;
  isEligible?: boolean;
  grantAmount: number;
  documents: ApplicationDocument[];
  applicantData: {
    personal: {
      fullName: string;
      aadhaarNumber: string;
      dateOfBirth: string;
      gender: string;
      phone: string;
      email: string;
    };
    address: {
      addressLine: string;
      district: string;
      state: string;
      pincode: string;
      region: string;
    };
    income: {
      annualIncome: number;
      occupation: string;
      landOwnershipAcres: number;
      familyMembersCount: number;
    };
    category: {
      socialCategory: string;
      isDifferentlyAbled: boolean;
      previousSubsidyReceived: boolean;
    };
    schemeSpecific: {
      proposedProjectTitle: string;
      projectDescription: string;
      estimatedCost: number;
      bankAccountNo: string;
      ifscCode: string;
      bankName: string;
      branchName: string;
    };
  };
  reapplicationRequest?: {
    requestedBy: string;
    officerRole: string;
    fromStage?: string;
    returnToStage?: string;
    reason: string;
    remarks: string;
    requestedChanges: string[];
    requestedAt: string;
  };
  reverificationNote?: {
    requestedBy: string;
    officerRole: string;
    fromStage: string;
    reason: string;
    requestedAt: string;
  };
  revisionCount?: number;
  lastResubmittedAt?: string;
  beneficiaryResponse?: string;
  failureReasons?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  applicationId?: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  remarks: string;
  ipAddress: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  userRole?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ACTION_REQUIRED';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalBeneficiaries: number;
  totalApplications: number;
  eligibleApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  pendingVerification: number;
  totalGrantsApproved: number;
  totalFundsDisbursed: number;
  totalFundsUtilized: number;
  remainingDisbursement: number;
  statusDistribution: { name: string; status: string; value: number }[];
  regionDistribution: { region: string; total: number; approved: number; grantAmount: number }[];
  schemeStats: {
    id: string;
    name: string;
    code: string;
    totalApplications: number;
    approvedApplications: number;
    totalBudget: number;
    allocatedBudget: number;
    disbursedBudget: number;
    budgetExhaustionPct: number;
  }[];
  categoryDistribution: { category: string; count: number }[];
  turnaroundTimes: { stage: string; avgDays: number; targetDays: number }[];
}
