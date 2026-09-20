import {
  User,
  Scheme,
  Application,
  AnalyticsSummary,
  AuditLog,
  Notification,
  DisbursementPlan,
  EligibilityResult,
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('subsidy_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
}

export const api = {
  // Auth
  login: (emailOrUsername: string, password: string) =>
    request<{ success: boolean; token: string; user: User; message?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername, password }),
    }),

  register: (payload: any) =>
    request<{ success: boolean; token: string; user: User; message?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  switchDemoRole: (role: string) =>
    request<{ success: boolean; token: string; user: User; message?: string }>('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  getCurrentUser: () => request<{ success: boolean; user: User }>('/auth/me'),

  // Schemes
  getSchemes: () => request<{ success: boolean; schemes: Scheme[] }>('/schemes'),
  getScheme: (id: string) => request<{ success: boolean; scheme: Scheme }>(`/schemes/${id}`),
  createScheme: (scheme: Partial<Scheme>) =>
    request<{ success: boolean; scheme: Scheme }>('/schemes', {
      method: 'POST',
      body: JSON.stringify(scheme),
    }),
  updateScheme: (id: string, scheme: Partial<Scheme>) =>
    request<{ success: boolean; scheme: Scheme }>(`/schemes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(scheme),
    }),
  deleteScheme: (id: string) =>
    request<{ success: boolean; message: string }>(`/schemes/${id}`, {
      method: 'DELETE',
    }),

  // Applications
  getMyApplications: () =>
    request<{ success: boolean; applications: Application[] }>('/applications/my'),
  getAllApplications: (params: { stage?: string; status?: string; schemeId?: string } = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ success: boolean; applications: Application[] }>(
      `/applications${query ? `?${query}` : ''}`
    );
  },
  getApplicationDetails: (id: string) =>
    request<{
      success: boolean;
      application: Application;
      scheme?: Scheme;
      eligibility?: EligibilityResult;
      verifications?: any[];
      history?: any[];
      disbursementPlan?: DisbursementPlan;
    }>(`/applications/${id}`),

  createApplication: (payload: any) =>
    request<{ success: boolean; application: Application; eligibilityResult?: EligibilityResult }>(
      '/applications',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  submitApplication: (id: string) =>
    request<{ success: boolean; application: Application; eligibilityResult?: EligibilityResult }>(
      `/applications/${id}/submit`,
      { method: 'POST' }
    ),

  resubmitApplication: (id: string, payload: any) =>
    request<{ success: boolean; message?: string; application: Application; eligibilityResult?: EligibilityResult }>(
      `/applications/${id}/resubmit`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  evaluateEligibility: (id: string) =>
    request<{ success: boolean; result: EligibilityResult }>(`/applications/${id}/evaluate`, {
      method: 'POST',
    }),

  // Verifications
  getPendingVerifications: () =>
    request<{ success: boolean; applications: Application[]; stage: string }>(
      '/verifications/pending'
    ),

  approveVerification: (
    applicationId: string,
    payload: { remarks: string; groundChecklist?: any[]; evidenceNotes?: string }
  ) =>
    request<{ success: boolean; message: string; nextStatus: string }>(
      `/verifications/${applicationId}/approve`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  rejectVerification: (applicationId: string, payload: { remarks: string }) =>
    request<{ success: boolean; message: string }>(
      `/verifications/${applicationId}/reject`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  requestReapplication: (
    applicationId: string,
    payload: { remarks: string; requestedChanges: string[] }
  ) =>
    request<{ success: boolean; message: string }>(
      `/verifications/${applicationId}/reapply`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  requestReverification: (applicationId: string, payload: { remarks: string }) =>
    request<{ success: boolean; message: string }>(
      `/verifications/${applicationId}/reverify`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  // Disbursement & Compliance
  getDisbursementPlan: (applicationId: string) =>
    request<{ success: boolean; plan: DisbursementPlan | null }>(
      `/disbursements/${applicationId}`
    ),

  submitMilestoneCompliance: (
    milestoneId: string,
    payload: { docName: string; docUrl: string; remarks: string }
  ) =>
    request<{ success: boolean; milestone: any }>(`/compliance/${milestoneId}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  reviewMilestoneCompliance: (
    milestoneId: string,
    payload: { decision: 'APPROVE' | 'REJECT'; remarks: string }
  ) =>
    request<{ success: boolean; milestone: any }>(`/compliance/${milestoneId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  releaseMilestoneFund: (
    milestoneId: string,
    payload: { transactionRef?: string; paymentMode?: string; remarks?: string }
  ) =>
    request<{ success: boolean; milestone: any; plan: any }>(
      `/disbursements/milestones/${milestoneId}/release`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  // Analytics & Audit
  getAnalyticsSummary: () =>
    request<{ success: boolean; data: AnalyticsSummary }>('/analytics/summary'),

  getAuditLogs: (params: { role?: string; action?: string; search?: string } = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ success: boolean; logs: AuditLog[] }>(`/audit${query ? `?${query}` : ''}`);
  },

  // Notifications
  getNotifications: () =>
    request<{ success: boolean; notifications: Notification[]; unreadCount: number }>(
      '/notifications'
    ),
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/notifications/read-all', { method: 'PUT' }),

  // System
  resetDemoDatabase: () =>
    request<{ success: boolean; message: string }>('/system/reset-demo', { method: 'POST' }),

  // AI Assistant & Copilot
  sendAiChat: (payload: {
    messages: { role: 'user' | 'model' | 'assistant' | 'system'; content: string }[];
    context?: {
      currentView?: string;
      applicationId?: string;
      schemeId?: string;
    };
  }) =>
    request<{ success: boolean; message: string; source: 'gemini' | 'local-engine' }>(
      '/ai/chat',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  getAiCopilotSuggestion: (payload: {
    action: 'DRAFT_REMARKS' | 'DRAFT_RECTIFICATION' | 'ANALYZE_ELIGIBILITY' | 'DRAFT_SANCTION';
    data: any;
    context?: {
      currentView?: string;
      applicationId?: string;
      schemeId?: string;
    };
  }) =>
    request<{ success: boolean; text: string; source: string }>('/ai/copilot', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
