import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  db,
  User,
  Application,
  ApplicationStatus,
  BeneficiaryProfile,
  Scheme,
} from './server/db';
import {
  authenticateToken,
  requireRole,
  generateToken,
  hashPassword,
  comparePassword,
  AuthenticatedRequest,
} from './server/auth';
import { evaluateApplicationEligibility } from './server/eligibility';
import {
  advanceWorkflowStage,
  logAudit,
  createNotification,
} from './server/workflow';
import {
  submitMilestoneCompliance,
  reviewMilestoneCompliance,
  releaseMilestoneFund,
} from './server/disbursement';
import { getAnalyticsSummary } from './server/analytics';
import { generateCsvData } from './server/reports';
import { processAiChat, processCopilotAction } from './server/ai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ==========================================
  // 1. AUTHENTICATION REST APIS
  // ==========================================

  // Register Beneficiary
  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const { username, email, password, fullName, phone, region, category, annualIncome } = req.body;

      if (!username || !email || !password || !fullName) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, password, and full name are required.',
        });
      }

      const users = db.get('users');
      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }
      if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'This username is already taken.',
        });
      }

      const userId = `usr-ben-${Date.now()}`;
      const newUser: User = {
        id: userId,
        username,
        email,
        passwordHash: hashPassword(password),
        role: 'BENEFICIARY',
        fullName,
        phone: phone || '',
        region: region || 'North District',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      users.push(newUser);
      db.set('users', users);

      // Create Beneficiary Profile
      const beneficiaries = db.get('beneficiaries');
      const newBeneficiary: BeneficiaryProfile = {
        id: `ben-prof-${Date.now()}`,
        userId,
        aadhaarNumber: 'XXXX-XXXX-' + Math.floor(1000 + Math.random() * 9000),
        dateOfBirth: '1995-01-01',
        age: 31,
        gender: 'FEMALE',
        category: (category as any) || 'OBC',
        annualIncome: Number(annualIncome) || 150000,
        address: 'Main Town Sector 1',
        district: region || 'North District',
        state: 'State Administration',
        pincode: '110001',
        bankAccountNo: '987654' + Math.floor(100000 + Math.random() * 900000),
        ifscCode: 'SBIN0001234',
        bankName: 'State Bank of India',
        occupation: 'Micro Enterprise Owner',
        landOwnershipAcres: 1.0,
        previousSubsidyReceived: false,
        createdAt: new Date().toISOString(),
      };
      beneficiaries.push(newBeneficiary);
      db.set('beneficiaries', beneficiaries);

      const token = generateToken(newUser);

      logAudit(
        newUser.id,
        newUser.fullName,
        newUser.role,
        'USER_REGISTERED',
        'Beneficiary self-registered successfully.',
        undefined,
        undefined,
        undefined,
        req.ip
      );

      return res.status(201).json({
        success: true,
        message: 'Beneficiary registration successful.',
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          fullName: newUser.fullName,
          region: newUser.region,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { emailOrUsername, password } = req.body;
      if (!emailOrUsername || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide email/username and password.',
        });
      }

      const users = db.get('users');
      const user = users.find(
        (u) =>
          u.email.toLowerCase() === emailOrUsername.toLowerCase() ||
          u.username.toLowerCase() === emailOrUsername.toLowerCase()
      );

      if (!user || !comparePassword(password, user.passwordHash)) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Check username/email and password.',
        });
      }

      if (user.status === 'INACTIVE') {
        return res.status(403).json({
          success: false,
          message: 'Your account is deactivated. Contact administrator.',
        });
      }

      const token = generateToken(user);

      logAudit(
        user.id,
        user.fullName,
        user.role,
        'USER_LOGIN',
        'User logged in successfully.',
        undefined,
        undefined,
        undefined,
        req.ip
      );

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          region: user.region,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Fast demo role switch
  app.post('/api/auth/switch-role', (req: Request, res: Response) => {
    try {
      const { role } = req.body;
      const users = db.get('users');
      const user = users.find((u) => u.role === role);

      if (!user) {
        return res.status(404).json({ success: false, message: `No demo user found for role ${role}` });
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          region: user.region,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Get current user profile
  app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const users = db.get('users');
    const user = users.find((u) => u.id === req.user!.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, user });
  });

  // Beneficiary Profile
  app.get('/api/beneficiaries/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const beneficiaries = db.get('beneficiaries');
    const prof = beneficiaries.find((b) => b.userId === req.user!.id);
    return res.json({ success: true, profile: prof || null });
  });

  app.put('/api/beneficiaries/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const beneficiaries = db.get('beneficiaries');
    let profIndex = beneficiaries.findIndex((b) => b.userId === req.user!.id);
    if (profIndex === -1) {
      const newProf: BeneficiaryProfile = {
        id: `ben-${Date.now()}`,
        userId: req.user!.id,
        ...req.body,
        createdAt: new Date().toISOString(),
      };
      beneficiaries.push(newProf);
      profIndex = beneficiaries.length - 1;
    } else {
      beneficiaries[profIndex] = {
        ...beneficiaries[profIndex],
        ...req.body,
      };
    }
    db.set('beneficiaries', beneficiaries);
    return res.json({ success: true, profile: beneficiaries[profIndex] });
  });

  // ==========================================
  // 2. SCHEMES REST APIS
  // ==========================================

  app.get('/api/schemes', (req: Request, res: Response) => {
    const schemes = db.get('schemes');
    return res.json({ success: true, schemes });
  });

  app.get('/api/schemes/:id', (req: Request, res: Response) => {
    const schemes = db.get('schemes');
    const scheme = schemes.find((s) => s.id === req.params.id || s.code === req.params.id);
    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }
    return res.json({ success: true, scheme });
  });

  app.post(
    '/api/schemes',
    authenticateToken,
    requireRole(['ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      try {
        const schemes = db.get('schemes');
        const newScheme: Scheme = {
          id: `sch-${Date.now()}`,
          code: req.body.code || `SCH-${Date.now().toString().slice(-4)}`,
          name: req.body.name,
          description: req.body.description,
          category: req.body.category || 'General Welfare',
          startDate: req.body.startDate || new Date().toISOString().split('T')[0],
          endDate: req.body.endDate || '2026-12-31',
          maxGrant: Number(req.body.maxGrant) || 100000,
          minGrant: Number(req.body.minGrant) || 25000,
          totalBudget: Number(req.body.totalBudget) || 10000000,
          allocatedBudget: 0,
          disbursedBudget: 0,
          targetRegion: req.body.targetRegion || 'All Districts',
          minAge: Number(req.body.minAge) || 18,
          maxAge: Number(req.body.maxAge) || 60,
          maxIncome: Number(req.body.maxIncome) || 500000,
          eligibleCategories: req.body.eligibleCategories || ['GENERAL', 'OBC', 'SC', 'ST', 'EWS'],
          requiredDocuments: req.body.requiredDocuments || [
            { type: 'AADHAAR', label: 'Aadhaar Card', mandatory: true },
            { type: 'INCOME_CERT', label: 'Income Certificate', mandatory: true },
            { type: 'BANK_PASSBOOK', label: 'Bank Passbook', mandatory: true },
          ],
          criteria: req.body.criteria || [],
          grantSlabs: req.body.grantSlabs || [],
          workflowStages: req.body.workflowStages || ['FIELD_VERIFICATION', 'DISTRICT_VERIFICATION', 'FINANCE_VERIFICATION'],
          defaultMilestones: req.body.defaultMilestones || [
            { name: 'Milestone 1: Procurement', percentage: 50, requiredDoc: 'Bills', dueDays: 30 },
            { name: 'Milestone 2: Completion', percentage: 50, requiredDoc: 'Certificate', dueDays: 90 },
          ],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        schemes.push(newScheme);
        db.set('schemes', schemes);

        logAudit(
          req.user!.id,
          req.user!.fullName,
          req.user!.role,
          'SCHEME_CREATED',
          `Created scheme: ${newScheme.name} (${newScheme.code}) with budget ₹${newScheme.totalBudget.toLocaleString('en-IN')}`,
          undefined
        );

        return res.status(201).json({ success: true, scheme: newScheme });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }
  );

  app.put(
    '/api/schemes/:id',
    authenticateToken,
    requireRole(['ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      const schemes = db.get('schemes');
      const idx = schemes.findIndex((s) => s.id === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Scheme not found' });
      }

      schemes[idx] = {
        ...schemes[idx],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      db.set('schemes', schemes);

      logAudit(
        req.user!.id,
        req.user!.fullName,
        req.user!.role,
        'SCHEME_UPDATED',
        `Updated configuration for scheme: ${schemes[idx].name}`
      );

      return res.json({ success: true, scheme: schemes[idx] });
    }
  );

  app.delete(
    '/api/schemes/:id',
    authenticateToken,
    requireRole(['ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      let schemes = db.get('schemes');
      const target = schemes.find((s) => s.id === req.params.id);
      if (!target) {
        return res.status(404).json({ success: false, message: 'Scheme not found' });
      }
      schemes = schemes.filter((s) => s.id !== req.params.id);
      db.set('schemes', schemes);

      logAudit(
        req.user!.id,
        req.user!.fullName,
        req.user!.role,
        'SCHEME_DELETED',
        `Deleted scheme: ${target.name} (${target.code})`
      );

      return res.json({ success: true, message: 'Scheme removed successfully' });
    }
  );

  // ==========================================
  // 3. APPLICATIONS REST APIS
  // ==========================================

  // Get My Applications (Beneficiary)
  app.get('/api/applications/my', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const applications = db.get('applications');
    const myApps = applications.filter((a) => a.beneficiaryId === req.user!.id);
    return res.json({ success: true, applications: myApps });
  });

  // Get All Applications (with role filtering)
  app.get('/api/applications', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const applications = db.get('applications');
    const { stage, status, schemeId } = req.query;

    let filtered = [...applications];

    if (stage) {
      filtered = filtered.filter((a) => a.currentStage === stage);
    }
    if (status) {
      filtered = filtered.filter((a) => a.status === status);
    }
    if (schemeId) {
      filtered = filtered.filter((a) => a.schemeId === schemeId);
    }

    // Role-specific filtering for officers
    if (req.user!.role === 'FIELD_OFFICER') {
      // In ground ops, show applications in Field Verification stage or assigned region
      filtered = filtered.filter(
        (a) => a.currentStage === 'FIELD_VERIFICATION' || a.region === req.user!.region
      );
    } else if (req.user!.role === 'DISTRICT_OFFICER') {
      filtered = filtered.filter(
        (a) => a.currentStage === 'DISTRICT_VERIFICATION' || a.region === req.user!.region
      );
    } else if (req.user!.role === 'FINANCE_APPROVER') {
      filtered = filtered.filter(
        (a) =>
          a.currentStage === 'FINANCE_VERIFICATION' ||
          a.status === 'APPROVED' ||
          a.status === 'DISBURSEMENT_PENDING' ||
          a.status === 'PARTIALLY_DISBURSED' ||
          a.status === 'FULLY_DISBURSED'
      );
    }

    return res.json({ success: true, applications: filtered });
  });

  // Get single application with complete relational graph
  app.get('/api/applications/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const applications = db.get('applications');
    const appItem = applications.find((a) => a.id === req.params.id || a.applicationNumber === req.params.id);

    if (!appItem) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Check permissions
    if (req.user!.role === 'BENEFICIARY' && appItem.beneficiaryId !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this application record.' });
    }

    const eligibilityResults = db.get('eligibilityResults');
    const verifications = db.get('verifications');
    const workflowHistory = db.get('workflowHistory');
    const disbursementPlans = db.get('disbursementPlans');
    const schemes = db.get('schemes');

    const eligibility = eligibilityResults.find((e) => e.applicationId === appItem.id);
    const appVerifications = verifications.filter((v) => v.applicationId === appItem.id);
    const appHistory = workflowHistory.filter((h) => h.applicationId === appItem.id);
    const disbursementPlan = disbursementPlans.find((p) => p.applicationId === appItem.id);
    const scheme = schemes.find((s) => s.id === appItem.schemeId);

    return res.json({
      success: true,
      application: appItem,
      scheme,
      eligibility,
      verifications: appVerifications,
      history: appHistory,
      disbursementPlan,
    });
  });

  // Create Application (Draft or Submission)
  app.post(
    '/api/applications',
    authenticateToken,
    requireRole(['BENEFICIARY', 'ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      try {
        const { schemeId, applicantData, documents, submitImmediately } = req.body;
        const schemes = db.get('schemes');
        const scheme = schemes.find((s) => s.id === schemeId);

        if (!scheme) {
          return res.status(400).json({ success: false, message: 'Invalid or inactive scheme selected.' });
        }

        const count = db.get('applications').length + 101;
        const appId = `app-${Date.now()}`;
        const appNumber = `APP-2026-${count.toString().padStart(5, '0')}`;

        const newApplication: Application = {
          id: appId,
          applicationNumber: appNumber,
          schemeId: scheme.id,
          schemeName: scheme.name,
          beneficiaryId: req.user!.id,
          beneficiaryName: applicantData?.personal?.fullName || req.user!.fullName,
          beneficiaryEmail: applicantData?.personal?.email || req.user!.email,
          beneficiaryPhone: applicantData?.personal?.phone || '+91 98000 00000',
          region: applicantData?.address?.region || req.user!.region || 'North District',
          status: submitImmediately ? 'SUBMITTED' : 'DRAFT',
          currentStage: submitImmediately ? 'ELIGIBILITY_CHECK' : 'DRAFT',
          grantAmount: scheme.maxGrant,
          documents: documents || [],
          applicantData: applicantData || {
            personal: {
              fullName: req.user!.fullName,
              aadhaarNumber: 'XXXX-XXXX-8921',
              dateOfBirth: '1995-01-01',
              gender: 'FEMALE',
              phone: '+91 98000 00000',
              email: req.user!.email,
            },
            address: {
              addressLine: 'District Block C',
              district: 'North District',
              state: 'State Administration',
              pincode: '110001',
              region: 'North District',
            },
            income: {
              annualIncome: 150000,
              occupation: 'Self-employed',
              landOwnershipAcres: 1,
              familyMembersCount: 4,
            },
            category: {
              socialCategory: 'OBC',
              isDifferentlyAbled: false,
              previousSubsidyReceived: false,
            },
            schemeSpecific: {
              proposedProjectTitle: 'Proposed Micro Enterprise',
              projectDescription: 'Project setup and procurement',
              estimatedCost: scheme.maxGrant,
              bankAccountNo: '987654321098',
              ifscCode: 'SBIN0001234',
              bankName: 'State Bank of India',
              branchName: 'Main Branch',
            },
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const applications = db.get('applications');
        applications.unshift(newApplication);
        db.set('applications', applications);

        logAudit(
          req.user!.id,
          req.user!.fullName,
          req.user!.role,
          submitImmediately ? 'APPLICATION_SUBMITTED' : 'APPLICATION_DRAFT_SAVED',
          `${submitImmediately ? 'Submitted' : 'Saved draft for'} application ${appNumber} under scheme ${scheme.name}`,
          appId,
          'NEW',
          newApplication.status
        );

        if (submitImmediately) {
          // Trigger automated eligibility engine
          return triggerEligibilityEvaluation(newApplication, scheme, req.user!, res);
        }

        return res.status(201).json({
          success: true,
          message: 'Application draft created successfully.',
          application: newApplication,
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }
  );

  // Helper: Trigger Eligibility Evaluation
  function triggerEligibilityEvaluation(
    application: Application,
    scheme: Scheme,
    actor: { id: string; fullName: string; role: string },
    res: Response
  ) {
    application.submittedAt = new Date().toISOString();
    application.status = 'ELIGIBILITY_CHECK';
    application.currentStage = 'ELIGIBILITY_CHECK';

    const evaluationResult = evaluateApplicationEligibility(scheme, application);
    const eligibilityResults = db.get('eligibilityResults');
    eligibilityResults.unshift(evaluationResult);
    db.set('eligibilityResults', eligibilityResults);

    application.eligibilityScore = evaluationResult.totalScore;
    application.maxScore = evaluationResult.maxScore;
    application.isEligible = evaluationResult.eligible;
    application.grantAmount = evaluationResult.calculatedGrantAmount;

    let nextStatus: Application['status'] = 'INELIGIBLE';
    let nextStage = 'INELIGIBLE';

    if (evaluationResult.eligible) {
      nextStatus = 'FIELD_VERIFICATION';
      nextStage = 'FIELD_VERIFICATION';
    } else {
      nextStatus = 'INELIGIBLE';
      nextStage = 'REJECTED';
      application.failureReasons = evaluationResult.failedCriteria;
    }

    application.status = nextStatus;
    application.currentStage = nextStage;
    application.updatedAt = new Date().toISOString();

    const applications = db.get('applications');
    const idx = applications.findIndex((a) => a.id === application.id);
    if (idx !== -1) {
      applications[idx] = application;
      db.set('applications', applications);
    }

    // Record workflow history
    const history = db.get('workflowHistory');
    history.unshift({
      id: `wf-${Date.now()}`,
      applicationId: application.id,
      fromStage: 'SUBMITTED',
      toStage: nextStage,
      fromStatus: 'SUBMITTED',
      toStatus: nextStatus,
      actorId: 'system',
      actorName: 'Automated Scoring Engine',
      actorRole: 'SYSTEM',
      action: 'AUTOMATIC_EVALUATION',
      remarks: evaluationResult.eligible
        ? `Application evaluated: Score ${evaluationResult.totalScore}/${evaluationResult.maxScore}. Eligible for grant ₹${evaluationResult.calculatedGrantAmount.toLocaleString('en-IN')}. Auto-routed to Field Officer.`
        : `Applicant not eligible. Failed criteria: ${evaluationResult.failedCriteria.join('; ')}`,
      timestamp: new Date().toISOString(),
    });
    db.set('workflowHistory', history);

    // Notify beneficiary
    createNotification(
      application.beneficiaryId,
      'BENEFICIARY',
      evaluationResult.eligible
        ? `Eligibility Cleared (${evaluationResult.totalScore}/${evaluationResult.maxScore})`
        : `Application Ineligible (${evaluationResult.totalScore}/${evaluationResult.maxScore})`,
      evaluationResult.eligible
        ? `Your application ${application.applicationNumber} was scored ${evaluationResult.totalScore}/100 and has been assigned to Field Verification.`
        : `Application did not meet minimum eligibility criteria. View details in scorecard.`,
      evaluationResult.eligible ? 'SUCCESS' : 'WARNING',
      `/beneficiary/applications/${application.id}`
    );

    // If eligible, notify Field Officer
    if (evaluationResult.eligible) {
      const users = db.get('users');
      const fo = users.find((u) => u.role === 'FIELD_OFFICER');
      if (fo) {
        createNotification(
          fo.id,
          'FIELD_OFFICER',
          'New Field Verification Assigned',
          `Application ${application.applicationNumber} for ${application.beneficiaryName} is ready for on-ground inspection.`,
          'ACTION_REQUIRED',
          '/officer/field-queue'
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: evaluationResult.eligible
        ? 'Application submitted and verified eligible. Forwarded to Field Officer.'
        : 'Application evaluated as ineligible based on scheme criteria.',
      application,
      eligibilityResult: evaluationResult,
    });
  }

  // Submit Draft Application
  app.post('/api/applications/:id/submit', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const applications = db.get('applications');
    const appIndex = applications.findIndex((a) => a.id === req.params.id);
    if (appIndex === -1) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = applications[appIndex];
    if (application.beneficiaryId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const schemes = db.get('schemes');
    const scheme = schemes.find((s) => s.id === application.schemeId);
    if (!scheme) {
      return res.status(400).json({ success: false, message: 'Associated scheme not found' });
    }

    return triggerEligibilityEvaluation(application, scheme, req.user!, res);
  });

  // Re-submit application after changes (Reverse process: Beneficiary rectifies and sends back to Officer)
  app.post('/api/applications/:id/resubmit', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const applications = db.get('applications');
    const appIndex = applications.findIndex((a) => a.id === req.params.id);
    if (appIndex === -1) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = applications[appIndex];
    if (application.status !== 'REAPPLICATION_REQUIRED' && application.status !== 'INELIGIBLE') {
      return res.status(400).json({
        success: false,
        message: 'Application is not in a re-submittable state.',
      });
    }

    // Capture previous request context for reverse return routing
    const prevRequest = application.reapplicationRequest;
    const returnStage = prevRequest?.returnToStage || (prevRequest?.officerRole === 'DISTRICT_OFFICER' ? 'DISTRICT_VERIFICATION' : 'FIELD_VERIFICATION');
    const officerRoleToNotify = prevRequest?.officerRole || 'FIELD_OFFICER';

    if (req.body.applicantData) {
      application.applicantData = req.body.applicantData;
    }
    if (req.body.documents) {
      application.documents = req.body.documents;
    }
    if (req.body.beneficiaryResponse || req.body.remarks) {
      application.beneficiaryResponse = req.body.beneficiaryResponse || req.body.remarks;
    }

    application.revisionCount = (application.revisionCount || 0) + 1;
    application.lastResubmittedAt = new Date().toISOString();

    const schemes = db.get('schemes');
    const scheme = schemes.find((s) => s.id === application.schemeId);
    if (!scheme) {
      return res.status(400).json({ success: false, message: 'Associated scheme not found' });
    }

    // Run dynamic eligibility evaluation with updated inputs
    const evaluationResult = evaluateApplicationEligibility(scheme, application);
    const eligibilityResults = db.get('eligibilityResults');
    eligibilityResults.unshift(evaluationResult);
    db.set('eligibilityResults', eligibilityResults);

    application.eligibilityScore = evaluationResult.totalScore;
    application.maxScore = evaluationResult.maxScore;
    application.isEligible = evaluationResult.eligible;
    application.grantAmount = evaluationResult.calculatedGrantAmount;

    let nextStatus: Application['status'] = 'INELIGIBLE';
    let nextStage = 'INELIGIBLE';

    if (evaluationResult.eligible) {
      nextStatus = returnStage as ApplicationStatus;
      nextStage = returnStage;
    } else {
      nextStatus = 'INELIGIBLE';
      nextStage = 'REJECTED';
      application.failureReasons = evaluationResult.failedCriteria;
    }

    application.status = nextStatus;
    application.currentStage = nextStage;
    application.updatedAt = new Date().toISOString();
    delete application.reapplicationRequest;

    applications[appIndex] = application;
    db.set('applications', applications);

    // Record workflow history for reverse return
    const history = db.get('workflowHistory');
    history.unshift({
      id: `wf-${Date.now()}`,
      applicationId: application.id,
      fromStage: 'REAPPLICATION',
      toStage: nextStage,
      fromStatus: 'REAPPLICATION_REQUIRED',
      toStatus: nextStatus,
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      actorRole: 'BENEFICIARY',
      action: 'APPLICATION_RESUBMITTED',
      remarks: evaluationResult.eligible
        ? `Application resubmitted after rectification (Rev #${application.revisionCount}). Re-evaluated score: ${evaluationResult.totalScore}/${evaluationResult.maxScore}. Routed back to ${returnStage.replace(/_/g, ' ')}.`
        : `Applicant not eligible upon resubmission. Failed criteria: ${evaluationResult.failedCriteria.join('; ')}`,
      timestamp: new Date().toISOString(),
    });
    db.set('workflowHistory', history);

    // Audit log
    logAudit(
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      'APPLICATION_RESUBMITTED',
      `Beneficiary resubmitted application ${application.applicationNumber} (Revision #${application.revisionCount}). Response: "${application.beneficiaryResponse || 'Details updated.'}"`,
      application.id,
      'REAPPLICATION_REQUIRED',
      nextStatus
    );

    // Notify Officer that the resubmitted application is back in their queue
    if (evaluationResult.eligible) {
      const users = db.get('users');
      const targetOfficer = users.find((u) => u.role === officerRoleToNotify);
      if (targetOfficer) {
        createNotification(
          targetOfficer.id,
          officerRoleToNotify,
          `Application Resubmitted after Rectification (${application.applicationNumber})`,
          `Beneficiary ${application.beneficiaryName} has submitted rectifications for application ${application.applicationNumber} (Rev #${application.revisionCount}). Response note: "${application.beneficiaryResponse || 'Details updated'}". Ready for review.`,
          'ACTION_REQUIRED',
          officerRoleToNotify === 'FIELD_OFFICER' ? '/officer/field-queue' : '/officer/district-queue'
        );
      }
    }

    createNotification(
      application.beneficiaryId,
      'BENEFICIARY',
      'Application Resubmitted Successfully',
      `Your rectified application ${application.applicationNumber} has been evaluated (Score: ${evaluationResult.totalScore}/100) and returned to ${returnStage.replace(/_/g, ' ')} for official scrutiny.`,
      'SUCCESS',
      `/beneficiary/applications/${application.id}`
    );

    return res.status(200).json({
      success: true,
      message: `Application successfully rectified and resubmitted! Returned to ${returnStage.replace(/_/g, ' ')} queue.`,
      application,
      eligibilityResult: evaluationResult,
    });
  });

  // Evaluate Endpoint
  app.post('/api/applications/:id/evaluate', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const applications = db.get('applications');
    const app = applications.find((a) => a.id === req.params.id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    const schemes = db.get('schemes');
    const scheme = schemes.find((s) => s.id === app.schemeId);
    if (!scheme) {
      return res.status(400).json({ success: false, message: 'Scheme not found' });
    }
    const result = evaluateApplicationEligibility(scheme, app);
    return res.json({ success: true, result });
  });

  // ==========================================
  // 4. VERIFICATION WORKFLOW REST APIS
  // ==========================================

  // Pending Verifications
  app.get(
    '/api/verifications/pending',
    authenticateToken,
    requireRole(['FIELD_OFFICER', 'DISTRICT_OFFICER', 'FINANCE_APPROVER', 'ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      const applications = db.get('applications');
      let targetStage = 'FIELD_VERIFICATION';

      if (req.user!.role === 'FIELD_OFFICER') {
        targetStage = 'FIELD_VERIFICATION';
      } else if (req.user!.role === 'DISTRICT_OFFICER') {
        targetStage = 'DISTRICT_VERIFICATION';
      } else if (req.user!.role === 'FINANCE_APPROVER') {
        targetStage = 'FINANCE_VERIFICATION';
      }

      const pending = applications.filter((a) => a.currentStage === targetStage);
      return res.json({ success: true, applications: pending, stage: targetStage });
    }
  );

  // Approve
  app.post(
    '/api/verifications/:applicationId/approve',
    authenticateToken,
    requireRole(['FIELD_OFFICER', 'DISTRICT_OFFICER', 'FINANCE_APPROVER', 'ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      const applications = db.get('applications');
      const appItem = applications.find((a) => a.id === req.params.applicationId);
      if (!appItem) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      const { remarks, groundChecklist, evidenceNotes } = req.body;
      const result = advanceWorkflowStage(
        appItem,
        { id: req.user!.id, fullName: req.user!.fullName, role: req.user!.role },
        'APPROVE',
        remarks || 'Verified and recommended for advancement.',
        groundChecklist,
        undefined,
        evidenceNotes
      );

      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    }
  );

  // Reject
  app.post(
    '/api/verifications/:applicationId/reject',
    authenticateToken,
    requireRole(['FIELD_OFFICER', 'DISTRICT_OFFICER', 'FINANCE_APPROVER', 'ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      const applications = db.get('applications');
      const appItem = applications.find((a) => a.id === req.params.applicationId);
      if (!appItem) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      const { remarks } = req.body;
      if (!remarks) {
        return res.status(400).json({ success: false, message: 'Rejection remarks are mandatory.' });
      }

      const result = advanceWorkflowStage(
        appItem,
        { id: req.user!.id, fullName: req.user!.fullName, role: req.user!.role },
        'REJECT',
        remarks
      );

      return res.json(result);
    }
  );

  // Request Re-Application
  app.post(
    '/api/verifications/:applicationId/reapply',
    authenticateToken,
    requireRole(['FIELD_OFFICER', 'DISTRICT_OFFICER', 'FINANCE_APPROVER', 'ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      const applications = db.get('applications');
      const appItem = applications.find((a) => a.id === req.params.applicationId);
      if (!appItem) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      const { remarks, requestedChanges } = req.body;
      if (!remarks) {
        return res.status(400).json({ success: false, message: 'Detailed reason and requested changes required.' });
      }

      const result = advanceWorkflowStage(
        appItem,
        { id: req.user!.id, fullName: req.user!.fullName, role: req.user!.role },
        'REQUEST_REAPPLICATION',
        remarks,
        undefined,
        requestedChanges
      );

      return res.json(result);
    }
  );

  // Request Re-Verification
  app.post(
    '/api/verifications/:applicationId/reverify',
    authenticateToken,
    requireRole(['DISTRICT_OFFICER', 'FINANCE_APPROVER', 'ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      const applications = db.get('applications');
      const appItem = applications.find((a) => a.id === req.params.applicationId);
      if (!appItem) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      const { remarks } = req.body;
      if (!remarks) {
        return res.status(400).json({ success: false, message: 'Remarks for re-verification are mandatory.' });
      }

      const result = advanceWorkflowStage(
        appItem,
        { id: req.user!.id, fullName: req.user!.fullName, role: req.user!.role },
        'REQUEST_REVERIFICATION',
        remarks
      );

      return res.json(result);
    }
  );

  // ==========================================
  // 5. DISBURSEMENT & COMPLIANCE REST APIS
  // ==========================================

  // Get Disbursement Plan for application
  app.get('/api/disbursements/:applicationId', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const plans = db.get('disbursementPlans');
    const plan = plans.find((p) => p.applicationId === req.params.applicationId);
    return res.json({ success: true, plan: plan || null });
  });

  // Submit Milestone Compliance Document (Beneficiary)
  app.post('/api/compliance/:milestoneId/submit', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { docName, docUrl, remarks } = req.body;
      const milestone = submitMilestoneCompliance(
        req.params.milestoneId,
        docName || 'Compliance_Certificate.pdf',
        docUrl || '/docs/compliance_sample.pdf',
        remarks || 'Uploaded milestone utilization certificate and bills.',
        { id: req.user!.id, fullName: req.user!.fullName, role: req.user!.role }
      );
      return res.json({ success: true, milestone });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Review Milestone Compliance (Officer / Finance)
  app.post(
    '/api/compliance/:milestoneId/review',
    authenticateToken,
    requireRole(['FINANCE_APPROVER', 'FIELD_OFFICER', 'ADMIN']),
    (req: AuthenticatedRequest, res: Response) => {
      try {
        const { decision, remarks } = req.body;
        const milestone = reviewMilestoneCompliance(
          req.params.milestoneId,
          decision || 'APPROVE',
          remarks || 'Milestone compliance validated and approved.',
          { id: req.user!.id, fullName: req.user!.fullName, role: req.user!.role }
        );
        return res.json({ success: true, milestone });
      } catch (err: any) {
        return res.status(400).json({ success: false, message: err.message });
      }
    }
  );

  // Release Milestone Grant Installment (Finance Approver)
  const handleMilestoneRelease = (req: AuthenticatedRequest, res: Response) => {
    try {
      const { transactionRef, paymentMode, remarks } = req.body;
      const milestone = releaseMilestoneFund(
        req.params.id,
        transactionRef,
        paymentMode,
        remarks,
        { id: req.user!.id, fullName: req.user!.fullName, role: req.user!.role }
      );
      return res.json({ success: true, milestone });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  };

  app.post(
    '/api/disbursements/milestones/:id/release',
    authenticateToken,
    requireRole(['FINANCE_APPROVER', 'ADMIN']),
    handleMilestoneRelease
  );

  app.post(
    '/api/disbursements/:id/release',
    authenticateToken,
    requireRole(['FINANCE_APPROVER', 'ADMIN']),
    handleMilestoneRelease
  );

  // ==========================================
  // 6. ANALYTICS & AUDIT REST APIS
  // ==========================================

  app.get('/api/analytics/summary', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const summary = getAnalyticsSummary();
    return res.json({ success: true, data: summary, summary });
  });

  app.get('/api/audit', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
    const logs = db.get('auditLogs');
    const { role, action, search } = req.query;

    let filtered = [...logs];
    if (role) {
      filtered = filtered.filter((l) => l.userRole === role);
    }
    if (action) {
      filtered = filtered.filter((l) => l.action.includes(action as string));
    }
    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.userName.toLowerCase().includes(q) ||
          l.remarks.toLowerCase().includes(q) ||
          (l.applicationId && l.applicationId.toLowerCase().includes(q))
      );
    }

    return res.json({ success: true, logs: filtered });
  });

  app.get('/api/audit-logs', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
    const logs = db.get('auditLogs');
    return res.json({ success: true, logs });
  });

  app.get('/api/audit/application/:applicationId', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const logs = db.get('auditLogs');
    const appLogs = logs.filter((l) => l.applicationId === req.params.applicationId);
    return res.json({ success: true, logs: appLogs });
  });

  // Notifications
  app.get('/api/notifications', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const notifications = db.get('notifications');
    const myNotifs = notifications.filter(
      (n) => n.userId === req.user!.id || (n.userRole && n.userRole === req.user!.role)
    );
    const unreadCount = myNotifs.filter((n) => !n.isRead).length;
    return res.json({ success: true, notifications: myNotifs, unreadCount });
  });

  app.put('/api/notifications/:id/read', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const notifications = db.get('notifications');
    const n = notifications.find((item) => item.id === req.params.id);
    if (n) {
      n.isRead = true;
      db.set('notifications', notifications);
    }
    return res.json({ success: true });
  });

  app.put('/api/notifications/read-all', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const notifications = db.get('notifications');
    for (const n of notifications) {
      if (n.userId === req.user!.id || (n.userRole && n.userRole === req.user!.role)) {
        n.isRead = true;
      }
    }
    db.set('notifications', notifications);
    return res.json({ success: true });
  });

  // Report Export (CSV/Excel format)
  app.get('/api/reports/export/:type', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const type = req.params.type.toUpperCase() as any;
    const csvContent = generateCsvData(type);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=subsidy_${type.toLowerCase()}_report.csv`);
    return res.send(csvContent);
  });

  // Reset Demo Data
  app.post('/api/system/reset-demo', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
    db.resetToSeed();
    return res.json({ success: true, message: 'Database reset to initial sample schemes and applications.' });
  });

  // ==========================================
  // 6. AI ASSISTANT & COPILOT REST APIS
  // ==========================================

  // Multi-turn contextual chat with Gemini AI
  app.post('/api/ai/chat', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { messages, context } = req.body;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ success: false, message: 'Messages array is required.' });
      }

      const mergedContext = {
        role: req.user?.role,
        userName: req.user?.fullName,
        region: req.user?.region,
        ...context,
      };

      const result = await processAiChat(messages, mergedContext);
      return res.json({
        success: true,
        message: result.text,
        source: result.source,
      });
    } catch (error: any) {
      console.error('AI chat endpoint error:', error);
      return res.status(500).json({
        success: false,
        message: error?.message || 'Failed to process AI chat request.',
      });
    }
  });

  // Copilot specialized task assistance (remarks, rectification, sanction memos)
  app.post('/api/ai/copilot', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { action, data, context } = req.body;
      if (!action) {
        return res.status(400).json({ success: false, message: 'Action type is required.' });
      }

      const mergedContext = {
        role: req.user?.role,
        userName: req.user?.fullName,
        region: req.user?.region,
        ...context,
      };

      const result = await processCopilotAction(action, data || {}, mergedContext);
      return res.json({
        success: true,
        text: result.text,
        source: result.source,
      });
    } catch (error: any) {
      console.error('AI copilot endpoint error:', error);
      return res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate copilot draft.',
      });
    }
  });

  // ==========================================
  // 7. VITE MIDDLEWARE (DEV) & STATIC (PROD)
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized Error Handling
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Server Internal Error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal Server Error',
      timestamp: new Date().toISOString(),
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Digital Subsidy & Grant Platform server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
