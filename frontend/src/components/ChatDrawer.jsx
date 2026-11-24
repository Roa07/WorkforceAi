import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare, X, Send, Bot, Sparkles, CheckCircle,
  AlertTriangle, Mic, MicOff, Volume2, VolumeX, Check, ShieldCheck,
  DollarSign, Activity, FileCheck, Cpu, ChevronDown, ChevronRight, Fingerprint
} from 'lucide-react';

export default function ChatDrawer({ onActionCompleted }) {
  const { user, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: isAdmin
        ? "Hello Admin! I can help you monitor employee attendance, review leave requests, run AI anomaly detection, or execute monthly payroll workflows."
        : `Hi ${user?.full_name?.split(' ')[0] || 'there'}! I am your AI HR Assistant. You can ask me to punch in/out, check your leave balances, download payslips, or apply for leaves.`
    }
  ]);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        setInput(fullTranscript);
      };

      recognition.onerror = (err) => {
        console.error("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Could not start recognition:", err);
      }
    }
  };

  const speakText = (text) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '').slice(0, 200);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const employeePrompts = [
    "Mark my attendance",
    "Am I marked present today?",
    "How many leaves do I have?",
    "Apply for two days of sick leave",
    "Show my attendance this month",
    "Download my payslip"
  ];

  const adminPrompts = [
    "Who is at risk of leaving?",
    "Run anomaly detection",
    "Show pending leave requests",
    "Approve leave request #1",
    "Run payroll for October 2026",
    "Confirm payroll"
  ];

  const suggestedPrompts = isAdmin ? adminPrompts : employeePrompts;

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }));

      const res = await axios.post('/api/chat', {
        message: text,
        history: historyPayload
      });

      const data = res.data;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          actionTaken: data.action_taken,
          data: data.data,
          agentRouting: data.agent_routing
        }
      ]);

      speakText(data.reply);

      if (data.action_taken && onActionCompleted) {
        onActionCompleted(data.action_taken);
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Network error communicating with AI agent.";
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error: ${errMsg}`, isError: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-5 sm:right-6 z-50">
      {/* Glowing Rainbow/Gradient Floating AI Orb (Custom AI Star Emblem) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="Open AI Assistant (Voice & Chat)"
          className="group relative flex items-center justify-center h-14 w-14 rounded-full bg-[radial-gradient(circle_at_30%_30%,#fde047_0%,#f97316_25%,#ec4899_55%,#8b5cf6_80%,#6366f1_100%)] text-white shadow-[0_8px_25px_rgba(236,72,153,0.45)] transition-all transform hover:scale-110 active:scale-95 ring-2 ring-white/80"
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-500 via-pink-500 to-amber-400 blur-md opacity-60 group-hover:opacity-85 -z-10 transition-opacity" />
          {/* Custom Dual-Sparkle AI Star SVG */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-7 h-7 text-white drop-shadow-sm transition-transform duration-300 group-hover:rotate-12"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11 2C11 7.5 7.5 11 2 11C7.5 11 11 14.5 11 20C11 14.5 14.5 11 20 11C14.5 11 11 7.5 11 2Z"
              fill="currentColor"
            />
            <path
              d="M19 15C19 17.2 17.2 19 15 19C17.2 19 19 20.8 19 23C19 20.8 20.8 19 23 19C20.8 19 19 17.2 19 15Z"
              fill="currentColor"
              fillOpacity="0.9"
            />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
          </span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[420px] sm:w-[490px] h-[630px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm tracking-wide">NexHR Autonomous Agent</h3>
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-medium">
                    {isAdmin ? 'Admin Agent' : 'Employee Agent'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">Generative UI & Voice Enabled</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setSpeechEnabled(!speechEnabled)}
                title={speechEnabled ? "Voice response enabled" : "Voice response muted"}
                className={`p-1.5 rounded-lg transition-colors ${
                  speechEnabled ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              Suggestions:
            </span>
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="whitespace-nowrap bg-white hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Multi-Agent Routing Trace Pill */}
                {m.agentRouting && (
                  <div className="mb-1 flex items-center space-x-1.5 text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200/80 px-2 py-0.5 rounded-md">
                    <Cpu className="w-3 h-3 text-indigo-500" />
                    <span className="text-slate-400">Supervisor ➔</span>
                    <span className="font-bold text-indigo-700">{m.agentRouting.dispatched_to}</span>
                    <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1 rounded">
                      {m.agentRouting.confidence}
                    </span>
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : m.isError
                      ? 'bg-rose-50 text-rose-800 border border-rose-200 rounded-bl-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {/* GENERATIVE UI WIDGET 1: Interactive Payroll Preview Card */}
                  {m.actionTaken === 'preview_payroll' && m.data && (
                    <div className="mt-3 p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between text-indigo-950 font-bold">
                        <span className="flex items-center space-x-1.5">
                          <DollarSign className="w-4 h-4 text-indigo-600" />
                          <span>Payroll Preview Summary</span>
                        </span>
                        <span className="bg-indigo-200/70 text-indigo-800 px-2 py-0.5 rounded-md font-mono text-[10px]">
                          {m.data.preview_token?.slice(0, 15)}...
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                        <div className="bg-white p-2 rounded-lg border border-indigo-100">
                          <span className="text-slate-500 block text-[10px]">Eligible Staff</span>
                          <span className="font-bold text-slate-900">{m.data.total_employees} Employees</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-indigo-100">
                          <span className="text-slate-500 block text-[10px]">Total Disbursement</span>
                          <span className="font-bold text-emerald-600">${m.data.total_amount?.toLocaleString()}</span>
                        </div>
                      </div>
                      {/* Generative Interactive Button */}
                      <button
                        onClick={() => handleSend("Confirm payroll")}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>⚡ 1-Click Confirm & Disburse</span>
                      </button>
                    </div>
                  )}

                  {/* GENERATIVE UI WIDGET 2: Anomaly Alert Card */}
                  {m.actionTaken === 'detect_anomalies' && m.data && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                      <span className="flex items-center space-x-1.5 font-bold">
                        <Activity className="w-4 h-4 text-amber-600" />
                        <span>AI Anomaly Scan Completed</span>
                      </span>
                      <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        {m.data.anomalies_detected} Flagged
                      </span>
                    </div>
                  )}

                  {/* GENERATIVE UI WIDGET 3: Flight Risk & Retention Alert */}
                  {m.actionTaken === 'flight_risk_analysis' && m.data && (
                    <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold text-rose-950">
                        <span className="flex items-center space-x-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Flight Risk Assessment</span>
                        </span>
                        <span className="bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full text-[10px]">
                          {m.data.high_risk_count} Critical Alert
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700">
                        Org Retention Health: <strong className="text-emerald-700">{m.data.org_retention_health_index}</strong>. Highest risk identified: <strong>{m.data.profiles[0]?.name}</strong> ({m.data.profiles[0]?.flight_risk_score}% risk).
                      </p>
                    </div>
                  )}

                  {/* Action Verified Badge */}
                  {m.actionTaken && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Action verified: {m.actionTaken}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 flex items-center space-x-2 text-xs text-slate-500">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  </div>
                  <span>Agent executing tools...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Listening Banner */}
          {isListening && (
            <div className="bg-rose-50 border-t border-rose-100 px-4 py-2 flex items-center justify-between text-xs text-rose-700 animate-pulse">
              <span className="flex items-center space-x-2 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span>Recording voice... Click the mic again when done, then press Enter</span>
              </span>
              <button onClick={toggleListening} className="text-[11px] bg-rose-200/80 hover:bg-rose-300 text-rose-900 px-2 py-0.5 rounded-md font-bold transition-colors">
                Done Speaking
              </button>
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={toggleListening}
                title="Speak to Assistant"
                className={`p-2.5 rounded-xl transition-all ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isAdmin
                    ? "Ask payroll, anomalies, approve leaves..."
                    : "Ask to punch in, apply leave, get payslip..."
                }
                className="flex-1 bg-slate-100 text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-transparent focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
                disabled={loading}
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
