import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ChatDrawer from '../components/ChatDrawer';
import {
  Clock, Calendar, UserCheck, AlertCircle, CheckCircle2,
  CalendarDays, FileText, Send, RefreshCw, Briefcase, Download,
  LayoutGrid, List, Fingerprint, Home, IndianRupee, Receipt, LayoutGrid as MenuIcon,
  User, Star, MessageSquare, Plane, Smartphone, CreditCard, Package, Search, X, ChevronLeft
} from 'lucide-react';

export default function EmployeePortal() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [viewMode, setViewMode] = useState('heatmap'); // 'heatmap' or 'table'
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [showReminder, setShowReminder] = useState(true);
  const [mobileTab, setMobileTab] = useState('home');
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'services'
  const [serviceSearch, setServiceSearch] = useState('');
  const [virtualIdModal, setVirtualIdModal] = useState(false);

  // Leave Form State
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profRes, sumRes, histRes, leavesRes] = await Promise.all([
        axios.get('/api/employee/profile'),
        axios.get('/api/employee/attendance/summary'),
        axios.get('/api/employee/attendance/history'),
        axios.get('/api/employee/leave/my-leaves')
      ]);

      setProfile(profRes.data);
      setSummary(sumRes.data);
      setHistory(histRes.data);
      setLeaves(leavesRes.data);
    } catch (err) {
      console.error("Error fetching employee portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handlePunchIn = async () => {
    setPunchLoading(true);
    try {
      const res = await axios.post('/api/employee/attendance/punch-in');
      showToast(res.data.message, 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || "Punch in failed", 'error');
    } finally {
      setPunchLoading(false);
    }
  };

  const handlePunchOut = async () => {
    setPunchLoading(true);
    try {
      const res = await axios.post('/api/employee/attendance/punch-out');
      showToast(res.data.message, 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || "Punch out failed", 'error');
    } finally {
      setPunchLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      showToast("Please fill all leave fields", "error");
      return;
    }
    setApplyLoading(true);
    try {
      const res = await axios.post('/api/employee/leave/apply', {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason
      });
      showToast(res.data.message, 'success');
      setReason('');
      setStartDate('');
      setEndDate('');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || "Leave application failed", 'error');
    } finally {
      setApplyLoading(false);
    }
  };

  const todayAtt = profile?.today_attendance;
  const isPunchedIn = todayAtt?.punch_in && !todayAtt?.punch_out;
  const isPunchedOut = todayAtt?.punch_in && todayAtt?.punch_out;

  // Real-time Working Hours Ticking Counter
  useEffect(() => {
    let interval = null;
    if (isPunchedIn && todayAtt?.punch_in) {
      const startTime = new Date(todayAtt.punch_in).getTime();
      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = Math.max(0, now - startTime);
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setElapsedTime(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPunchedIn, todayAtt?.punch_in]);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const formatDurationPill = () => {
    if (isPunchedIn) return elapsedTime;
    if (isPunchedOut) return `${todayAtt?.total_hours}h`;
    return '0h 00m';
  };

  return (
    <div className="min-h-screen bg-[#f2f3fa] pb-24 sm:pb-12">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-medium flex items-center space-x-2 animate-in fade-in duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP DEEP NAVY CURVED HERO BANNER (PeopleFirst Inspired) */}
      {activeView === 'dashboard' ? (
        <div className="bg-[#0d1136] text-white pt-6 pb-16 px-4 sm:px-6 lg:px-8 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
          <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm sm:text-base text-indigo-200 font-medium">
                Hello, {profile?.first_name || user?.full_name?.split(' ')[0] || 'Employee'}
              </p>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mt-1 leading-tight">
                Think big,<br className="sm:hidden" /> think faster.
              </h1>
              <div className="w-6 h-1 bg-indigo-400 rounded-full mt-3" />
              <div className="mt-3 flex items-center space-x-3 flex-wrap gap-y-2">
                <p className="text-xs text-indigo-200/80 font-medium hidden sm:block">
                  {profile?.designation} • {profile?.department} • <span className="font-mono text-indigo-300">{profile?.employee_code}</span>
                </p>
                <button
                  onClick={() => setActiveView('services')}
                  className="inline-flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[11px] font-bold px-3 py-1 rounded-full transition-colors"
                >
                  <MenuIcon className="w-3 h-3 text-indigo-300" />
                  <span>All Services Hub</span>
                </button>
              </div>
            </div>

            {/* Geometric Paper-Plane / Arrow Graphic */}
            <div className="shrink-0 ml-4">
              <svg width="96" height="86" viewBox="0 0 96 86" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 sm:w-28 sm:h-24 drop-shadow-xl">
                <path d="M88 12L14 42L44 52L88 12Z" fill="#6366F1" />
                <path d="M88 12L44 52L54 78L88 12Z" fill="#E0E7FF" />
                <path d="M44 52L36 70L54 78L44 52Z" fill="#4F46E5" />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        /* PEOPLEFIRST-STYLE SERVICES SEARCH HEADER */
        <div className="bg-[#0d1136] text-white py-4 px-4 sm:px-6 lg:px-8 shadow-md">
          <div className="max-w-5xl mx-auto flex items-center space-x-3">
            <button
              onClick={() => {
                setActiveView('dashboard');
                setMobileTab('home');
              }}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
              title="Back to Dashboard"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-indigo-200 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search Core Services, Virtual ID, Payroll..."
                className="w-full bg-white/15 text-white placeholder-indigo-200/80 text-sm pl-10 pr-4 py-2.5 rounded-full border border-white/15 focus:outline-none focus:bg-white/20 transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* SERVICES HUB VIEW (Matching PeopleFirst Screenshot 2) */}
      {activeView === 'services' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-200">
          {/* Core Services */}
          <div>
            <h2 className="text-sm font-extrabold text-[#11153a] mb-3.5 px-1">Core Services</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {[
                { label: 'User Profile', icon: User, action: () => setVirtualIdModal(true) },
                { label: 'Attendance', icon: Calendar, action: () => setActiveView('dashboard') },
                { label: 'Payroll', icon: IndianRupee, action: () => window.open('/api/employee/payslip/10/2026/pdf', '_blank') },
                { label: 'Apply Leave', icon: Receipt, action: () => setActiveView('dashboard') },
                { label: 'Benefits', icon: Star, action: () => showToast(`Active Benefits: ${profile?.casual_leave_balance} Casual & ${profile?.sick_leave_balance} Sick Leaves available.`, 'success') },
                { label: 'Feedback', icon: MessageSquare, action: () => showToast('360° Peer Feedback cycle opens Dec 1, 2026.', 'success') },
                { label: 'Travel & Stay', icon: Plane, action: () => showToast('Corporate travel desk is active. Ask AI Assistant for policy.', 'success') }
              ]
                .filter((s) => s.label.toLowerCase().includes(serviceSearch.toLowerCase()))
                .map((svc, idx) => {
                  const Icon = svc.icon;
                  return (
                    <button
                      key={idx}
                      onClick={svc.action}
                      className="flex flex-col items-center group"
                    >
                      <div className="w-full aspect-square max-w-[84px] rounded-2xl bg-white/90 hover:bg-white border border-indigo-100/80 shadow-2xs group-hover:shadow-md group-hover:-translate-y-0.5 transition-all flex items-center justify-center text-[#11153a]">
                        <Icon className="w-6 h-6 text-[#11153a]" strokeWidth={1.9} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 mt-2 text-center leading-tight">
                        {svc.label}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Recruitment */}
          <div>
            <h2 className="text-sm font-extrabold text-[#11153a] mb-3.5 px-1">Recruitment</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {[
                { label: 'Onboarding', icon: UserCheck, action: () => showToast(`Joined on ${profile?.date_of_joining}. Onboarding status: 100% Completed.`, 'success') }
              ]
                .filter((s) => s.label.toLowerCase().includes(serviceSearch.toLowerCase()))
                .map((svc, idx) => {
                  const Icon = svc.icon;
                  return (
                    <button
                      key={idx}
                      onClick={svc.action}
                      className="flex flex-col items-center group"
                    >
                      <div className="w-full aspect-square max-w-[84px] rounded-2xl bg-white/90 hover:bg-white border border-indigo-100/80 shadow-2xs group-hover:shadow-md group-hover:-translate-y-0.5 transition-all flex items-center justify-center text-[#11153a]">
                        <Icon className="w-6 h-6 text-[#11153a]" strokeWidth={1.9} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 mt-2 text-center leading-tight">
                        {svc.label}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Self Services */}
          <div>
            <h2 className="text-sm font-extrabold text-[#11153a] mb-3.5 px-1">Self Services</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {[
                { label: 'Virtual ID', icon: Smartphone, action: () => setVirtualIdModal(true) },
                { label: 'Bonafide Letters', icon: FileText, action: () => window.open('/api/employee/payslip/10/2026/pdf', '_blank') },
                { label: 'ID Card Request', icon: CreditCard, action: () => showToast('Physical ID Card replacement request logged.', 'success') },
                { label: 'My Assets', icon: Package, action: () => showToast('Assigned Assets: MacBook Pro 14" (IT-409) & Access Badge.', 'success') }
              ]
                .filter((s) => s.label.toLowerCase().includes(serviceSearch.toLowerCase()))
                .map((svc, idx) => {
                  const Icon = svc.icon;
                  return (
                    <button
                      key={idx}
                      onClick={svc.action}
                      className="flex flex-col items-center group"
                    >
                      <div className="w-full aspect-square max-w-[84px] rounded-2xl bg-white/90 hover:bg-white border border-indigo-100/80 shadow-2xs group-hover:shadow-md group-hover:-translate-y-0.5 transition-all flex items-center justify-center text-[#11153a]">
                        <Icon className="w-6 h-6 text-[#11153a]" strokeWidth={1.9} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 mt-2 text-center leading-tight">
                        {svc.label}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT CONTAINER (Overlapping Hero Curve) */}
      {activeView === 'dashboard' && (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 space-y-5 relative z-20">
        {/* Top Row: Smart Reminder + Mark Attendance + Attendance Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Smart Shift Reminder Card */}
          {showReminder ? (
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-indigo-100/80 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#11153a]">
                  {isPunchedOut ? 'Mark-out reminder' : isPunchedIn ? 'Active shift tracker' : 'Shift check-in reminder'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  {isPunchedOut
                    ? `You've successfully completed ${todayAtt?.total_hours} hours of work. Have a great evening!`
                    : isPunchedIn
                    ? `You punched in at ${new Date(todayAtt.punch_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Elapsed time: ${elapsedTime}.`
                    : 'You have not marked your attendance for today yet. Tap Mark in when you start working.'}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setShowReminder(false)}
                  className="bg-[#e3e5f8] hover:bg-[#d5d8f5] text-[#11153a] text-xs font-bold px-5 py-2 rounded-full transition-colors"
                >
                  Dismiss
                </button>
                <a
                  href="/api/employee/payslip/10/2026/pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Oct Payslip PDF</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-indigo-100/80 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#11153a]">Monthly Payslip Ready</h2>
                <p className="text-xs text-slate-500 mt-1.5">
                  Download your verified PDF salary statement for October 2026.
                </p>
              </div>
              <div className="mt-4">
                <a
                  href="/api/employee/payslip/10/2026/pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-[#11153a] hover:bg-indigo-950 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Oct Payslip</span>
                </a>
              </div>
            </div>
          )}

          {/* Card 2: Mark Attendance Card (Fingerprint + Pill Buttons) */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-indigo-100/80 flex flex-col justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="h-12 w-12 rounded-2xl bg-[#ebedf9] flex items-center justify-center text-[#11153a] shrink-0">
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#11153a]">Mark attendance</h2>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPunchedIn ? 'bg-emerald-500 animate-pulse' : isPunchedOut ? 'bg-indigo-500' : 'bg-slate-400'
                    }`}
                  />
                  <span className="text-xs text-slate-500 font-medium">
                    {isPunchedIn
                      ? `Active (${elapsedTime})`
                      : isPunchedOut
                      ? `Completed (${todayAtt?.total_hours} hrs)`
                      : 'Attendance status: Not marked'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                onClick={handlePunchIn}
                disabled={punchLoading || Boolean(todayAtt?.punch_in)}
                className={`py-3 px-4 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                  !todayAtt?.punch_in
                    ? 'bg-[#11153a] hover:bg-[#1b2157] text-white shadow-md shadow-indigo-950/15'
                    : 'bg-[#e3e5f8] text-slate-400 cursor-not-allowed'
                }`}
              >
                {punchLoading && !todayAtt?.punch_in ? 'Marking...' : 'Mark in'}
              </button>

              <button
                onClick={handlePunchOut}
                disabled={punchLoading || !isPunchedIn}
                className={`py-3 px-4 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                  isPunchedIn
                    ? 'bg-[#11153a] hover:bg-[#1b2157] text-white shadow-md shadow-indigo-950/15'
                    : 'bg-[#e3e5f8] text-[#11153a]/70 cursor-not-allowed'
                }`}
              >
                {punchLoading && isPunchedIn ? 'Marking...' : 'Mark out'}
              </button>
            </div>
          </div>

          {/* Card 3: Attendance Summary Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-indigo-100/80 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#11153a]">Attendance summary</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{todayFormatted}</p>
              </div>
              <span className="inline-flex items-center space-x-1.5 bg-[#e8eaf8] text-[#11153a] text-xs font-bold px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                <span>{formatDurationPill()}</span>
              </span>
            </div>

            {/* Compact 4-Stat Strip */}
            <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-slate-100 text-center">
              <div>
                <span className="text-lg font-extrabold text-[#11153a] block">{summary?.present_days ?? 0}</span>
                <span className="text-[10px] font-semibold text-slate-500">Present</span>
              </div>
              <div>
                <span className="text-lg font-extrabold text-amber-600 block">{summary?.late_days ?? 0}</span>
                <span className="text-[10px] font-semibold text-slate-500">Late</span>
              </div>
              <div>
                <span className="text-lg font-extrabold text-indigo-600 block">{profile?.casual_leave_balance ?? 0}</span>
                <span className="text-[10px] font-semibold text-slate-500">Casual Bal</span>
              </div>
              <div>
                <span className="text-lg font-extrabold text-violet-600 block">{profile?.sick_leave_balance ?? 0}</span>
                <span className="text-[10px] font-semibold text-slate-500">Sick Bal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main 2-Column Section: Leaves & Attendance Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Leave Management & Application */}
          <div className="lg:col-span-1 space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-indigo-100/80 shadow-sm">
              <h2 className="text-base font-extrabold text-[#11153a] flex items-center space-x-2 mb-4">
                <CalendarDays className="w-4 h-4 text-indigo-600" />
                <span>Apply for Leave</span>
              </h2>

              <form onSubmit={handleApplyLeave} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-[#f8f9fd]"
                  >
                    <option value="CASUAL">Casual Leave ({profile?.casual_leave_balance} left)</option>
                    <option value="SICK">Sick Leave ({profile?.sick_leave_balance} left)</option>
                    <option value="UNPAID">Unpaid Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">From Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-[#f8f9fd]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">To Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-[#f8f9fd]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
                  <textarea
                    required
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="State the reason for leave..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-[#f8f9fd] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={applyLoading}
                  className="w-full bg-[#11153a] hover:bg-[#1b2157] text-white font-bold py-3 rounded-full text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{applyLoading ? 'Submitting...' : 'Submit Application'}</span>
                </button>
              </form>
            </div>

            {/* My Leaves List */}
            <div className="bg-white rounded-3xl p-6 border border-indigo-100/80 shadow-sm">
              <h2 className="text-base font-extrabold text-[#11153a] mb-3">Leave Applications</h2>
              {leaves.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No leave applications yet.</p>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {leaves.map((l) => (
                    <div key={l.id} className="p-3.5 rounded-2xl bg-[#f8f9fd] border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-[#11153a]">{l.leave_type}</span>
                          <span className="text-[10px] text-slate-500">({l.total_days}d)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{l.start_date} to {l.end_date}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                          l.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {l.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Attendance Records (Heatmap & Table View) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-indigo-100/80 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center space-x-3">
                <h2 className="text-base font-extrabold text-[#11153a] flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Attendance Activity Tracker</span>
                </h2>

                <div className="bg-[#f2f3fa] p-1 rounded-full flex items-center text-[11px] font-bold">
                  <button
                    onClick={() => setViewMode('heatmap')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-all ${
                      viewMode === 'heatmap' ? 'bg-white text-[#11153a] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>Heatmap</span>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-all ${
                      viewMode === 'table' ? 'bg-white text-[#11153a] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <List className="w-3 h-3" />
                    <span>Table</span>
                  </button>
                </div>
              </div>

              <button
                onClick={fetchData}
                className="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-[#f2f3fa] transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {viewMode === 'heatmap' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-7 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                    <div key={idx} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">
                      {day}
                    </div>
                  ))}

                  {[...Array(31)].map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `2026-10-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                    const rec = history.find((h) => h.date === dateStr || h.date.endsWith(`-${dayNum < 10 ? '0' + dayNum : dayNum}`));
                    const isWeekend = [3, 4, 10, 11, 17, 18, 24, 25, 31].includes(dayNum);

                    let badgeClass = "bg-[#f8f9fd] border-slate-200/80 text-slate-400";
                    let statusText = isWeekend ? "Weekend" : "Off / Leave";

                    if (rec) {
                      if (rec.status === 'PRESENT') {
                        badgeClass = "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100";
                        statusText = `Present (${rec.total_hours} hrs)`;
                      } else if (rec.status === 'LATE') {
                        badgeClass = "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100";
                        statusText = `Late Arrival (${rec.total_hours} hrs)`;
                      } else if (rec.status === 'HALF_DAY') {
                        badgeClass = "bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100";
                        statusText = `Half Day (${rec.total_hours} hrs)`;
                      }
                    }

                    return (
                      <div
                        key={dayNum}
                        title={`Day ${dayNum}: ${statusText}`}
                        className={`p-2 rounded-2xl border text-center transition-all cursor-pointer ${badgeClass}`}
                      >
                        <span className="block text-[11px] font-extrabold">{dayNum}</span>
                        <span className="block text-[9px] font-semibold truncate mt-0.5">
                          {rec ? `${rec.total_hours}h` : (isWeekend ? 'W/E' : '-')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-bold text-slate-600">Legend:</span>
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Present</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                      <span>Late</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                      <span>Half Day</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span>
                      <span>Weekend</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'table' && (
              <div className="overflow-x-auto flex-1 animate-in fade-in duration-150">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8f9fd] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Punch In</th>
                      <th className="py-2.5 px-3">Punch Out</th>
                      <th className="py-2.5 px-3">Hours</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          No attendance records found.
                        </td>
                      </tr>
                    ) : (
                      history.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 font-semibold text-[#11153a]">{rec.date}</td>
                          <td className="py-3 px-3 text-slate-600">
                            {rec.punch_in ? new Date(rec.punch_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {rec.punch_out ? new Date(rec.punch_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="py-3 px-3 font-bold text-[#11153a]">{rec.total_hours} hrs</td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                rec.status === 'PRESENT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : rec.status === 'LATE'
                                  ? 'bg-amber-100 text-amber-800'
                                  : rec.status === 'HALF_DAY'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* DIGITAL VIRTUAL ID CARD MODAL */}
      {virtualIdModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-indigo-100">
            <div className="bg-[#0d1136] text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-black tracking-wider text-sm">NEX</span>
                <span className="font-light text-indigo-300 text-sm">HR</span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-bold">VIRTUAL ID</span>
              </div>
              <button onClick={() => setVirtualIdModal(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-center space-y-4">
              <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg">
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#11153a]">{profile?.first_name} {profile?.last_name}</h3>
                <p className="text-xs font-semibold text-indigo-600">{profile?.designation}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{profile?.department} Department</p>
              </div>
              <div className="bg-[#f2f3fa] rounded-2xl p-3.5 grid grid-cols-2 gap-2 text-left text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold uppercase">Employee ID</span>
                  <span className="font-mono font-extrabold text-[#11153a]">{profile?.employee_code}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold uppercase">Status</span>
                  <span className="text-emerald-700 font-bold">ACTIVE • VERIFIED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR (PeopleFirst Style) */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex items-center justify-around z-40">
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'attendance', label: 'Attendance', icon: Calendar },
          { id: 'payroll', label: 'Payroll', icon: IndianRupee },
          { id: 'leaves', label: 'Leaves', icon: Receipt },
          { id: 'menu', label: 'Menu', icon: MenuIcon }
        ].map((item) => {
          const Icon = item.icon;
          const active = mobileTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setMobileTab(item.id);
                if (item.id === 'menu') {
                  setActiveView('services');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else if (item.id === 'payroll') {
                  window.open('/api/employee/payslip/10/2026/pdf', '_blank');
                } else {
                  setActiveView('dashboard');
                  window.scrollTo({ top: item.id === 'home' ? 0 : 400, behavior: 'smooth' });
                }
              }}
              className={`flex flex-col items-center px-3 py-1.5 rounded-2xl transition-all ${
                active ? 'bg-[#e8eaf8] text-[#11153a]' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Embedded Floating Glowing AI Orb */}
      <ChatDrawer onActionCompleted={fetchData} />
    </div>
  );
}
