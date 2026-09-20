import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  X,
  RotateCcw,
  Copy,
  Check,
  Bot,
  User as UserIcon,
  ShieldCheck,
  HelpCircle,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Landmark,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: 'gemini' | 'local-engine';
}

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  activeAppId?: string | null;
  onNavigate?: (view: string, param?: string) => void;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  currentView,
  activeAppId,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial welcome message tailored to the user's role
  useEffect(() => {
    if (messages.length === 0) {
      let welcomeText = '';
      if (user?.role === 'BENEFICIARY') {
        welcomeText = `Namaste ${user?.fullName || 'Citizen'}! I am **GrantSetu AI Sahayak**, your official subsidy guide. 
        
I can help you:
- **Discover Eligible Schemes**: Learn about solar rooftop, agricultural modernization, and artisan subsidies.
- **Check Document Rules**: Understand Tehsildar income certificates, land records, and bank validations.
- **Fix & Resubmit Applications**: If an officer requested changes, I will guide your rectification and draft compliance notes.
- **Track Milestones**: Learn how staged DBT funds are disbursed into your bank account.`;
      } else if (user?.role === 'FIELD_OFFICER') {
        welcomeText = `Officer ${user?.fullName || ''}, welcome to the **AI Scrutiny Copilot**. 

I can assist your on-ground field inspection duties with:
- **Physical Verification Checklists**: Standard equipment inspection criteria and geotagging norms.
- **Reverse Workflow Guidance**: Valid statutory grounds to request re-application from applicants.
- **Drafting Official Notes**: Generate concise, legally compliant field inspection remarks.`;
      } else if (user?.role === 'DISTRICT_OFFICER') {
        welcomeText = `Welfare Officer ${user?.fullName || ''}, your **District Scrutiny AI Assistant** is active.

I can help you:
- **Verify Submissions**: Cross-check income certificates, demographic quotas, and DPR feasibility.
- **Direct Re-verification**: Guidelines for returning files to field inspectors.
- **Draft Endorsement Remarks**: Generate formal scrutiny memos for finance sanction.`;
      } else if (user?.role === 'FINANCE_APPROVER') {
        welcomeText = `Director ${user?.fullName || ''}, welcome to the **Finance & Sanction AI Advisor**.

I can assist with:
- **GFR 2017 & PFMS Guidelines**: Direct Benefit Transfer compliance, sanction order templates, and e-voucher rules.
- **Milestone Tranche Authorization**: Verifying physical progress percentages before fund release.
- **Sanction Note Generation**: Drafting formal financial concurrence records.`;
      } else {
        welcomeText = `Administrator ${user?.fullName || ''}, the **GrantSetu Administrative AI Engine** is ready. 

Ask about dynamic eligibility weighting algorithms, disbursement performance metrics, budget allocation ceilings, or forensic audit trail queries.`;
      }

      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'gemini',
        },
      ]);
    }
  }, [user?.role, user?.fullName]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  // Role-tailored suggestion chips
  const getSuggestionChips = () => {
    switch (user?.role) {
      case 'BENEFICIARY':
        return [
          'Am I eligible for PM Solar Rooftop scheme?',
          'What documents are required for PM-KISAN?',
          'How do I fix a returned application and resubmit?',
          'How does milestone disbursement work?',
        ];
      case 'FIELD_OFFICER':
        return [
          'Site inspection checklist for agricultural machinery',
          'Standard remarks for recommending re-application',
          'How to verify Tehsildar income certificate authenticity',
        ];
      case 'DISTRICT_OFFICER':
        return [
          'Draft formal scrutiny endorsement remarks',
          'Grounds to send back for field re-verification',
          'Explain maximum subsidy ceilings per district',
        ];
      case 'FINANCE_APPROVER':
        return [
          'GFR 2017 Rule 230 DBT compliance checklist',
          'Draft official Grant Sanction memo',
          'Milestone tranche release guidelines',
        ];
      default:
        return [
          'Explain the dynamic eligibility scoring formula',
          'How to prevent duplicate DBT applications',
          'Overview of all registered subsidy schemes',
        ];
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await api.sendAiChat({
        messages: newHistory.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: m.content,
        })),
        context: {
          currentView,
          applicationId: activeAppId || undefined,
        },
      });

      if (response.success && response.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: response.message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: response.source,
          },
        ]);
      } else {
        throw new Error('No response from AI service');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content:
            'I encountered a temporary connection glitch. However, all platform schemes (PM-KISAN, Solar Rooftop, Tribal Artisan, MSME Upgradation) follow standard statutory eligibility scoring. Please ask your question again or specify an application number.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'local-engine',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat history cleared. How may I assist you with GrantSetu schemes, applications, or official verifications?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'gemini',
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Backdrop overlay for mobile */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity pointer-events-auto sm:hidden"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10 pointer-events-auto">
        <div className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-5 py-4 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base leading-tight">GrantSetu AI Sahayak</h3>
                  <span className="text-[10px] bg-amber-400/20 text-amber-200 border border-amber-400/30 px-1.5 py-0.5 rounded font-medium">
                    Gemini 3.8
                  </span>
                </div>
                <p className="text-xs text-blue-100/80">
                  Government Subsidy & Scrutiny Copilot
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reset Conversation"
                className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                title="Close Assistant"
                className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Context Status Banner */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-semibold text-slate-800 truncate">
                Role: {user?.role ? user.role.replace('_', ' ') : 'CITIZEN'}
              </span>
              {activeAppId && (
                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono text-[11px] truncate">
                  App: {activeAppId}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 shrink-0">Live Grounded</span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-xs'
                    }`}
                  >
                    {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs relative group ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-2 mb-1 opacity-70 text-[10px]">
                      <span className="font-semibold">
                        {isUser ? 'You' : 'GrantSetu Sahayak'}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Content */}
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="space-y-2 text-slate-800 prose-xs">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    )}

                    {/* Copy action on assistant messages */}
                    {!isUser && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="text-[10px] text-slate-400">
                          {msg.source === 'local-engine' ? '⚡ System Knowledge' : '✨ Gemini 3.8 Flash'}
                        </span>
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors p-1 rounded hover:bg-slate-100"
                          title="Copy message to clipboard"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 text-[10px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3.5 shadow-xs max-w-[85%] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-1 text-[11px]">GrantSetu AI is analyzing criteria...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="px-4 py-2 bg-slate-50/90 border-t border-slate-200 overflow-x-auto">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">
              <HelpCircle className="w-3 h-3 text-blue-600" />
              <span>Suggested Queries</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {getSuggestionChips().map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  disabled={isLoading}
                  className="whitespace-nowrap bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 px-2.5 py-1 rounded-full text-xs font-medium transition-all shadow-2xs hover:scale-[1.01] shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask about schemes, eligibility rules, or official remarks..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || isLoading}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl shadow-xs transition-all shrink-0 hover:shadow-md disabled:cursor-not-allowed"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-slate-400 text-center mt-1.5">
              Powered by Gemini 3.8 Flash • Real-time DBT and GFR 2017 compliant assistance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
