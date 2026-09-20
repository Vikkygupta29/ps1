import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { BeneficiaryDashboard } from './pages/beneficiary/BeneficiaryDashboard';
import { ApplicationDetailsView } from './pages/beneficiary/ApplicationDetailsView';
import { SchemesCatalog } from './pages/schemes/SchemesCatalog';
import { OfficerDashboard } from './pages/officers/OfficerDashboard';
import { FinanceDashboard } from './pages/finance/FinanceDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SchemeApplyModal } from './pages/beneficiary/SchemeApplyModal';
import { Scheme, UserRole } from './types';
import { api } from './services/api';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('beneficiary-dashboard');
  const [activeAppId, setActiveAppId] = useState<string | null>(null);

  // Apply Modal state when directly clicking "apply-scheme"
  const [selectedSchemeForApply, setSelectedSchemeForApply] = useState<Scheme | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Automatically route to the role's primary home view when user or role changes
  useEffect(() => {
    if (user) {
      if (user.role === 'BENEFICIARY') setCurrentView('beneficiary-dashboard');
      else if (user.role === 'FIELD_OFFICER') setCurrentView('field-officer-queue');
      else if (user.role === 'DISTRICT_OFFICER') setCurrentView('district-officer-queue');
      else if (user.role === 'FINANCE_APPROVER') setCurrentView('finance-dashboard');
      else if (user.role === 'ADMIN') setCurrentView('admin-analytics');
    }
  }, [user?.role, user?.id]);

  const handleLoginSuccess = (role: UserRole) => {
    if (role === 'BENEFICIARY') setCurrentView('beneficiary-dashboard');
    else if (role === 'FIELD_OFFICER') setCurrentView('field-officer-queue');
    else if (role === 'DISTRICT_OFFICER') setCurrentView('district-officer-queue');
    else if (role === 'FINANCE_APPROVER') setCurrentView('finance-dashboard');
    else if (role === 'ADMIN') setCurrentView('admin-analytics');
  };

  const handleNavigate = async (view: string, param?: string) => {
    if (view === 'apply-scheme') {
      try {
        const res = await api.getSchemes();
        if (res.success && res.schemes.length > 0) {
          setSelectedSchemeForApply(res.schemes[0]);
          setIsApplyModalOpen(true);
        }
      } catch (e) {
        console.error(e);
      }
      return;
    }

    if (param) {
      setActiveAppId(param);
    }
    setCurrentView(view);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium tracking-wide">
            Loading GrantSetu Portal...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated: render LoginPage
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const renderView = () => {
    // Application Details (Inspect / Track / Review Re-application / Submit Milestones)
    if (currentView === 'application-details' && activeAppId) {
      return (
        <ApplicationDetailsView
          applicationId={activeAppId}
          onBack={() => {
            if (user?.role === 'BENEFICIARY') setCurrentView('beneficiary-dashboard');
            else if (user?.role === 'FIELD_OFFICER') setCurrentView('field-officer-queue');
            else if (user?.role === 'DISTRICT_OFFICER') setCurrentView('district-officer-queue');
            else if (user?.role === 'FINANCE_APPROVER') setCurrentView('finance-dashboard');
            else setCurrentView('admin-applications');
          }}
        />
      );
    }

    // Schemes catalog
    if (currentView === 'schemes-catalog') {
      return <SchemesCatalog onNavigate={handleNavigate} />;
    }

    // Role-specific workspaces
    if (user.role === 'FIELD_OFFICER' || currentView === 'field-officer-queue' || currentView === 'officer-history') {
      return <OfficerDashboard onNavigate={handleNavigate} />;
    }

    if (user.role === 'DISTRICT_OFFICER' || currentView === 'district-officer-queue') {
      return <OfficerDashboard onNavigate={handleNavigate} />;
    }

    if (
      user.role === 'FINANCE_APPROVER' ||
      currentView === 'finance-dashboard' ||
      currentView === 'finance-disbursements'
    ) {
      return <FinanceDashboard onNavigate={handleNavigate} />;
    }

    if (
      user.role === 'ADMIN' ||
      currentView === 'admin-analytics' ||
      currentView === 'admin-schemes' ||
      currentView === 'admin-applications' ||
      currentView === 'admin-audit' ||
      currentView === 'admin-reports'
    ) {
      const tabMap: Record<string, string> = {
        'admin-analytics': 'ANALYTICS',
        'admin-schemes': 'SCHEMES',
        'admin-applications': 'APPLICATIONS',
        'admin-audit': 'AUDIT',
        'admin-reports': 'REPORTS',
      };
      return <AdminDashboard initialTab={tabMap[currentView] || 'ANALYTICS'} onNavigate={handleNavigate} />;
    }

    // Default Beneficiary View (also handles my-applications & milestones-compliance)
    return <BeneficiaryDashboard onNavigate={handleNavigate} />;
  };

  return (
    <AppLayout currentView={currentView} activeAppId={activeAppId} onNavigate={handleNavigate}>
      {renderView()}

      {/* Global Quick Apply Modal */}
      {selectedSchemeForApply && (
        <SchemeApplyModal
          isOpen={isApplyModalOpen}
          onClose={() => {
            setIsApplyModalOpen(false);
            setSelectedSchemeForApply(null);
          }}
          selectedScheme={selectedSchemeForApply}
          onSubmitted={(newAppId) => {
            handleNavigate('application-details', newAppId);
          }}
        />
      )}
    </AppLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
