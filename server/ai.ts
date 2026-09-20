import { GoogleGenAI } from '@google/genai';
import { db, Application, Scheme } from './db';

// Lazy-initialized Gemini client
let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant' | 'system';
  content: string;
}

export interface ChatContext {
  role?: string;
  userName?: string;
  region?: string;
  currentView?: string;
  applicationId?: string;
  schemeId?: string;
}

/**
 * Builds live platform context from the database to ground the AI responses.
 */
export function buildGroundingContext(context?: ChatContext): string {
  const schemes = db.get('schemes') || [];
  const schemeSummaries = schemes.map((s: Scheme) => {
    return `- [${s.code}] "${s.name}": ${s.description} | Max Grant: ₹${s.maxGrant?.toLocaleString('en-IN')} | Category: ${s.category} | Target: ${s.targetRegion} | Criteria Count: ${s.criteria?.length || 0} | Milestones: ${s.defaultMilestones?.length || 0} stages.`;
  }).join('\n');

  let activeAppContext = '';
  if (context?.applicationId) {
    const apps = db.get('applications') || [];
    const app = apps.find((a: Application) => a.id === context.applicationId || a.applicationNumber === context.applicationId);
    if (app) {
      activeAppContext = `
CURRENT ACTIVE APPLICATION IN VIEW:
- Application Number: ${app.applicationNumber}
- Scheme: ${app.schemeName} (ID: ${app.schemeId})
- Beneficiary: ${app.beneficiaryName} (Email: ${app.beneficiaryEmail}, Phone: ${app.beneficiaryPhone}, Region: ${app.region})
- Current Status: ${app.status} (Stage: ${app.currentStage})
- Eligibility Score: ${app.eligibilityScore || 0}/${app.maxScore || 100} (Eligible: ${app.isEligible ? 'YES' : 'NO'})
- Proposed Grant Amount: ₹${app.grantAmount?.toLocaleString('en-IN')}
- Annual Income: ₹${app.applicantData?.income?.annualIncome?.toLocaleString('en-IN')}
- Category: ${app.applicantData?.category?.socialCategory || 'General'}
- Revision Count: ${app.revisionCount || 0}
${app.reapplicationRequest ? `- REAPPLICATION REASON from ${app.reapplicationRequest.officerRole}: "${app.reapplicationRequest.remarks}". Requested Changes: ${app.reapplicationRequest.requestedChanges?.join(', ')}` : ''}
${app.reverificationNote ? `- REVERIFICATION NOTE: "${app.reverificationNote.reason}"` : ''}
${app.beneficiaryResponse ? `- LATEST BENEFICIARY RESPONSE: "${app.beneficiaryResponse}"` : ''}
      `.trim();
    }
  }

  return `
PLATFORM SCHEMES DIRECTORY (Live GrantSetu Registry):
${schemeSummaries}

${activeAppContext}
  `.trim();
}

/**
 * Fallback response generator in case GEMINI_API_KEY is not configured or rate-limited.
 */
