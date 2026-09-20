import React, { useState, useEffect } from 'react';
import {
  Building,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  DollarSign,
  ArrowRight,
  Info,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { Scheme } from '../../types';
import { api } from '../../services/api';
import { SchemeApplyModal } from '../beneficiary/SchemeApplyModal';

interface SchemesCatalogProps {
  onNavigate: (view: string, param?: string) => void;
}

export const SchemesCatalog: React.FC<SchemesCatalogProps> = ({ onNavigate }) => {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  useEffect(() => {
    const fetchSchemes = async () => {
      setIsLoading(true);
      try {
        const res = await api.getSchemes();
        if (res.success) setSchemes(res.schemes);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchemes();
  }, []);

  const filteredSchemes = schemes.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || s.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Available Subsidy Schemes
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse active welfare programs and apply with automated eligibility scoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search schemes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-52 focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-hidden"
          >
            <option value="ALL">All Categories</option>
            <option value="Agriculture & Solar">Agriculture & Solar</option>
            <option value="Micro Enterprise">Micro Enterprise</option>
            <option value="Dairy & Animal Husbandry">Dairy & Husbandry</option>
          </select>
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchemes.map((scheme) => (
          <div
            key={scheme.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  {scheme.code}
                </span>
                <span className="text-[11px] font-medium text-slate-500">{scheme.category}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                  {scheme.name}
                </h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {scheme.description}
                </p>
              </div>

              {/* Scheme Key Bounds */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Max Sanction Grant:</span>
                  <span className="font-bold text-emerald-700">
                    ₹{scheme.maxGrant.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Annual Income Ceiling:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{scheme.maxIncome.toLocaleString('en-IN')} / year
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Eligible Age Range:</span>
                  <span className="font-semibold text-slate-800">
                    {scheme.minAge} – {scheme.maxAge} years
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Jurisdiction:</span>
                  <span className="font-semibold text-slate-800">{scheme.targetRegion}</span>
                </div>
              </div>

              {/* Mandatory Documents Checklist */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Required Documentation
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {scheme.requiredDocuments?.map((doc, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
                    >
                      {doc.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Open Window
              </span>

              <button
                onClick={() => {
                  setSelectedScheme(scheme);
                  setIsApplyModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
              >
                Apply Now
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedScheme && (
        <SchemeApplyModal
          isOpen={isApplyModalOpen}
          onClose={() => {
            setIsApplyModalOpen(false);
            setSelectedScheme(null);
          }}
          selectedScheme={selectedScheme}
          onSubmitted={(appId) => {
            onNavigate('application-details', appId);
          }}
        />
      )}
    </div>
  );
};
