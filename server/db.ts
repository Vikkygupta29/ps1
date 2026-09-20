import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'BENEFICIARY' | 'FIELD_OFFICER' | 'DISTRICT_OFFICER' | 'FINANCE_APPROVER' | 'ADMIN';
  fullName: string;
  phone: string;
  region: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface BeneficiaryProfile {
  id: string;
  userId: string;
  aadhaarNumber: string;
  dateOfBirth: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  category: 'GENERAL' | 'OBC' | 'SC' | 'ST' | 'EWS';
  annualIncome: number;
  address: string;
  district: string;
  state: string;
  pincode: string;
  bankAccountNo: string;
  ifscCode: string;
  bankName: string;
  occupation: string;
  landOwnershipAcres: number;
  previousSubsidyReceived: boolean;
  createdAt: string;
}

export interface OfficerProfile {
  id: string;
  userId: string;
  officerCode: string;
  designation: string;
  department: string;
  jurisdictionRegion: string;
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
  officerRole: 'FIELD_OFFICER' | 'DISTRICT_OFFICER' | 'FINANCE_APPROVER' | 'ADMIN';
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

export interface DatabaseSchema {
  users: User[];
  beneficiaries: BeneficiaryProfile[];
  officers: OfficerProfile[];
  schemes: Scheme[];
  applications: Application[];
  eligibilityResults: EligibilityResult[];
  verifications: VerificationRecord[];
  workflowHistory: WorkflowHistory[];
  disbursementPlans: DisbursementPlan[];
  auditLogs: AuditLog[];
  notifications: Notification[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'database-store.json');

class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadOrInitialize();
  }