function generateFallbackResponse(userPrompt: string, context?: ChatContext): string {
  const query = userPrompt.toLowerCase();
  const schemes = db.get('schemes') || [];

  if (query.includes('eligib') || query.includes('qualif') || query.includes('score')) {
    return `### 📋 GrantSetu Eligibility Framework & Scoring Norms

In **GrantSetu**, applicant qualification is evaluated using a weighted multi-factor scoring model (0–100 scale):

1. **Annual Income Slab (30–40 pts)**:
   - Below ₹1,50,000: Full score (40 pts)
   - ₹1,50,001 – ₹2,50,000: 25 pts
   - Above threshold: 0 pts (often hard prerequisite)
2. **Land Holding & Demographics (25–35 pts)**:
   - Marginal farmers (<2.5 acres) and priority categories (SC/ST/Women/PWD) receive affirmative scoring boosts.
3. **Project Feasibility & Modernization (20–30 pts)**:
   - Quotation viability, certified DPR (Detailed Project Report), and sustainable technology adoption.

**Minimum Qualifying Score**: Most schemes require **≥70/100 points** for automated advancement to Field Officer physical scrutiny.`;
  }

  if (query.includes('reapply') || query.includes('re-apply') || query.includes('rectif') || query.includes('return') || query.includes('send back')) {
    return `### 🔄 Application Rectification & Re-submission Guide

When an officer returns your application under **Reverse Workflow**:
1. **Check Officer Notes**: Review the exact discrepancy noted in the official notification banner (e.g. Tehsildar revenue seal, updated quotation, IFSC correction).
2. **Update Required Details**: Enter the amended annual income, scope description, or upload fresh certified PDF documents in your Application Details portal.
3. **State Clear Compliance**: Add a brief explanation in the *Compliance Note* box (e.g., *"Uploaded Tehsildar-certified revenue proof dated 2026 as directed"*).
4. **Resubmit**: Click **"Resubmit Application Back to Officer"**. The dynamic scoring engine automatically recalculates your score and places your application right back in the designated officer's verification desk!`;
  }

  if (query.includes('solar') || query.includes('pm-solar') || query.includes('pm-suryaghar')) {
    const s = schemes.find((sc: Scheme) => sc.code.includes('SOLAR') || sc.name.toLowerCase().includes('solar'));
    return `### ☀️ National Solar Rooftop Scheme (PM-Suryaghar)

- **Objective**: Subsidize grid-connected residential & community solar power installations.
- **Grant Scale**: Up to **₹78,000** direct financial assistance or **40% of benchmark capital expenditure**.
- **Eligibility**:
  - Valid residential electricity consumer account.
  - Shadow-free unencumbered rooftop space (>100 sq.ft per kW).
  - Annual income certificate below ₹3,50,000 for maximum subsidy tier.
- **Disbursement**: Released in 2 stages: 50% upon vendor installation verification, 50% upon DISCOM net-metering synchronization.`;
  }

  if (query.includes('kisan') || query.includes('farm') || query.includes('pm-kisan')) {
    const s = schemes.find((sc: Scheme) => sc.code.includes('KISAN') || sc.name.toLowerCase().includes('kisan'));
    return `### 🚜 PM-KISAN Modernization & Agri-Equipment Grant

- **Objective**: Financial aid for acquiring precision farm machinery, micro-irrigation kits, and modernizing agrarian infrastructure.
- **Grant Scale**: Up to **₹2,00,000** (Grade A grant).
- **Eligibility**:
  - Small & marginal farming families (land holding < 5 acres).
  - Family income strictly below ₹2,00,000/annum.
  - Active bank account linked with Aadhaar for DBT.
- **Verification Path**: Field Officer ground survey ➔ District Officer scrutiny ➔ Finance Sanction.`;
  }

  if (query.includes('milestone') || query.includes('disburse') || query.includes('payment') || query.includes('fund')) {
    return `### 💰 Staged Milestone Disbursement Process

Grants in GrantSetu are disbursed in structured milestones via PFMS Direct Benefit Transfer:

1. **Mobilization Advance (30-40%)**: Released immediately upon Finance Director sanction to initiate procurement.
2. **Mid-term Inspection / 50% Work Completion (30-40%)**: Beneficiary uploads geotagged photo proof and tax invoices; verified by field inspectors.
3. **Commissioning & Final Utilization (20-30%)**: Final grant release upon submission of official Utilization Certificate (UC) and DISCOM/Gram Panchayat completion report.`;
  }

  if (query.includes('audit') || query.includes('gfr') || query.includes('officer') || query.includes('scrutiny')) {
    return `### 🛡️ Officer Verification & Scrutiny Checklist

For officers reviewing applications:
- **KYC & Bank Verification**: Ensure bank IFSC, account holder name, and Aadhaar match revenue records without mismatch.
- **Ground Reality Check**: Field officers must confirm physical land possession or enterprise premises.
- **Income Assessment**: Cross-verify revenue authority certificates against reported family assets.
- **Clear Remarks**: When returning for re-application, always list explicit numbered steps so beneficiaries can comply without ambiguity.`;
  }

  return `### 👋 Welcome to GrantSetu AI Sahayak

I am your official **Grant & Subsidy Assistant**, ready to assist beneficiaries, verification officers, and administrators with:

- **Scheme Discovery & Eligibility**: Ask about PM-KISAN, Solar Rooftop, Artisan Subsidies, or MSME grants.
- **Document Requirements**: Know exactly which revenue certificates, bank proofs, and invoices are required.
- **Workflow & Re-applications**: Understand why applications get flagged, how reverse workflows operate, and how to resubmit.
- **Disbursement & DBT Milestones**: Track how staged tranches are approved and disbursed directly to bank accounts.

*How may I assist you with your subsidy application or verification today?*`;
}

