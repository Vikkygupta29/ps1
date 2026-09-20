const http = require('http');

function request(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        } : {}),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

(async () => {
  const results = [];
  function assert(name, condition, details) {
    if (condition) {
      console.log('  ✅ PASS:', name);
      results.push({ name, passed: true });
    } else {
      console.error('  ❌ FAIL:', name, details || '');
      results.push({ name, passed: false, details });
    }
  }

  console.log('====================================================');
  console.log('  GRANTSETU VERIFICATION & FEATURE AUDIT');
  console.log('====================================================\n');

  // 1. Role-based Authentication
  console.log('[1] AUTHENTICATION & ROLE-BASED ACCESS TOKENS');
  const tokens = {};
  const roles = [
    { role: 'BENEFICIARY', email: 'beneficiary@gov.in' },
    { role: 'FIELD_OFFICER', email: 'field@gov.in' },
    { role: 'DISTRICT_OFFICER', email: 'district@gov.in' },
    { role: 'FINANCE_APPROVER', email: 'finance@gov.in' },
    { role: 'ADMIN', email: 'admin@gov.in' },
  ];

  for (const r of roles) {
    const res = await request('POST', '/api/auth/login', {
      emailOrUsername: r.email,
      password: 'password123'
    });
    assert(`Login for ${r.role} (${r.email})`, res.status === 200 && res.data?.token);
    if (res.data?.token) tokens[r.role] = res.data.token;
  }

  // 2. Citizen Registration
  const regEmail = 'citizen_' + Date.now() + '@example.com';
  const regRes = await request('POST', '/api/auth/register', {
    username: 'citizen_' + Date.now(),
    email: regEmail,
    password: 'password123',
    fullName: 'Mohan Lal Verma',
    phone: '+91 98765 12345',
    region: 'North District',
    category: 'OBC',
    annualIncome: 140000
  });
  assert('New Citizen Self-Registration', regRes.status === 201 && regRes.data?.token);
  const citizenToken = regRes.data?.token || tokens['BENEFICIARY'];

  // 3. Schemes Catalog
  console.log('\n[2] SCHEMES CATALOG & DYNAMIC CRITERIA MATRIX');
  const schemesRes = await request('GET', '/api/schemes', null, citizenToken);
  const schemes = schemesRes.data?.schemes || [];
  assert('Fetch All Schemes', schemesRes.status === 200 && schemes.length >= 3);
  const scheme = schemes[0];
  assert('Scheme Dynamic Criteria Defined', Array.isArray(scheme.criteria) && scheme.criteria.length >= 4);
  assert('Scheme Disbursement Milestones Defined', Array.isArray(scheme.defaultMilestones) && scheme.defaultMilestones.length >= 2);

  // 4. Application Submission & Automated Scoring
  console.log('\n[3] APPLICATION SUBMISSION & DYNAMIC ELIGIBILITY SCORING');
  const submitRes = await request('POST', '/api/applications', {
    schemeId: scheme.id,
    applicantData: {
      personal: { fullName: 'Priya Sharma', gender: 'FEMALE', age: 31, dateOfBirth: '1995-01-01' },
      income: { annualIncome: 140000, occupation: 'Artisan' },
      category: { socialCategory: 'OBC', isMinority: false, isBPL: true },
      address: { region: 'North District', district: 'North District' }
    },
    documents: [
      { id: 'd1', name: 'Aadhaar Card.pdf', type: 'IDENTITY_PROOF', fileUrl: 'https://example.com/aadhaar.pdf', verified: false, uploadedAt: new Date().toISOString() },
      { id: 'd2', name: 'Income Certificate.pdf', type: 'INCOME_CERTIFICATE', fileUrl: 'https://example.com/income.pdf', verified: false, uploadedAt: new Date().toISOString() },
      { id: 'd3', name: 'Bank Passbook.pdf', type: 'BANK_PASSBOOK', fileUrl: 'https://example.com/bank.pdf', verified: false, uploadedAt: new Date().toISOString() },
      { id: 'd4', name: 'Project Proposal.pdf', type: 'PROJECT_PROPOSAL', fileUrl: 'https://example.com/proposal.pdf', verified: false, uploadedAt: new Date().toISOString() }
    ],
    submitImmediately: true
  }, citizenToken);

  assert('Submit Application with Immediate Scoring', submitRes.status === 201 && submitRes.data?.application?.id);
  const app1 = submitRes.data?.application;
  assert('Eligibility Score Evaluated (100/100)', app1?.eligibilityScore === 100 && app1?.isEligible === true);
  assert('Application Forwarded to Field Verification', app1?.status === 'FIELD_VERIFICATION' && app1?.currentStage === 'FIELD_VERIFICATION');

  // 5. Multi-Tier Forward Approval Workflow
  console.log('\n[4] MULTI-TIER FORWARD APPROVAL WORKFLOW');
  // Field Officer Approves -> moves to DISTRICT_VERIFICATION
  const foApproveRes = await request('POST', `/api/verifications/${app1.id}/approve`, {
    remarks: 'Physical inspection completed at site. Shop and tools verified. Documents authenticated.'
  }, tokens['FIELD_OFFICER']);
  assert('Field Officer Verification Approval (Moves to District)', foApproveRes.status === 200 && foApproveRes.data?.nextStage === 'DISTRICT_VERIFICATION');

  // District Officer Approves -> moves to FINANCE_VERIFICATION
  const doApproveRes = await request('POST', `/api/verifications/${app1.id}/approve`, {
    remarks: 'District scrutiny verified. North District artisan quota available. Forwarded for finance sanction.'
  }, tokens['DISTRICT_OFFICER']);
  assert('District Officer Scrutiny Approval (Moves to Finance)', doApproveRes.status === 200 && doApproveRes.data?.nextStage === 'FINANCE_VERIFICATION');

  // Finance Approver Approves -> moves to APPROVED & creates Disbursement Plan
  const finSanctionRes = await request('POST', `/api/verifications/${app1.id}/approve`, {
    remarks: 'Sanction Order issued under GFR 2017 Rule 230(1). Milestone disbursement schedule authorized via PFMS.'
  }, tokens['FINANCE_APPROVER']);
  assert('Finance Directorate Sanction Granted (Moves to APPROVED)', finSanctionRes.status === 200 && finSanctionRes.data?.nextStatus === 'APPROVED');

  // 6. Reverse Workflow: Return for Re-Application & Re-Verification
  console.log('\n[5] REVERSE WORKFLOW: OFFICER DEFECT DIRECTIVE & RESUBMISSION');
  // Submit second application to test reverse process
  const submit2Res = await request('POST', '/api/applications', {
    schemeId: scheme.id,
    applicantData: {
      personal: { fullName: 'Mohan Lal Verma', gender: 'FEMALE', age: 32, dateOfBirth: '1994-01-01' },
      income: { annualIncome: 200000, occupation: 'Artisan' },
      category: { socialCategory: 'OBC', isMinority: false, isBPL: false },
      address: { region: 'North District', district: 'North District' }
    },
    documents: [
      { id: 'd1', name: 'Aadhaar.pdf', type: 'IDENTITY_PROOF', fileUrl: 'https://example.com/aadhaar.pdf', verified: false, uploadedAt: new Date().toISOString() },
      { id: 'd2', name: 'Income.pdf', type: 'INCOME_CERTIFICATE', fileUrl: 'https://example.com/income.pdf', verified: false, uploadedAt: new Date().toISOString() },
      { id: 'd3', name: 'Bank.pdf', type: 'BANK_PASSBOOK', fileUrl: 'https://example.com/bank.pdf', verified: false, uploadedAt: new Date().toISOString() },
      { id: 'd4', name: 'Proposal.pdf', type: 'PROJECT_PROPOSAL', fileUrl: 'https://example.com/proposal.pdf', verified: false, uploadedAt: new Date().toISOString() }
    ],
    submitImmediately: true
  }, citizenToken);
  const app2 = submit2Res.data?.application;
  assert('Second Application Submitted for Reverse Test', !!app2?.id);

  // Field Officer sends back for reapplication
  const reapplyReq = await request('POST', `/api/verifications/${app2.id}/reapply`, {
    remarks: 'Income certificate is missing the Tehsildar revenue seal. Please provide stamped 2026 certificate.',
    requestedChanges: [
      'Upload revenue-stamped income certificate',
      'Attach supplier invoice with equipment details'
    ]
  }, tokens['FIELD_OFFICER']);
  assert('Field Officer Requests Re-Application (Reverse Step 1)', reapplyReq.status === 200 && reapplyReq.data?.application?.status === 'REAPPLICATION_REQUIRED');

  // Citizen resubmits with updated income & compliance note
  const resubmitRes = await request('POST', `/api/applications/${app2.id}/resubmit`, {
    annualIncome: 180000,
    projectScopeDescription: 'Handloom weaving equipment and tools',
    resubmissionRemarks: 'Obtained and uploaded fresh Tehsildar stamped revenue proof dated 2026.',
    updatedDocuments: [
      { id: 'd2', name: 'Stamped Income Certificate 2026.pdf', type: 'INCOME_CERTIFICATE', fileUrl: 'https://example.com/stamped_2026.pdf', verified: false, uploadedAt: new Date().toISOString() }
    ]
  }, citizenToken);
  assert('Citizen Resubmits Rectified Application (Reverse Step 2)', resubmitRes.status === 200 && resubmitRes.data?.application?.status === 'FIELD_VERIFICATION');
  assert('Application Revision Count Incremented', resubmitRes.data?.application?.revisionCount >= 1);

  // Field officer re-approves rectified application -> moves to DISTRICT_VERIFICATION
  await request('POST', `/api/verifications/${app2.id}/approve`, {
    remarks: 'Stamped certificate verified. Resubmission acceptable.'
  }, tokens['FIELD_OFFICER']);

  // District officer returns to Field officer for re-verification
  const reverifyRes = await request('POST', `/api/verifications/${app2.id}/reverify`, {
    remarks: 'Physical re-inspection of workshop premises required before district clearance.'
  }, tokens['DISTRICT_OFFICER']);
  assert('District Officer Returns to Field Officer (Re-verification Directive)', reverifyRes.status === 200 && reverifyRes.data?.application?.currentStage === 'FIELD_VERIFICATION');

  // 7. Staged Milestone Disbursements & PFMS DBT
  console.log('\n[6] STAGED MILESTONE DISBURSEMENT LIFECYCLE');
  const planRes = await request('GET', `/api/disbursements/${app1.id}`, null, citizenToken);
  const plan = planRes.data?.plan;
  assert('Disbursement Plan Created for Sanctioned App', !!plan && plan.milestones?.length > 0);

  if (plan && plan.milestones?.length > 0) {
    const milestone = plan.milestones[0];
    
    // Beneficiary submits milestone compliance
    const submitComp = await request('POST', `/api/compliance/${milestone.id}/submit`, {
      docName: 'Enterprise Setup Photos & Tool Invoices.pdf',
      docUrl: 'https://example.com/setup_invoice.pdf',
      remarks: 'Workshop operational and primary tools procured.'
    }, citizenToken);
    assert('Beneficiary Submits Milestone Compliance Proof', submitComp.status === 200 && submitComp.data?.milestone?.status === 'COMPLIANCE_SUBMITTED');

    // Field Officer reviews compliance
    const reviewComp = await request('POST', `/api/compliance/${milestone.id}/review`, {
      decision: 'APPROVE',
      remarks: 'Site inspection completed. Workshop and machinery verified.'
    }, tokens['FIELD_OFFICER']);
    assert('Officer Certifies Milestone Compliance', reviewComp.status === 200 && reviewComp.data?.milestone?.status === 'APPROVED');

    // Finance releases milestone fund tranche
    const releaseComp = await request('POST', `/api/disbursements/milestones/${milestone.id}/release`, {
      paymentMode: 'PFMS_DBT',
      remarks: 'First tranche of grant-in-aid released to Aadhaar-linked bank account.'
    }, tokens['FINANCE_APPROVER']);
    assert('Finance Directorate Releases Fund Tranche (PFMS DBT)', releaseComp.status === 200 && releaseComp.data?.milestone?.status === 'RELEASED');
    assert('Milestone Contains Bank UTR / Transaction Reference', !!releaseComp.data?.milestone?.transactionRef);
  }

  // 8. AI Assistant & Copilot Drafting Tools
  console.log('\n[7] AI ASSISTANT & COPILOT SUITE');
  const aiChat = await request('POST', '/api/ai/chat', {
    messages: [
      { role: 'user', content: 'What is the maximum subsidy under the Women Entrepreneurship scheme?' }
    ],
    context: { currentView: 'schemes-catalog' }
  }, citizenToken);
  assert('AI Chat Assistant Response', aiChat.status === 200 && aiChat.data?.message && aiChat.data.message.length > 50);

  const aiRect = await request('POST', '/api/ai/copilot', {
    action: 'DRAFT_RECTIFICATION',
    data: {
      applicationNumber: app2.applicationNumber,
      schemeTitle: scheme.name,
      officerRemarks: 'Income certificate is missing the Tehsildar revenue seal',
      requestedChanges: 'Upload revenue-stamped income certificate',
      actionsTaken: 'Uploaded fresh 2026 certified copy'
    }
  }, citizenToken);
  assert('AI Copilot: Citizen Rectification Note Drafter', aiRect.status === 200 && !!aiRect.data?.text);

  const aiRemarks = await request('POST', '/api/ai/copilot', {
    action: 'DRAFT_REMARKS',
    data: {
      applicationNumber: app1.applicationNumber,
      schemeTitle: scheme.name,
      decision: 'APPROVE',
      observations: 'Workshop and credentials fully verified'
    }
  }, tokens['FIELD_OFFICER']);
  assert('AI Copilot: Officer Official Remarks Drafter', aiRemarks.status === 200 && !!aiRemarks.data?.text);

  const aiSanction = await request('POST', '/api/ai/copilot', {
    action: 'DRAFT_SANCTION',
    data: {
      applicationNumber: app1.applicationNumber,
      schemeTitle: scheme.name,
      beneficiaryName: 'Priya Sharma',
      amount: 150000
    }
  }, tokens['FINANCE_APPROVER']);
  assert('AI Copilot: GFR 2017 Sanction Memo Drafter', aiSanction.status === 200 && !!aiSanction.data?.text);

  // 9. Analytics, Audit Trail & CSV Reports
  console.log('\n[8] ANALYTICS, AUDIT LOGS & FORENSIC EXPORTS');
  const analyticsRes = await request('GET', '/api/analytics/summary', null, tokens['ADMIN']);
  assert('Administrative Analytics Summary', analyticsRes.status === 200 && (analyticsRes.data?.summary?.totalApplications > 0 || analyticsRes.data?.data?.totalApplications > 0));

  const auditLogsRes = await request('GET', '/api/audit-logs', null, tokens['ADMIN']);
  assert('Forensic Audit Trail Retrieval', auditLogsRes.status === 200 && Array.isArray(auditLogsRes.data?.logs) && auditLogsRes.data.logs.length > 0);

  const exportRes = await request('GET', '/api/reports/export/applications', null, tokens['ADMIN']);
  assert('Export CSV Applications Report', exportRes.status === 200 && typeof exportRes.raw === 'string' && exportRes.raw.includes('Application ID'));

  // FINAL SUMMARY
  console.log('\n====================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`  RESULTS: ${passed} / ${total} TESTS PASSED (${failed} failed)`);
  console.log('====================================================\n');

  if (failed === 0) {
    console.log('🎉 ALL APPLICATION MODULES & FEATURES VERIFIED WORKING 100%!');
    process.exit(0);
  } else {
    process.exit(1);
  }
})();
