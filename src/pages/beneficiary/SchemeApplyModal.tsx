import React, { useState } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  AlertCircle,
  FileCheck,
  Building,
  User,
  MapPin,
  Coins,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { Scheme, ApplicationDocument } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../../components/common/Modal';

interface SchemeApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedScheme: Scheme | null;
  onSubmitted: (appId: string) => void;
}

export const SchemeApplyModal: React.FC<SchemeApplyModalProps> = ({
  isOpen,
  onClose,
  selectedScheme,
  onSubmitted,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    personal: {
      fullName: user?.fullName || 'Anita Sharma',
      aadhaarNumber: 'XXXX-XXXX-8921',
      dateOfBirth: '1992-06-15',
      gender: 'FEMALE',
      phone: user?.phone || '+91 98765 43210',
      email: user?.email || 'anita.sharma@example.gov.in',
    },
    address: {
      addressLine: 'Plot 42, Green Valley Ward 4',
      district: user?.region || 'North District',
      state: 'State Social Administration',
      pincode: '110045',
      region: user?.region || 'North District',
    },
    income: {
      annualIncome: 145000,
      occupation: 'Handloom Artisan & Micro Retailer',
      landOwnershipAcres: 0.75,
      familyMembersCount: 4,
    },
    category: {
      socialCategory: 'OBC',
      isDifferentlyAbled: false,
      previousSubsidyReceived: false,
    },
    schemeSpecific: {
      proposedProjectTitle: 'Handloom Micro Loom Modernization & Raw Material Unit',
      projectDescription:
        'Procurement of 2 semi-automatic handlooms and eco-friendly dyeing vat setup for local self-help group employment.',
      estimatedCost: selectedScheme ? selectedScheme.maxGrant : 200000,
      bankAccountNo: '98765432109876',
      ifscCode: 'SBIN0001234',
      bankName: 'State Bank of India',
      branchName: 'North District Main Branch',
    },
  });

  const [uploadedDocs, setUploadedDocs] = useState<ApplicationDocument[]>([
    {
      id: 'doc-1',
      applicationId: '',
      documentType: 'AADHAAR',
      documentName: 'Aadhaar_Card_Verified.pdf',
      documentUrl: '/docs/aadhaar_mock.pdf',
      fileSize: '1.2 MB',
      uploadedAt: new Date().toISOString(),
      verified: true,
    },
    {
      id: 'doc-2',
      applicationId: '',
      documentType: 'INCOME_CERT',
      documentName: 'Tehsildar_Income_Certificate_2026.pdf',
      documentUrl: '/docs/income_cert.pdf',
      fileSize: '950 KB',
      uploadedAt: new Date().toISOString(),
      verified: true,
    },
    {
      id: 'doc-3',
      applicationId: '',
      documentType: 'BANK_PASSBOOK',
      documentName: 'SBI_Passbook_Frontpage.pdf',
      documentUrl: '/docs/bank_passbook.pdf',
      fileSize: '1.8 MB',
      uploadedAt: new Date().toISOString(),
      verified: true,
    },
  ]);

  if (!selectedScheme) return null;

  const STEPS = [
    { num: 1, title: 'Personal Info', icon: User },
    { num: 2, title: 'Address', icon: MapPin },
    { num: 3, title: 'Income & Land', icon: Coins },
    { num: 4, title: 'Category', icon: ShieldAlert },
    { num: 5, title: 'Project & Bank', icon: Building },
    { num: 6, title: 'Documents', icon: Upload },
    { num: 7, title: 'Review & Submit', icon: Check },
  ];

  const handleFileUpload = (docType: string, label: string) => {
    const fakeDoc: ApplicationDocument = {
      id: `doc-${Date.now()}`,
      applicationId: '',
      documentType: docType,
      documentName: `${label.replace(/\s+/g, '_')}_Document.pdf`,
      documentUrl: `/uploads/${docType.toLowerCase()}_sample.pdf`,
      fileSize: '1.4 MB',
      uploadedAt: new Date().toISOString(),
      verified: true,
    };
    setUploadedDocs((prev) => [...prev.filter((d) => d.documentType !== docType), fakeDoc]);
    showToast(`Uploaded ${label} successfully`);
  };

  const handleSubmit = async (submitImmediately: boolean) => {
    setIsSubmitting(true);
    try {
      const payload = {
        schemeId: selectedScheme.id,
        applicantData: formData,
        documents: uploadedDocs,
        submitImmediately,
      };

      const res = await api.createApplication(payload);
      if (res.success) {
        showToast(
          submitImmediately
            ? `Application submitted! Eligibility Score: ${res.application.eligibilityScore}/100`
            : 'Application saved as draft!'
        );
        onSubmitted(res.application.id);
        onClose();
      }
    } catch (err: any) {
      showToast(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Application Form: ${selectedScheme.name}`}
      subtitle={`Scheme Code: ${selectedScheme.code} | Max Subsidy: ₹${selectedScheme.maxGrant.toLocaleString('en-IN')}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Step Indicator Stepper */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between overflow-x-auto gap-2">
            {STEPS.map((s) => {
              const isCompleted = s.num < currentStep;
              const isActive = s.num === currentStep;
              const Icon = s.icon;
              return (
                <div
                  key={s.num}
                  onClick={() => setCurrentStep(s.num)}
                  className={`flex items-center gap-2 cursor-pointer px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : isCompleted
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      isActive
                        ? 'bg-white text-blue-700 font-bold'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : s.num}
                  </div>
                  <span className="text-xs">{s.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Form Contents */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs min-h-[360px]">
          {/* STEP 1: PERSONAL DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Step 1: Beneficiary Identity & Personal Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Legal Name (as on Aadhaar)</label>
                  <input
                    type="text"
                    value={formData.personal.fullName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal: { ...formData.personal, fullName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Aadhaar Identification Number</label>
                  <input
                    type="text"
                    value={formData.personal.aadhaarNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal: { ...formData.personal, aadhaarNumber: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.personal.dateOfBirth}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal: { ...formData.personal, dateOfBirth: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Gender</label>
                  <select
                    value={formData.personal.gender}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal: { ...formData.personal, gender: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="FEMALE">Female (Special Priority Scoring)</option>
                    <option value="MALE">Male</option>
                    <option value="TRANSGENDER">Transgender</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile Contact Phone</label>
                  <input
                    type="text"
                    value={formData.personal.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal: { ...formData.personal, phone: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.personal.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal: { ...formData.personal, email: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ADDRESS & REGION */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Step 2: Domicile & Residential Jurisdiction
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Permanent Address Line</label>
                  <input
                    type="text"
                    value={formData.address.addressLine}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, addressLine: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">District / Administrative Region</label>
                  <select
                    value={formData.address.region}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, region: e.target.value, district: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="North District">North District</option>
                    <option value="South District">South District</option>
                    <option value="East District">East District</option>
                    <option value="West District">West District</option>
                    <option value="Central District">Central District</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.address.pincode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, pincode: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: INCOME & LAND */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Coins className="w-4 h-4 text-blue-600" />
                Step 3: Socio-Economic Profile & Landholding
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Certified Annual Household Income (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={formData.income.annualIncome}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        income: { ...formData.income, annualIncome: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Scheme Max Income Ceiling: ₹{selectedScheme.maxIncome.toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Agricultural Landholding (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.income.landOwnershipAcres}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        income: { ...formData.income, landOwnershipAcres: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Current Primary Occupation</label>
                  <input
                    type="text"
                    value={formData.income.occupation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        income: { ...formData.income, occupation: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Number of Dependent Family Members</label>
                  <input
                    type="number"
                    value={formData.income.familyMembersCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        income: { ...formData.income, familyMembersCount: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CATEGORY & PRIORITY */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                Step 4: Social Category & Affirmative Action Points
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Social Reservation Category</label>
                  <select
                    value={formData.category.socialCategory}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: { ...formData.category, socialCategory: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="OBC">Other Backward Classes (OBC)</option>
                    <option value="SC">Scheduled Caste (SC)</option>
                    <option value="ST">Scheduled Tribe (ST)</option>
                    <option value="EWS">Economically Weaker Section (EWS)</option>
                    <option value="GENERAL">General Category</option>
                  </select>
                </div>

                <div className="flex flex-col justify-center space-y-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.category.isDifferentlyAbled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: { ...formData.category, isDifferentlyAbled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="font-medium text-slate-700">Applicant is Differently-Abled (PwD)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.category.previousSubsidyReceived}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: { ...formData.category, previousSubsidyReceived: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="font-medium text-slate-700">
                      Has received central/state subsidy in past 3 years
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SCHEME PROJECT & DBT BANK DETAILS */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                Step 5: Proposed Project Plan & Direct Benefit Transfer Bank Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Proposed Project Title</label>
                  <input
                    type="text"
                    value={formData.schemeSpecific.proposedProjectTitle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        schemeSpecific: {
                          ...formData.schemeSpecific,
                          proposedProjectTitle: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Project Description & Utilization</label>
                  <textarea
                    rows={2}
                    value={formData.schemeSpecific.projectDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        schemeSpecific: {
                          ...formData.schemeSpecific,
                          projectDescription: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Direct Transfer Bank Account No</label>
                  <input
                    type="text"
                    value={formData.schemeSpecific.bankAccountNo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        schemeSpecific: {
                          ...formData.schemeSpecific,
                          bankAccountNo: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bank IFSC Code</label>
                  <input
                    type="text"
                    value={formData.schemeSpecific.ifscCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        schemeSpecific: {
                          ...formData.schemeSpecific,
                          ifscCode: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.schemeSpecific.bankName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        schemeSpecific: {
                          ...formData.schemeSpecific,
                          bankName: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={formData.schemeSpecific.branchName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        schemeSpecific: {
                          ...formData.schemeSpecific,
                          branchName: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: DOCUMENTS UPLOAD */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                Step 6: Upload Mandatory Verification Certificates & Documents
              </h4>

              <div className="space-y-3">
                {selectedScheme.requiredDocuments?.map((doc, idx) => {
                  const isUploaded = uploadedDocs.some((d) => d.documentType === doc.type);
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{doc.label}</span>
                          {doc.mandatory && (
                            <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-bold">
                              MANDATORY
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Format: PDF, JPG, PNG (Max 5MB)
                        </p>
                      </div>

                      {isUploaded ? (
                        <div className="flex items-center gap-2 text-emerald-700 font-medium">
                          <FileCheck className="w-4 h-4" />
                          <span>Uploaded & Ready</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleFileUpload(doc.type, doc.label)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload File
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 7: REVIEW & SUBMIT */}
          {currentStep === 7 && (
            <div className="space-y-5 text-xs">
              <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                Step 7: Final Application Review & Automated Eligibility Scoring
              </h4>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    AI
                  </div>
                  <div>
                    <h5 className="font-bold text-blue-950 text-xs uppercase tracking-wide">
                      Automated Scoring Engine Pre-Check
                    </h5>
                    <p className="text-blue-900 text-xs mt-0.5 leading-relaxed">
                      Upon clicking <strong>"Submit Application"</strong>, your application will be instantly
                      evaluated by our rule engine against income, age, landholding, and category criteria. If
                      cleared, it will be automatically dispatched to the Field Officer for on-ground verification.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1.5">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                    Applicant Summary
                  </span>
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Name:</strong> {formData.personal.fullName}
                  </p>
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Aadhaar:</strong> {formData.personal.aadhaarNumber}
                  </p>
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Region:</strong> {formData.address.region}
                  </p>
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Annual Income:</strong> ₹
                    {formData.income.annualIncome.toLocaleString('en-IN')}
                  </p>
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Landholding:</strong> {formData.income.landOwnershipAcres} Acres
                  </p>
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Category:</strong> {formData.category.socialCategory}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1.5">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                    Grant & DBT Bank Account
                  </span>
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Scheme:</strong> {selectedScheme.name} ({selectedScheme.code})
                  </p>
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Sanction Ceiling:</strong> ₹
                    {selectedScheme.maxGrant.toLocaleString('en-IN')}
                  </p>
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Bank Account:</strong> {formData.schemeSpecific.bankAccountNo}
                  </p>
                  <p className="text-slate-700">
                    <strong className="text-slate-900">IFSC & Bank:</strong> {formData.schemeSpecific.ifscCode} ({formData.schemeSpecific.bankName})
                  </p>
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Uploaded Documents:</strong> {uploadedDocs.length} / {selectedScheme.requiredDocuments?.length || 0}
                  </p>
                </div>
              </div>

              {/* Dynamic Scheme-Specific Criteria Matrix */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Dynamic Scheme Criteria Evaluated ({selectedScheme.criteria?.length || 0} Rules)
                  </span>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Max Scheme Score: {selectedScheme.criteria?.reduce((acc, c) => acc + c.points, 0) || 100} pts
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedScheme.criteria?.map((cr) => (
                    <div
                      key={cr.id}
                      className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-start justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 text-xs">{cr.name}</span>
                          {cr.isMandatory && (
                            <span className="text-[9px] bg-rose-50 text-rose-700 px-1 rounded font-bold border border-rose-200">
                              MANDATORY
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">{cr.description}</p>
                      </div>
                      <span className="shrink-0 font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] border border-blue-100">
                        +{cr.points}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Grant Slabs */}
              {selectedScheme.grantSlabs && selectedScheme.grantSlabs.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                    Dynamic Grant Slabs (Score to Sanction Conversion)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedScheme.grantSlabs.map((slab) => (
                      <span
                        key={slab.id}
                        className="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 text-[11px] font-medium"
                      >
                        <strong className="text-emerald-700">₹{slab.grantAmount.toLocaleString('en-IN')}</strong>{' '}
                        (Score {slab.minScore}–{slab.maxScore}) — {slab.slabName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stepper Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            type="button"
            disabled={currentStep === 1 || isSubmitting}
            onClick={() => setCurrentStep((c) => Math.max(1, c - 1))}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {currentStep < 7 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((c) => Math.min(7, c + 1))}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(true)}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Evaluating & Submitting...' : 'Submit Application'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