/**
 * Handles multi-turn chat with the Gemini API (model: gemini-3.8-flash)
 */
export async function processAiChat(
  messages: ChatMessage[],
  context?: ChatContext
): Promise<{ text: string; source: 'gemini' | 'local-engine' }> {
  const genAI = getGenAI();
  const grounding = buildGroundingContext(context);

  const systemInstruction = `
You are "GrantSetu AI Sahayak", the official intelligent assistant for India's Digital Subsidy & Grant Administration Platform (GrantSetu).
Your mission is to provide authoritative, helpful, clear, and empathetic guidance to Indian citizens, farmers, entrepreneurs, and government verification officers.

SYSTEM ROLES YOU SERVE:
- Beneficiaries / Citizens: Help them understand schemes, check eligibility, calculate prospective grant scores, gather required documents, and guide them through rectifications if their application was returned for re-application.
- Field Officers: Guide on physical on-ground scrutiny norms, KYC inspection, geotagged evidence, and valid reasons to request re-application or approve.
- District Scrutiny Officers: Help review field reports, check quota and category reservations, draft endorsement remarks, or return files back to field officers for re-verification.
- Finance Directors: Help review GFR 2017 compliance, PFMS direct benefit transfer rules, milestone tranche releases, and sanction orders.
- Administrators: Help analyze scheme analytics, disbursements, and audit logs.

USER CONTEXT:
- Active User Role: ${context?.role || 'BENEFICIARY'}
- User Name: ${context?.userName || 'Citizen'}
- User Region: ${context?.region || 'All-India'}
- Current View: ${context?.currentView || 'Dashboard'}

${grounding}

COMMUNICATION GUIDELINES:
1. Format your response cleanly using Markdown: use bolding for key terms, bullet points for lists, and numbered steps for processes.
2. When answering scheme questions, quote actual numbers from the live schemes listed above (grant amounts in ₹, eligibility thresholds, milestones).
3. If an application is returned for re-application, give precise, reassuring step-by-step advice on how the applicant can rectify the deficiency and resubmit.
4. Keep answers professional, precise, warm, and structured.
  `.trim();

  if (!genAI) {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    return {
      text: generateFallbackResponse(lastUserMsg, context),
      source: 'local-engine',
    };
  }

  try {
    // Format conversation history for Gemini API
    const formattedContents = messages.map((m) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    const responseText = response.text || generateFallbackResponse(messages[messages.length - 1]?.content || '', context);

    return {
      text: responseText,
      source: 'gemini',
    };
  } catch (error: any) {
    console.error('Gemini API execution error (falling back to local domain engine):', error?.message || error);
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    return {
      text: generateFallbackResponse(lastUserMsg, context),
      source: 'local-engine',
    };
  }
}

/**
 * Handles specialized copilot actions (e.g. drafting inspection remarks, rectification justifications)
 */
export async function processCopilotAction(
  action: 'DRAFT_REMARKS' | 'DRAFT_RECTIFICATION' | 'ANALYZE_ELIGIBILITY' | 'DRAFT_SANCTION',
  data: any,
  context?: ChatContext
): Promise<{ text: string; source: 'gemini' | 'local-engine' }> {
  const genAI = getGenAI();
  const grounding = buildGroundingContext(context);

  let prompt = '';
  if (action === 'DRAFT_REMARKS') {
    prompt = `You are a Government Officer (${context?.role || 'FIELD_OFFICER'}). Draft a concise, formal, and legally compliant verification remark for application ${data?.applicationNumber || 'in scrutiny'}.
Decision: ${data?.decision || 'APPROVE'}
Key Findings / Observations: ${data?.observations || 'All applicant credentials, revenue documents, and physical site survey meet official scheme guidelines.'}
Scheme: ${data?.schemeTitle || 'Government Subsidy Scheme'}
Format the output as a clean official note (max 3-4 sentences), ready to paste into the official portal scrutiny record.`;
  } else if (action === 'DRAFT_RECTIFICATION') {
    prompt = `You are an Indian citizen / beneficiary preparing a rectification note to the verification officer.
The officer requested these changes: "${data?.requestedChanges || 'Update certified income proof and clarify project scope'}".
Officer Remarks: "${data?.officerRemarks || 'Income proof missing official revenue seal'}".
Actions taken by applicant: "${data?.actionsTaken || 'Obtained freshly certified certificate from Tehsildar with official seal and updated income'}"
Draft a polite, respectful, and crystal-clear explanation note (max 2-3 sentences) explaining the rectifications made for resubmission.`;
  } else if (action === 'DRAFT_SANCTION') {
    prompt = `You are a Finance & Sanction Director. Draft an official Grant Sanction Order memo for Application ${data?.applicationNumber}.
Sanctioned Amount: ₹${data?.amount?.toLocaleString('en-IN') || '1,00,000'}
Scheme: ${data?.schemeTitle || 'Subsidy Scheme'}
Beneficiary: ${data?.beneficiaryName || 'Applicant'}
Include reference to GFR 2017 Rule 230(1), PFMS Direct Benefit Transfer validation, and milestone disbursement tranche release.`;
  } else {
    prompt = `Analyze the eligibility and risk factors for Application ${data?.applicationNumber} against scheme criteria: ${JSON.stringify(data?.applicantData || {})}. Provide a 3-bullet executive summary.`;
  }

  if (!genAI) {
    if (action === 'DRAFT_REMARKS') {
      return {
        text: `Physical on-ground verification completed on site. Verified applicant's identity credentials and primary revenue documentation against Tehsildar records. All asset specifications and eligibility criteria meet the scheme's statutory norms. Recommended for advancement.`,
        source: 'local-engine',
      };
    }
    if (action === 'DRAFT_RECTIFICATION') {
      return {
        text: `In compliance with the officer's directives, I have obtained and attached the re-certified income proof bearing the official seal of the Tehsildar (dated 2026). The project scope and equipment quotations have also been revised and reconciled as requested. Kindly accept the application for further processing.`,
        source: 'local-engine',
      };
    }
    if (action === 'DRAFT_SANCTION') {
      return {
        text: `Sanction of the Competent Authority is hereby conveyed for the grant-in-aid of ₹${data?.amount?.toLocaleString('en-IN') || '2,00,000'} under Rule 230 of GFR 2017. Staged disbursement via PFMS DBT is approved subject to verification of milestone utilization certificates.`,
        source: 'local-engine',
      };
    }
    return {
      text: `Applicant satisfies the primary income and landholding ceilings with a high composite score (90/100). No red flags observed in statutory documentation.`,
      source: 'local-engine',
    };
  }

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are an executive AI assistant specialized in Indian government subsidy and grant administration (GrantSetu). ${grounding}`,
        temperature: 0.4,
      },
    });

    return {
      text: response.text?.trim() || 'Verification assessment successfully generated.',
      source: 'gemini',
    };
  } catch (err) {
    console.error('Copilot generation error:', err);
    if (action === 'DRAFT_REMARKS') {
      return {
        text: `Physical on-ground verification completed on site. Verified applicant's identity credentials and primary revenue documentation against Tehsildar records. All asset specifications and eligibility criteria meet the scheme's statutory norms. Recommended for advancement.`,
        source: 'local-engine',
      };
    }
    if (action === 'DRAFT_SANCTION') {
      return {
        text: `Sanction of the Competent Authority is hereby conveyed for the grant-in-aid of ₹${data?.amount?.toLocaleString('en-IN') || '2,00,000'} under Rule 230 of GFR 2017. Staged disbursement via PFMS DBT is approved subject to verification of milestone utilization certificates.`,
        source: 'local-engine',
      };
    }
    return {
      text: `In compliance with the officer's directives, I have obtained and attached the re-certified documentation with the official seal of the competent authority. Kindly accept the revised application for further processing.`,
      source: 'local-engine',
    };
  }
}