  private loadOrInitialize(): DatabaseSchema {
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse database file, resetting to initial seed', e);
      }
    }
    const initial = this.getInitialSeed();
    this.save(initial);
    return initial;
  }

  public save(dataToSave?: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database to file', e);
    }
  }

  public get<K extends keyof DatabaseSchema>(table: K): DatabaseSchema[K] {
    return this.data[table];
  }

  public set<K extends keyof DatabaseSchema>(table: K, value: DatabaseSchema[K]) {
    this.data[table] = value;
    this.save();
  }

  public resetToSeed() {
    this.data = this.getInitialSeed();
    this.save();
    return this.data;
  }

  private getInitialSeed(): DatabaseSchema {
    // Standard BCrypt hashed password for "password123":
    // $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
    const defaultHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

    const users: User[] = [
      {
        id: 'usr-admin-1',
        username: 'admin',
        email: 'admin@gov.in',
        passwordHash: defaultHash,
        role: 'ADMIN',
        fullName: 'Sunil Mehta, IAS',
        phone: '+91 98765 43210',
        region: 'Central Headquarters',
        status: 'ACTIVE',
        createdAt: '2026-01-01T09:00:00.000Z',
      },
      {
        id: 'usr-fo-1',
        username: 'field_officer',
        email: 'field@gov.in',
        passwordHash: defaultHash,
        role: 'FIELD_OFFICER',
        fullName: 'Rajesh Kumar',
        phone: '+91 98123 45678',
        region: 'North District',
        status: 'ACTIVE',
        createdAt: '2026-01-05T10:00:00.000Z',
      },
      {
        id: 'usr-do-1',
        username: 'district_officer',
        email: 'district@gov.in',
        passwordHash: defaultHash,
        role: 'DISTRICT_OFFICER',
        fullName: 'Dr. Ananya Verma',
        phone: '+91 98234 56789',
        region: 'North District',
        status: 'ACTIVE',
        createdAt: '2026-01-05T11:00:00.000Z',
      },
      {
        id: 'usr-fin-1',
        username: 'finance_officer',
        email: 'finance@gov.in',
        passwordHash: defaultHash,
        role: 'FINANCE_APPROVER',
        fullName: 'Vikram Sengupta',
        phone: '+91 98345 67890',
        region: 'State Finance Directorate',
        status: 'ACTIVE',
        createdAt: '2026-01-05T12:00:00.000Z',
      },
      {
        id: 'usr-ben-1',
        username: 'beneficiary',
        email: 'beneficiary@gov.in',
        passwordHash: defaultHash,
        role: 'BENEFICIARY',
        fullName: 'Priya Sharma',
        phone: '+91 98456 78901',
        region: 'North District',
        status: 'ACTIVE',
        createdAt: '2026-02-01T08:30:00.000Z',
      },
      {
        id: 'usr-ben-2',
        username: 'manoj_patel',
        email: 'manoj.patel@gmail.com',
        passwordHash: defaultHash,
        role: 'BENEFICIARY',
        fullName: 'Manoj Patel',
        phone: '+91 98567 89012',
        region: 'East District',
        status: 'ACTIVE',
        createdAt: '2026-02-10T09:15:00.000Z',
      },
      {
        id: 'usr-ben-3',
        username: 'sunita_devi',
        email: 'sunita.devi@rural.org',
        passwordHash: defaultHash,
        role: 'BENEFICIARY',
        fullName: 'Sunita Devi',
        phone: '+91 98678 90123',
        region: 'South District',
        status: 'ACTIVE',
        createdAt: '2026-02-15T11:45:00.000Z',
      },
    ];

    const beneficiaries: BeneficiaryProfile[] = [
      {
        id: 'ben-prof-1',
        userId: 'usr-ben-1',
        aadhaarNumber: 'XXXX-XXXX-4829',
        dateOfBirth: '1992-06-14',
        age: 34,
        gender: 'FEMALE',
        category: 'OBC',
        annualIncome: 180000,
        address: 'House No. 42, Village Rampur, Tehsil Sadar',
        district: 'North District',
        state: 'State Administration',
        pincode: '110042',
        bankAccountNo: '987654321098',
        ifscCode: 'SBIN0001234',
        bankName: 'State Bank of India',
        occupation: 'Handicrafts & Tailoring Artisan',
        landOwnershipAcres: 0.5,
        previousSubsidyReceived: false,
        createdAt: '2026-02-01T08:30:00.000Z',
      },
      {
        id: 'ben-prof-2',
        userId: 'usr-ben-2',
        aadhaarNumber: 'XXXX-XXXX-9102',
        dateOfBirth: '1985-03-22',
        age: 41,
        gender: 'MALE',
        category: 'SC',
        annualIncome: 120000,
        address: 'Farm Plot 18, Block B, Kisan Nagar',
        district: 'East District',
        state: 'State Administration',
        pincode: '110058',
        bankAccountNo: '123456789012',
        ifscCode: 'PUNB0005678',
        bankName: 'Punjab National Bank',
        occupation: 'Small Farmer & Agri Cultivator',
        landOwnershipAcres: 2.1,
        previousSubsidyReceived: false,
        createdAt: '2026-02-10T09:15:00.000Z',
      },
      {
        id: 'ben-prof-3',
        userId: 'usr-ben-3',
        aadhaarNumber: 'XXXX-XXXX-3341',
        dateOfBirth: '1996-11-09',
        age: 29,
        gender: 'FEMALE',
        category: 'EWS',
        annualIncome: 95000,
        address: 'W-14, Old Market Street, Sector 3',
        district: 'South District',
        state: 'State Administration',
        pincode: '110077',
        bankAccountNo: '556677889900',
        ifscCode: 'HDFC0009988',
        bankName: 'HDFC Bank',
        occupation: 'Self Employed Baker',
        landOwnershipAcres: 0,
        previousSubsidyReceived: false,
        createdAt: '2026-02-15T11:45:00.000Z',
      },
    ];

    const officers: OfficerProfile[] = [
      {
        id: 'off-1',
        userId: 'usr-fo-1',
        officerCode: 'FO-ND-101',
        designation: 'Senior Field Verification Officer',
        department: 'District Rural Development Agency',
        jurisdictionRegion: 'North District',
        createdAt: '2026-01-05T10:00:00.000Z',
      },
      {
        id: 'off-2',
        userId: 'usr-do-1',
        officerCode: 'DO-ND-201',
        designation: 'District Welfare & Development Officer',
        department: 'Revenue & Social Welfare',
        jurisdictionRegion: 'North District',
        createdAt: '2026-01-05T11:00:00.000Z',
      },
      {
        id: 'off-3',
        userId: 'usr-fin-1',
        officerCode: 'FIN-HQ-301',
        designation: 'Joint Director of Accounts & Grant Sanction',
        department: 'Finance & Treasury Department',
        jurisdictionRegion: 'State Finance Directorate',
        createdAt: '2026-01-05T12:00:00.000Z',
      },
    ];

    const schemes: Scheme[] = [
      {
        id: 'sch-1',
        code: 'WEMG-2026',
        name: 'Women Entrepreneurship & Micro-Enterprise Grant',
        description:
          'Financial grant scheme supporting women-led micro enterprises, self-help groups, and home-based manufacturing to foster economic empowerment and rural business ventures.',
        category: 'Women Empowerment',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        maxGrant: 200000,
        minGrant: 50000,
        totalBudget: 50000000,
        allocatedBudget: 28400000,
        disbursedBudget: 14200000,
        targetRegion: 'All Districts',
        minAge: 18,
        maxAge: 60,
        maxIncome: 500000,
        eligibleCategories: ['GENERAL', 'OBC', 'SC', 'ST', 'EWS'],
        requiredDocuments: [
          { type: 'AADHAAR', label: 'Aadhaar Identification Card', mandatory: true },
          { type: 'INCOME_CERT', label: 'Tehsildar Certified Income Certificate', mandatory: true },
          { type: 'BANK_PASSBOOK', label: 'Bank Account Passbook / Cancelled Cheque', mandatory: true },
          { type: 'BUSINESS_PLAN', label: 'Micro-Enterprise Proposal / Quotation', mandatory: true },
        ],
        criteria: [
          {
            id: 'c-1',
            name: 'Annual Income Ceiling',
            type: 'INCOME',
            operator: '<=',
            value: 300000,
            points: 30,
            isMandatory: true,
            description: 'Applicant annual family income must not exceed ₹3,00,000 (full 30 pts) or ₹5,00,000 (15 pts).',
          },
          {
            id: 'c-2',
            name: 'Eligible Working Age',
            type: 'AGE',
            operator: 'BETWEEN',
            value: [18, 60],
            points: 20,
            isMandatory: true,
            description: 'Applicant age must be between 18 and 60 years.',
          },
          {
            id: 'c-3',
            name: 'Affirmative Action / Women Priority',
            type: 'CATEGORY',
            operator: 'IN',
            value: ['FEMALE'],
            points: 20,
            isMandatory: true,
            description: 'Exclusive priority and bonus score for female primary applicants.',
          },
          {
            id: 'c-4',
            name: 'Vulnerable Category Inclusivity',
            type: 'CATEGORY',
            operator: 'IN',
            value: ['SC', 'ST', 'OBC', 'EWS'],
            points: 15,
            isMandatory: false,
            description: 'Additional inclusive scoring bonus for SC, ST, OBC or EWS applicants.',
          },
          {
            id: 'c-5',
            name: 'Verified Document Evidence',
            type: 'DOCUMENTS',
            operator: 'EQUALS',
            value: 4,
            points: 15,
            isMandatory: true,
            description: 'Submission of all mandatory legal documents (Aadhaar, Income, Bank, Proposal).',
          },
        ],
        grantSlabs: [
          { id: 'slab-1', minScore: 85, maxScore: 100, grantAmount: 200000, slabName: 'Grade A - Full Grant (₹2,00,000)' },
          { id: 'slab-2', minScore: 70, maxScore: 84, grantAmount: 150000, slabName: 'Grade B - Standard Grant (₹1,50,000)' },
          { id: 'slab-3', minScore: 50, maxScore: 69, grantAmount: 100000, slabName: 'Grade C - Baseline Grant (₹1,00,000)' },
        ],
        workflowStages: ['FIELD_VERIFICATION', 'DISTRICT_VERIFICATION', 'FINANCE_VERIFICATION'],
        defaultMilestones: [
          { name: 'Milestone 1: Workstation Setup & Equipment Procurement', percentage: 30, requiredDoc: 'Equipment Purchase Invoices', dueDays: 30 },
          { name: 'Milestone 2: Raw Material Stocking & Initial Production', percentage: 40, requiredDoc: 'Raw Material Bills & Geo-tagged Photo', dueDays: 75 },
          { name: 'Milestone 3: Enterprise Commercialization & Employment Verification', percentage: 30, requiredDoc: 'Sales Register & Utilization Certificate', dueDays: 120 },
        ],
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'sch-2',
        code: 'PM-SMFIS-26',
        name: 'Small & Marginal Farmer Solar Irrigation Subsidy',
        description:
          'Subsidized solar-powered micro irrigation pump installations for smallhold farmers holding up to 5 acres of cultivable agricultural land.',
        category: 'Agriculture & Irrigation',
        startDate: '2026-01-15',
        endDate: '2026-11-30',
        maxGrant: 160000,
        minGrant: 75000,
        totalBudget: 40000000,
        allocatedBudget: 19200000,
        disbursedBudget: 9600000,
        targetRegion: 'All Districts',
        minAge: 21,
        maxAge: 65,
        maxIncome: 400000,
        eligibleCategories: ['GENERAL', 'OBC', 'SC', 'ST', 'EWS'],
        requiredDocuments: [
          { type: 'AADHAAR', label: 'Aadhaar Card', mandatory: true },
          { type: 'LAND_PATTA', label: 'Land Ownership Record / Khasra-Khatauni', mandatory: true },
          { type: 'INCOME_CERT', label: 'Income Certificate', mandatory: true },
          { type: 'BANK_PASSBOOK', label: 'Bank Passbook Copy', mandatory: true },
        ],
        criteria: [
          {
            id: 'c-201',
            name: 'Land Holding Limitation',
            type: 'LAND',
            operator: '<=',
            value: 5.0,
            points: 35,
            isMandatory: true,
            description: 'Total agricultural land holding must be 5 acres or less.',
          },
          {
            id: 'c-202',
            name: 'Income Ceiling',
            type: 'INCOME',
            operator: '<=',
            value: 300000,
            points: 25,
            isMandatory: true,
            description: 'Annual household income under ₹3 Lakhs.',
          },
          {
            id: 'c-203',
            name: 'Farmer Age Requirement',
            type: 'AGE',
            operator: 'BETWEEN',
            value: [21, 65],
            points: 20,
            isMandatory: true,
            description: 'Applicant age between 21 and 65.',
          },
          {
            id: 'c-204',
            name: 'Required Farm Documentation',
            type: 'DOCUMENTS',
            operator: 'EQUALS',
            value: 4,
            points: 20,
            isMandatory: true,
            description: 'All 4 verified ownership and bank documents present.',
          },
        ],
        grantSlabs: [
          { id: 'slab-201', minScore: 80, maxScore: 100, grantAmount: 160000, slabName: 'Tier 1 - 5HP Solar Pump (₹1,60,000)' },
          { id: 'slab-202', minScore: 60, maxScore: 79, grantAmount: 110000, slabName: 'Tier 2 - 3HP Solar Pump (₹1,10,000)' },
          { id: 'slab-203', minScore: 50, maxScore: 59, grantAmount: 75000, slabName: 'Tier 3 - Micro Surface Pump (₹75,000)' },
        ],
        workflowStages: ['FIELD_VERIFICATION', 'DISTRICT_VERIFICATION', 'FINANCE_VERIFICATION'],
        defaultMilestones: [
          { name: 'Milestone 1: Borewell & Civil Foundation Inspection', percentage: 40, requiredDoc: 'Foundation Geo-tagged Inspection Report', dueDays: 30 },
          { name: 'Milestone 2: Solar Panel & Inverter Installation', percentage: 40, requiredDoc: 'Installation & Commissioning Certificate', dueDays: 60 },
          { name: 'Milestone 3: Water Discharge Flow Test & Handover', percentage: 20, requiredDoc: 'Discharge Flow Test Certificate', dueDays: 90 },
        ],
        isActive: true,
        createdAt: '2026-01-15T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      },
      {
        id: 'sch-3',
        code: 'RATCRS-26',
        name: 'Rural Artisan & Traditional Crafts Revival Scheme',
        description:
          'Direct capital subsidy for purchasing modern toolkits, raw materials, and exhibition setups for generational master artisans and craftsmen.',
        category: 'Artisans & Crafts',
        startDate: '2026-02-01',
        endDate: '2026-10-31',
        maxGrant: 120000,
        minGrant: 40000,
        totalBudget: 25000000,
        allocatedBudget: 11200000,
        disbursedBudget: 6800000,
        targetRegion: 'All Districts',
        minAge: 18,
        maxAge: 70,
        maxIncome: 350000,
        eligibleCategories: ['OBC', 'SC', 'ST', 'EWS'],
        requiredDocuments: [
          { type: 'AADHAAR', label: 'Aadhaar Identification', mandatory: true },
          { type: 'ARTISAN_CARD', label: 'Artisan Pehchan Card or Panchayat Endorsement', mandatory: true },
          { type: 'INCOME_CERT', label: 'Income Certificate', mandatory: true },
          { type: 'BANK_PASSBOOK', label: 'Bank Account Passbook', mandatory: true },
        ],
        criteria: [
          {
            id: 'c-301',
            name: 'Artisan Category Priority',
            type: 'CATEGORY',
            operator: 'IN',
            value: ['OBC', 'SC', 'ST', 'EWS'],
            points: 35,
            isMandatory: true,
            description: 'Reserved affirmative action for traditional craftsman communities.',
          },
          {
            id: 'c-302',
            name: 'Income Evaluation',
            type: 'INCOME',
            operator: '<=',
            value: 250000,
            points: 30,
            isMandatory: true,
            description: 'Annual family income below ₹2,50,000.',
          },
          {
            id: 'c-303',
            name: 'Age Range',
            type: 'AGE',
            operator: 'BETWEEN',
            value: [18, 70],
            points: 15,
            isMandatory: true,
            description: 'Artisans aged 18 to 70 years.',
          },
          {
            id: 'c-304',
            name: 'Artisan Verification Documentation',
            type: 'DOCUMENTS',
            operator: 'EQUALS',
            value: 4,
            points: 20,
            isMandatory: true,
            description: 'All 4 verified artisan and bank documents.',
          },
        ],
        grantSlabs: [
          { id: 'slab-301', minScore: 80, maxScore: 100, grantAmount: 120000, slabName: 'Master Artisan Equipment Grant (₹1,20,000)' },
          { id: 'slab-302', minScore: 60, maxScore: 79, grantAmount: 80000, slabName: 'Skilled Artisan Support (₹80,000)' },
          { id: 'slab-303', minScore: 50, maxScore: 59, grantAmount: 40000, slabName: 'Starter Toolkit Support (₹40,000)' },
        ],
        workflowStages: ['FIELD_VERIFICATION', 'DISTRICT_VERIFICATION', 'FINANCE_VERIFICATION'],
        defaultMilestones: [
          { name: 'Milestone 1: Toolkit Procurement', percentage: 50, requiredDoc: 'Toolkit Invoices & Serial Numbers', dueDays: 30 },
          { name: 'Milestone 2: Exhibition & Product Portfolio', percentage: 50, requiredDoc: 'Craft Portfolio & Sales Proof', dueDays: 90 },
        ],
        isActive: true,
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      },
      {
        id: 'sch-4',
        code: 'YDSSES-26',
        name: 'Youth Digital Skills & Startup Equipment Subsidy',
        description:
          'Technology asset and hardware purchase grant for rural and semi-urban educated youth launching digital service centers, editing studios, or tech micro-enterprises.',
        category: 'Youth & Technology',
        startDate: '2026-03-01',
        endDate: '2026-12-15',
        maxGrant: 80000,
        minGrant: 30000,
        totalBudget: 20000000,
        allocatedBudget: 8400000,
        disbursedBudget: 3200000,
        targetRegion: 'All Districts',
        minAge: 18,
        maxAge: 35,
        maxIncome: 450000,
        eligibleCategories: ['GENERAL', 'OBC', 'SC', 'ST', 'EWS'],
        requiredDocuments: [
          { type: 'AADHAAR', label: 'Aadhaar Identification', mandatory: true },
          { type: 'EDU_CERT', label: 'Educational Diploma / Degree / IT Certificate', mandatory: true },
          { type: 'INCOME_CERT', label: 'Family Income Certificate', mandatory: true },
          { type: 'BANK_PASSBOOK', label: 'Bank Account Statement', mandatory: true },
        ],
        criteria: [
          {
            id: 'c-401',
            name: 'Youth Age Bracket (18-35)',
            type: 'AGE',
            operator: 'BETWEEN',
            value: [18, 35],
            points: 35,
            isMandatory: true,
            description: 'Applicant must be in the youth age bracket of 18 to 35 years.',
          },
          {
            id: 'c-402',
            name: 'Income Eligibility',
            type: 'INCOME',
            operator: '<=',
            value: 400000,
            points: 30,
            isMandatory: true,
            description: 'Annual family income under ₹4 Lakhs.',
          },
          {
            id: 'c-403',
            name: 'Document Validation',
            type: 'DOCUMENTS',
            operator: 'EQUALS',
            value: 4,
            points: 35,
            isMandatory: true,
            description: 'Full submission of educational and financial certificates.',
          },
        ],
        grantSlabs: [
          { id: 'slab-401', minScore: 80, maxScore: 100, grantAmount: 80000, slabName: 'Hardware & Workstation Grant (₹80,000)' },
          { id: 'slab-402', minScore: 60, maxScore: 79, grantAmount: 50000, slabName: 'Digital Device Grant (₹50,000)' },
          { id: 'slab-403', minScore: 50, maxScore: 59, grantAmount: 30000, slabName: 'Basic Toolkit Grant (₹30,000)' },
        ],
        workflowStages: ['FIELD_VERIFICATION', 'DISTRICT_VERIFICATION', 'FINANCE_VERIFICATION'],
        defaultMilestones: [
          { name: 'Milestone 1: Computing Hardware & Software Setup', percentage: 60, requiredDoc: 'Hardware Invoices & Warranty Cards', dueDays: 30 },
          { name: 'Milestone 2: Service Center Commissioning & Invoicing', percentage: 40, requiredDoc: 'Electricity Connection / Lease & Photos', dueDays: 60 },
        ],
        isActive: true,
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
    ];

    const applications: Application[] = [
      {
        id: 'app-1001',
        applicationNumber: 'APP-2026-00101',
        schemeId: 'sch-1',
        schemeName: 'Women Entrepreneurship & Micro-Enterprise Grant',
        beneficiaryId: 'usr-ben-1',
        beneficiaryName: 'Priya Sharma',
        beneficiaryEmail: 'beneficiary@gov.in',
        beneficiaryPhone: '+91 98456 78901',
        region: 'North District',
        status: 'FIELD_VERIFICATION',
        currentStage: 'FIELD_VERIFICATION',
        submittedAt: '2026-03-02T10:30:00.000Z',
        eligibilityScore: 90,
        maxScore: 100,
        isEligible: true,
        grantAmount: 200000,
        documents: [
          { id: 'doc-1', applicationId: 'app-1001', documentType: 'AADHAAR', documentName: 'Aadhaar_PriyaSharma.pdf', documentUrl: '/docs/sample_aadhaar.pdf', fileSize: '1.2 MB', uploadedAt: '2026-03-02T10:15:00.000Z', verified: true },
          { id: 'doc-2', applicationId: 'app-1001', documentType: 'INCOME_CERT', documentName: 'Income_Certificate_2026.pdf', documentUrl: '/docs/sample_income.pdf', fileSize: '850 KB', uploadedAt: '2026-03-02T10:18:00.000Z', verified: true },
          { id: 'doc-3', applicationId: 'app-1001', documentType: 'BANK_PASSBOOK', documentName: 'SBI_Passbook_Priya.pdf', documentUrl: '/docs/sample_bank.pdf', fileSize: '1.4 MB', uploadedAt: '2026-03-02T10:20:00.000Z', verified: true },
          { id: 'doc-4', applicationId: 'app-1001', documentType: 'BUSINESS_PLAN', documentName: 'Tailoring_MicroUnit_Proposal.pdf', documentUrl: '/docs/sample_proposal.pdf', fileSize: '2.1 MB', uploadedAt: '2026-03-02T10:22:00.000Z', verified: true },
        ],
        applicantData: {
          personal: {
            fullName: 'Priya Sharma',
            aadhaarNumber: 'XXXX-XXXX-4829',
            dateOfBirth: '1992-06-14',
            gender: 'FEMALE',
            phone: '+91 98456 78901',
            email: 'beneficiary@gov.in',
          },
          address: {
            addressLine: 'House No. 42, Village Rampur, Tehsil Sadar',
            district: 'North District',
            state: 'State Administration',
            pincode: '110042',
            region: 'North District',
          },
          income: {
            annualIncome: 180000,
            occupation: 'Handicrafts & Tailoring Artisan',
            landOwnershipAcres: 0.5,
            familyMembersCount: 4,
          },
          category: {
            socialCategory: 'OBC',
            isDifferentlyAbled: false,
            previousSubsidyReceived: false,
          },
          schemeSpecific: {
            proposedProjectTitle: 'Shree Balaji Eco-Friendly Jute Bag & Apparel Manufacturing Unit',
            projectDescription: 'Setting up 3 motorized heavy-duty stitching machines, cutting table, and raw jute inventory to employ 4 rural women in Rampur village.',
            estimatedCost: 220000,
            bankAccountNo: '987654321098',
            ifscCode: 'SBIN0001234',
            bankName: 'State Bank of India',
            branchName: 'Sadar Main Branch',
          },
        },
        createdAt: '2026-03-02T09:45:00.000Z',
        updatedAt: '2026-03-02T10:30:00.000Z',
      },
      {
        id: 'app-1002',
        applicationNumber: 'APP-2026-00102',
        schemeId: 'sch-2',
        schemeName: 'Small & Marginal Farmer Solar Irrigation Subsidy',
        beneficiaryId: 'usr-ben-2',
        beneficiaryName: 'Manoj Patel',
        beneficiaryEmail: 'manoj.patel@gmail.com',
        beneficiaryPhone: '+91 98567 89012',
        region: 'North District',
        status: 'DISTRICT_VERIFICATION',
        currentStage: 'DISTRICT_VERIFICATION',
        submittedAt: '2026-02-25T14:20:00.000Z',
        eligibilityScore: 85,
        maxScore: 100,
        isEligible: true,
        grantAmount: 160000,
        documents: [
          { id: 'doc-201', applicationId: 'app-1002', documentType: 'AADHAAR', documentName: 'Manoj_Aadhaar.pdf', documentUrl: '/docs/sample_aadhaar.pdf', fileSize: '1.1 MB', uploadedAt: '2026-02-25T14:00:00.000Z', verified: true },
          { id: 'doc-202', applicationId: 'app-1002', documentType: 'LAND_PATTA', documentName: 'Khasra_Record_Plot18.pdf', documentUrl: '/docs/sample_land.pdf', fileSize: '1.8 MB', uploadedAt: '2026-02-25T14:05:00.000Z', verified: true },
          { id: 'doc-203', applicationId: 'app-1002', documentType: 'INCOME_CERT', documentName: 'Income_Certificate_Manoj.pdf', documentUrl: '/docs/sample_income.pdf', fileSize: '900 KB', uploadedAt: '2026-02-25T14:10:00.000Z', verified: true },
          { id: 'doc-204', applicationId: 'app-1002', documentType: 'BANK_PASSBOOK', documentName: 'PNB_Bank_Passbook.pdf', documentUrl: '/docs/sample_bank.pdf', fileSize: '1.3 MB', uploadedAt: '2026-02-25T14:15:00.000Z', verified: true },
        ],
        applicantData: {
          personal: {
            fullName: 'Manoj Patel',
            aadhaarNumber: 'XXXX-XXXX-9102',
            dateOfBirth: '1985-03-22',
            gender: 'MALE',
            phone: '+91 98567 89012',
            email: 'manoj.patel@gmail.com',
          },
          address: {
            addressLine: 'Farm Plot 18, Block B, Kisan Nagar',
            district: 'North District',
            state: 'State Administration',
            pincode: '110058',
            region: 'North District',
          },
          income: {
            annualIncome: 120000,
            occupation: 'Small Farmer & Agri Cultivator',
            landOwnershipAcres: 2.1,
            familyMembersCount: 5,
          },
          category: {
            socialCategory: 'SC',
            isDifferentlyAbled: false,
            previousSubsidyReceived: false,
          },
          schemeSpecific: {
            proposedProjectTitle: '5HP DC Solar Photovoltaic Submersible Pump Installation',
            projectDescription: 'Installing 5HP solar pump with micro-drip feeder on 2.1 acres wheat & vegetable fields replacing diesel genset.',
            estimatedCost: 180000,
            bankAccountNo: '123456789012',
            ifscCode: 'PUNB0005678',
            bankName: 'Punjab National Bank',
            branchName: 'Kisan Nagar Rural Branch',
          },
        },
        createdAt: '2026-02-25T13:30:00.000Z',
        updatedAt: '2026-02-28T16:00:00.000Z',
      },
      {
        id: 'app-1003',
        applicationNumber: 'APP-2026-00103',
        schemeId: 'sch-3',
        schemeName: 'Rural Artisan & Traditional Crafts Revival Scheme',
        beneficiaryId: 'usr-ben-3',
        beneficiaryName: 'Sunita Devi',
        beneficiaryEmail: 'sunita.devi@rural.org',
        beneficiaryPhone: '+91 98678 90123',
        region: 'North District',
        status: 'FINANCE_VERIFICATION',
        currentStage: 'FINANCE_VERIFICATION',
        submittedAt: '2026-02-18T11:00:00.000Z',
        eligibilityScore: 85,
        maxScore: 100,
        isEligible: true,
        grantAmount: 120000,
        documents: [
          { id: 'doc-301', applicationId: 'app-1003', documentType: 'AADHAAR', documentName: 'Sunita_Aadhaar.pdf', documentUrl: '/docs/sample_aadhaar.pdf', fileSize: '1.0 MB', uploadedAt: '2026-02-18T10:45:00.000Z', verified: true },
          { id: 'doc-302', applicationId: 'app-1003', documentType: 'ARTISAN_CARD', documentName: 'Artisan_Pehchan_Card.pdf', documentUrl: '/docs/sample_artisan.pdf', fileSize: '1.5 MB', uploadedAt: '2026-02-18T10:50:00.000Z', verified: true },
          { id: 'doc-303', applicationId: 'app-1003', documentType: 'INCOME_CERT', documentName: 'Tehsildar_Income.pdf', documentUrl: '/docs/sample_income.pdf', fileSize: '800 KB', uploadedAt: '2026-02-18T10:52:00.000Z', verified: true },
          { id: 'doc-304', applicationId: 'app-1003', documentType: 'BANK_PASSBOOK', documentName: 'HDFC_Passbook.pdf', documentUrl: '/docs/sample_bank.pdf', fileSize: '1.1 MB', uploadedAt: '2026-02-18T10:55:00.000Z', verified: true },
        ],
        applicantData: {
          personal: {
            fullName: 'Sunita Devi',
            aadhaarNumber: 'XXXX-XXXX-3341',
            dateOfBirth: '1996-11-09',
            gender: 'FEMALE',
            phone: '+91 98678 90123',
            email: 'sunita.devi@rural.org',
          },
          address: {
            addressLine: 'W-14, Old Market Street, Sector 3',
            district: 'North District',
            state: 'State Administration',
            pincode: '110077',
            region: 'North District',
          },
          income: {
            annualIncome: 95000,
            occupation: 'Terracotta Pottery & Ceramic Clay Craft',
            landOwnershipAcres: 0,
            familyMembersCount: 3,
          },
          category: {
            socialCategory: 'EWS',
            isDifferentlyAbled: false,
            previousSubsidyReceived: false,
          },
          schemeSpecific: {
            proposedProjectTitle: 'Modern Electric Potter Wheel & Kiln Upgradation',
            projectDescription: 'Upgrading manual stone wheel to energy-efficient electric potter wheels and temperature-controlled smokeless kiln.',
            estimatedCost: 135000,
            bankAccountNo: '556677889900',
            ifscCode: 'HDFC0009988',
            bankName: 'HDFC Bank',
            branchName: 'Civil Lines Branch',
          },
        },
        createdAt: '2026-02-18T10:00:00.000Z',
        updatedAt: '2026-03-01T14:30:00.000Z',
      },
      {
        id: 'app-1004',
        applicationNumber: 'APP-2026-00104',
        schemeId: 'sch-1',
        schemeName: 'Women Entrepreneurship & Micro-Enterprise Grant',
        beneficiaryId: 'usr-ben-1',
        beneficiaryName: 'Priya Sharma',
        beneficiaryEmail: 'beneficiary@gov.in',
        beneficiaryPhone: '+91 98456 78901',
        region: 'North District',
        status: 'PARTIALLY_DISBURSED',
        currentStage: 'DISBURSEMENT_MILESTONES',
        submittedAt: '2026-01-20T09:00:00.000Z',
        eligibilityScore: 90,
        maxScore: 100,
        isEligible: true,
        grantAmount: 200000,
        documents: [
          { id: 'doc-401', applicationId: 'app-1004', documentType: 'AADHAAR', documentName: 'Aadhaar_Priya.pdf', documentUrl: '/docs/sample_aadhaar.pdf', fileSize: '1.2 MB', uploadedAt: '2026-01-20T08:50:00.000Z', verified: true },
          { id: 'doc-402', applicationId: 'app-1004', documentType: 'INCOME_CERT', documentName: 'Income_Cert_2026.pdf', documentUrl: '/docs/sample_income.pdf', fileSize: '850 KB', uploadedAt: '2026-01-20T08:52:00.000Z', verified: true },
          { id: 'doc-403', applicationId: 'app-1004', documentType: 'BANK_PASSBOOK', documentName: 'SBI_Passbook.pdf', documentUrl: '/docs/sample_bank.pdf', fileSize: '1.4 MB', uploadedAt: '2026-01-20T08:55:00.000Z', verified: true },
          { id: 'doc-404', applicationId: 'app-1004', documentType: 'BUSINESS_PLAN', documentName: 'Apparel_Unit_Project.pdf', documentUrl: '/docs/sample_proposal.pdf', fileSize: '2.0 MB', uploadedAt: '2026-01-20T08:58:00.000Z', verified: true },
        ],
        applicantData: {
          personal: {
            fullName: 'Priya Sharma',
            aadhaarNumber: 'XXXX-XXXX-4829',
            dateOfBirth: '1992-06-14',
            gender: 'FEMALE',
            phone: '+91 98456 78901',
            email: 'beneficiary@gov.in',
          },
          address: {
            addressLine: 'House No. 42, Village Rampur, Tehsil Sadar',
            district: 'North District',
            state: 'State Administration',
            pincode: '110042',
            region: 'North District',
          },
          income: {
            annualIncome: 180000,
            occupation: 'Apparel Maker',
            landOwnershipAcres: 0.5,
            familyMembersCount: 4,
          },
          category: {
            socialCategory: 'OBC',
            isDifferentlyAbled: false,
            previousSubsidyReceived: false,
          },
          schemeSpecific: {
            proposedProjectTitle: 'Phase 1 Rural Garment Stitching Workshop',
            projectDescription: 'Completed workshop establishment with 3 single-needle lockstitch machines and employment of 3 local trainees.',
            estimatedCost: 200000,
            bankAccountNo: '987654321098',
            ifscCode: 'SBIN0001234',
            bankName: 'State Bank of India',
            branchName: 'Sadar Main Branch',
          },
        },
        createdAt: '2026-01-20T08:30:00.000Z',
        updatedAt: '2026-02-15T16:45:00.000Z',
      },
    ];

    const eligibilityResults: EligibilityResult[] = [
      {
        id: 'el-1001',
        applicationId: 'app-1001',
        totalScore: 90,
        maxScore: 100,
        eligible: true,
        calculatedGrantAmount: 200000,
        evaluatedCriteria: [
          { criterionId: 'c-1', criterionName: 'Annual Income Ceiling', pointsAwarded: 30, maxPoints: 30, passed: true, actualValue: 180000, ruleDescription: 'Annual income <= ₹3,00,000' },
          { criterionId: 'c-2', criterionName: 'Eligible Working Age', pointsAwarded: 20, maxPoints: 20, passed: true, actualValue: 34, ruleDescription: 'Age between 18 and 60' },
          { criterionId: 'c-3', criterionName: 'Affirmative Action / Women Priority', pointsAwarded: 20, maxPoints: 20, passed: true, actualValue: 'FEMALE', ruleDescription: 'Female primary applicant' },
          { criterionId: 'c-4', criterionName: 'Vulnerable Category Inclusivity', pointsAwarded: 15, maxPoints: 15, passed: true, actualValue: 'OBC', ruleDescription: 'SC/ST/OBC/EWS category' },
          { criterionId: 'c-5', criterionName: 'Verified Document Evidence', pointsAwarded: 5, maxPoints: 15, passed: true, actualValue: 4, ruleDescription: 'All 4 documents attached' },
        ],
        failedCriteria: [],
        evaluatedAt: '2026-03-02T10:30:05.000Z',
      },
      {
        id: 'el-1002',
        applicationId: 'app-1002',
        totalScore: 85,
        maxScore: 100,
        eligible: true,
        calculatedGrantAmount: 160000,
        evaluatedCriteria: [
          { criterionId: 'c-201', criterionName: 'Land Holding Limitation', pointsAwarded: 35, maxPoints: 35, passed: true, actualValue: 2.1, ruleDescription: 'Land <= 5.0 acres' },
          { criterionId: 'c-202', criterionName: 'Income Ceiling', pointsAwarded: 25, maxPoints: 25, passed: true, actualValue: 120000, ruleDescription: 'Income <= ₹3,00,000' },
          { criterionId: 'c-203', criterionName: 'Farmer Age Requirement', pointsAwarded: 20, maxPoints: 20, passed: true, actualValue: 41, ruleDescription: 'Age between 21 and 65' },
          { criterionId: 'c-204', criterionName: 'Required Farm Documentation', pointsAwarded: 5, maxPoints: 20, passed: true, actualValue: 4, ruleDescription: 'All 4 verified documents present' },
        ],
        failedCriteria: [],
        evaluatedAt: '2026-02-25T14:20:05.000Z',
      },
    ];

    const verifications: VerificationRecord[] = [
      {
        id: 'v-201',
        applicationId: 'app-1002',
        officerId: 'usr-fo-1',
        officerName: 'Rajesh Kumar',
        officerRole: 'FIELD_OFFICER',
        stage: 'FIELD_VERIFICATION',
        action: 'APPROVE',
        remarks: 'Physical ground inspection completed at Plot 18, Block B. Cultivable land matches revenue patta record (2.1 acres). Borewell depth and ground water availability verified. Recommended for district sanction.',
        groundChecklist: [
          { label: 'Physical existence of beneficiary verified', passed: true },
          { label: 'Original Aadhaar and land revenue records verified', passed: true },
          { label: 'No existing solar subsidy pump on parcel', passed: true },
          { label: 'Site suitability for 5HP solar array confirmed', passed: true },
        ],
        evidenceNotes: 'GPS Coordinates: 28.6139° N, 77.2090° E. Soil compaction report satisfactory.',
        timestamp: '2026-02-28T16:00:00.000Z',
      },
      {
        id: 'v-301',
        applicationId: 'app-1003',
        officerId: 'usr-fo-1',
        officerName: 'Rajesh Kumar',
        officerRole: 'FIELD_OFFICER',
        stage: 'FIELD_VERIFICATION',
        action: 'APPROVE',
        remarks: 'Inspected traditional terracotta workshop at Sector 3. Artisan Pehchan card authenticated against National Handicrafts Registry.',
        timestamp: '2026-02-22T11:30:00.000Z',
      },
      {
        id: 'v-302',
        applicationId: 'app-1003',
        officerId: 'usr-do-1',
        officerName: 'Dr. Ananya Verma',
        officerRole: 'DISTRICT_OFFICER',
        stage: 'DISTRICT_VERIFICATION',
        action: 'APPROVE',
        remarks: 'District verification cleared. Backward category credentials and income within EWS bracket confirmed. Forwarding to Finance for grant sanction and fund allocation.',
        timestamp: '2026-03-01T14:30:00.000Z',
      },
    ];

    const workflowHistory: WorkflowHistory[] = [
      {
        id: 'wf-101',
        applicationId: 'app-1001',
        fromStage: 'DRAFT',
        toStage: 'SUBMITTED',
        fromStatus: 'DRAFT',
        toStatus: 'SUBMITTED',
        actorId: 'usr-ben-1',
        actorName: 'Priya Sharma',
        actorRole: 'BENEFICIARY',
        action: 'SUBMIT_APPLICATION',
        remarks: 'Application submitted with 4 mandatory legal documents.',
        timestamp: '2026-03-02T10:30:00.000Z',
      },
      {
        id: 'wf-102',
        applicationId: 'app-1001',
        fromStage: 'SUBMITTED',
        toStage: 'ELIGIBILITY_CHECK',
        fromStatus: 'SUBMITTED',
        toStatus: 'ELIGIBLE',
        actorId: 'system',
        actorName: 'Automated Scoring Engine',
        actorRole: 'SYSTEM',
        action: 'AUTOMATIC_EVALUATION',
        remarks: 'Eligibility score calculated: 90/100. Applicant meets all scheme mandates. Qualified for Grade A grant (₹2,00,000).',
        timestamp: '2026-03-02T10:30:05.000Z',
      },
      {
        id: 'wf-103',
        applicationId: 'app-1001',
        fromStage: 'ELIGIBILITY_CHECK',
        toStage: 'FIELD_VERIFICATION',
        fromStatus: 'ELIGIBLE',
        toStatus: 'FIELD_VERIFICATION',
        actorId: 'system',
        actorName: 'Routing Engine',
        actorRole: 'SYSTEM',
        action: 'ROUTE_TO_FIELD_OFFICER',
        remarks: 'Application routed to North District Field Officer (Rajesh Kumar) for on-ground physical inspection.',
        timestamp: '2026-03-02T10:30:06.000Z',
      },
      {
        id: 'wf-201',
        applicationId: 'app-1002',
        fromStage: 'FIELD_VERIFICATION',
        toStage: 'DISTRICT_VERIFICATION',
        fromStatus: 'FIELD_VERIFICATION',
        toStatus: 'DISTRICT_VERIFICATION',
        actorId: 'usr-fo-1',
        actorName: 'Rajesh Kumar',
        actorRole: 'FIELD_OFFICER',
        action: 'APPROVE_FIELD_VERIFICATION',
        remarks: 'Ground verification cleared. Land patta matches on-site survey.',
        timestamp: '2026-02-28T16:00:00.000Z',
      },
      {
        id: 'wf-301',
        applicationId: 'app-1003',
        fromStage: 'DISTRICT_VERIFICATION',
        toStage: 'FINANCE_VERIFICATION',
        fromStatus: 'DISTRICT_VERIFICATION',
        toStatus: 'FINANCE_VERIFICATION',
        actorId: 'usr-do-1',
        actorName: 'Dr. Ananya Verma',
        actorRole: 'DISTRICT_OFFICER',
        action: 'APPROVE_DISTRICT_VERIFICATION',
        remarks: 'District scrutiny complete. Recommended for ₹1,20,000 grant release.',
        timestamp: '2026-03-01T14:30:00.000Z',
      },
    ];

    const disbursementPlans: DisbursementPlan[] = [
      {
        id: 'dp-1004',
        applicationId: 'app-1004',
        schemeId: 'sch-1',
        totalGrantAmount: 200000,
        totalMilestones: 3,
        status: 'ACTIVE',
        createdAt: '2026-02-10T10:00:00.000Z',
        approvedAt: '2026-02-10T10:30:00.000Z',
        milestones: [
          {
            id: 'ms-401',
            planId: 'dp-1004',
            applicationId: 'app-1004',
            milestoneNumber: 1,
            milestoneName: 'Milestone 1: Workstation Setup & Equipment Procurement',
            description: 'Procurement of 3 motorized sewing machines, cutting bench, and electric safety fittings.',
            amount: 60000,
            dueDate: '2026-03-01',
            requiredComplianceDoc: 'Equipment Purchase Invoices & GST Bills',
            status: 'RELEASED',
            submittedDocName: 'GST_Invoice_Juki_Sewing_Machines.pdf',
            submittedDocUrl: '/docs/sample_invoice.pdf',
            submittedAt: '2026-02-12T14:00:00.000Z',
            complianceRemarks: 'Verified original tax invoice #INV-2026-891 from authorized machine vendor.',
            releasedDate: '2026-02-15T16:45:00.000Z',
            transactionRef: 'PFMS-DBT-2026-99018241',
            paymentMode: 'Direct Benefit Transfer (DBT-PFMS)',
            remarks: 'First installment disbursed successfully to beneficiary SBI A/c XXXX9876.',
          },
          {
            id: 'ms-402',
            planId: 'dp-1004',
            applicationId: 'app-1004',
            milestoneNumber: 2,
            milestoneName: 'Milestone 2: Raw Material Stocking & Initial Production',
            description: 'Procurement of organic jute fabric, threads, dyes, and production of initial 200 sample units.',
            amount: 80000,
            dueDate: '2026-04-15',
            requiredComplianceDoc: 'Raw Material Bills & Geo-tagged Photo of Workshop',
            status: 'COMPLIANCE_SUBMITTED',
            submittedDocName: 'Jute_RawMaterial_Bills_WorkshopPhotos.pdf',
            submittedDocUrl: '/docs/sample_compliance_m2.pdf',
            submittedAt: '2026-03-05T11:20:00.000Z',
            complianceRemarks: 'Beneficiary uploaded GST bill for raw fabric and 4 geo-tagged photographs of functional workshop.',
            remarks: 'Awaiting Finance / Field Officer verification for releasing 2nd installment.',
          },
          {
            id: 'ms-403',
            planId: 'dp-1004',
            applicationId: 'app-1004',
            milestoneNumber: 3,
            milestoneName: 'Milestone 3: Enterprise Commercialization & Employment Verification',
            description: 'Commercial sales register, client dispatch receipts, and proof of wages paid to 3 trainee women.',
            amount: 60000,
            dueDate: '2026-06-30',
            requiredComplianceDoc: 'Sales Register & Utilization Certificate (Form GFR-12A)',
            status: 'PENDING',
            remarks: 'Scheduled after successful release of Milestone 2.',
          },
        ],
      },
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'aud-1',
        userId: 'usr-ben-1',
        userName: 'Priya Sharma',
        userRole: 'BENEFICIARY',
        applicationId: 'app-1001',
        action: 'APPLICATION_SUBMITTED',
        previousStatus: 'DRAFT',
        newStatus: 'SUBMITTED',
        remarks: 'Beneficiary submitted application for WEMG-2026 scheme with 4 documents.',
        ipAddress: '103.21.14.82',
        timestamp: '2026-03-02T10:30:00.000Z',
      },
      {
        id: 'aud-2',
        userId: 'system',
        userName: 'Eligibility Scoring Engine',
        userRole: 'SYSTEM',
        applicationId: 'app-1001',
        action: 'ELIGIBILITY_EVALUATION',
        previousStatus: 'SUBMITTED',
        newStatus: 'FIELD_VERIFICATION',
        remarks: 'Scored 90/100. Status updated to FIELD_VERIFICATION and auto-routed to Field Officer.',
        ipAddress: '127.0.0.1',
        timestamp: '2026-03-02T10:30:06.000Z',
      },
      {
        id: 'aud-3',
        userId: 'usr-fo-1',
        userName: 'Rajesh Kumar',
        userRole: 'FIELD_OFFICER',
        applicationId: 'app-1002',
        action: 'FIELD_VERIFICATION_APPROVED',
        previousStatus: 'FIELD_VERIFICATION',
        newStatus: 'DISTRICT_VERIFICATION',
        remarks: 'Ground verification checklist completed with evidence. Auto-escalated to District Officer.',
        ipAddress: '14.139.60.11',
        timestamp: '2026-02-28T16:00:00.000Z',
      },
      {
        id: 'aud-4',
        userId: 'usr-fin-1',
        userName: 'Vikram Sengupta',
        userRole: 'FINANCE_APPROVER',
        applicationId: 'app-1004',
        action: 'FUND_RELEASE_PROCESSED',
        previousStatus: 'DISBURSEMENT_PENDING',
        newStatus: 'PARTIALLY_DISBURSED',
        remarks: 'Released Milestone 1 grant ₹60,000 via PFMS DBT Ref #PFMS-DBT-2026-99018241.',
        ipAddress: '164.100.24.19',
        timestamp: '2026-02-15T16:45:00.000Z',
      },
    ];

    const notifications: Notification[] = [
      {
        id: 'notif-1',
        userId: 'usr-ben-1',
        userRole: 'BENEFICIARY',
        title: 'Application Eligible & Under Field Verification',
        message: 'Your application APP-2026-00101 scored 90/100 on the automated eligibility matrix and has been assigned to Field Officer Rajesh Kumar.',
        type: 'SUCCESS',
        isRead: false,
        link: '/beneficiary/applications/app-1001',
        createdAt: '2026-03-02T10:30:10.000Z',
      },
      {
        id: 'notif-2',
        userId: 'usr-fo-1',
        userRole: 'FIELD_OFFICER',
        title: 'New Verification Assigned',
        message: 'Application APP-2026-00101 (Priya Sharma - Women Entrepreneurship) is pending your field verification.',
        type: 'ACTION_REQUIRED',
        isRead: false,
        link: '/officer/field-queue',
        createdAt: '2026-03-02T10:30:12.000Z',
      },
      {
        id: 'notif-3',
        userId: 'usr-do-1',
        userRole: 'DISTRICT_OFFICER',
        title: 'District Verification Ready',
        message: 'Application APP-2026-00102 has been cleared by Field Officer Rajesh Kumar and awaits your sanction.',
        type: 'ACTION_REQUIRED',
        isRead: false,
        link: '/officer/district-queue',
        createdAt: '2026-02-28T16:00:15.000Z',
      },
      {
        id: 'notif-4',
        userId: 'usr-fin-1',
        userRole: 'FINANCE_APPROVER',
        title: 'Application Ready for Finance Sanction',
        message: 'Application APP-2026-00103 approved by District Officer Ananya Verma for ₹1,20,000 grant sanction.',
        type: 'ACTION_REQUIRED',
        isRead: false,
        link: '/finance/queue',
        createdAt: '2026-03-01T14:30:10.000Z',
      },
    ];

    return {
      users,
      beneficiaries,
      officers,
      schemes,
      applications,
      eligibilityResults,
      verifications,
      workflowHistory,
      disbursementPlans,
      auditLogs,
      notifications,
    };
  }
}

export const db = new DatabaseStore();
