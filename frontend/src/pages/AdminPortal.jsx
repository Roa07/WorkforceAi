import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ChatDrawer from '../components/ChatDrawer';
import {
  Users, DollarSign, CalendarCheck, FileCheck, AlertCircle,
  CheckCircle2, Play, Plus, RefreshCw, ShieldAlert, Check, X,
  Activity, Flame, Award, Lightbulb, Compass, TrendingDown, UserMinus,
  Eye, EyeOff
} from 'lucide-react';

export default function AdminPortal() {
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [anomalyData, setAnomalyData] = useState(null);
  const [retentionData, setRetentionData] = useState(null);
  const [activeTab, setActiveTab] = useState('employees'); // employees, leaves, payroll, anomalies, retention, audit
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Payroll Preview Modal State
  const [payrollModal, setPayrollModal] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState(10);
  const [payrollYear, setPayrollYear] = useState(2026);
  const [previewData, setPreviewData] = useState(null);
  const [payrollExecuting, setPayrollExecuting] = useState(false);

  // Add Employee Modal State
  const [addEmpModal, setAddEmpModal] = useState(false);
  const [showNewEmpPassword, setShowNewEmpPassword] = useState(false);
  const [newEmp, setNewEmp] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    password: 'password123',
    department: 'Engineering',
    designation: 'Software Engineer',
    basic_salary: 4000,
    allowances: 500,
    standard_deductions: 200
  });
  const [creatingEmp, setCreatingEmp] = useState(false);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      setCreatingEmp(true);
      await axios.post('/api/admin/employees', {
        ...newEmp,
        basic_salary: Number(newEmp.basic_salary),
        allowances: Number(newEmp.allowances),
        standard_deductions: Number(newEmp.standard_deductions)
      });
      showToast(`Employee ${newEmp.employee_code} created successfully!`, 'success');
      setAddEmpModal(false);
      setNewEmp({
        employee_code: '',
        first_name: '',
        last_name: '',
        email: '',
        password: 'password123',
        department: 'Engineering',
        designation: 'Software Engineer',
        basic_salary: 4000,
        allowances: 500,
        standard_deductions: 200
      });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to create employee", 'error');
    } finally {
      setCreatingEmp(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, empsRes, leavesRes, payrollRes, auditRes, anomRes, retRes] = await Promise.all([
        axios.get('/api/admin/dashboard-stats'),
        axios.get('/api/admin/employees'),
        axios.get('/api/admin/leaves'),
        axios.get('/api/admin/payroll/history'),
        axios.get('/api/admin/audit-logs'),
        axios.get('/api/admin/anomaly-report'),
        axios.get('/api/admin/retention-intelligence')
      ]);

      setStats(statsRes.data);
      setEmployees(empsRes.data);
      setLeaves(leavesRes.data);
      setPayrollHistory(payrollRes.data);
      setAuditLogs(auditRes.data);
      setAnomalyData(anomRes.data);
      setRetentionData(retRes.data);
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
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

  const handleReviewLeave = async (leaveId, status) => {
    try {
      const res = await axios.put(`/api/admin/leaves/${leaveId}/status`, { status });
      showToast(res.data.message, 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || "Action failed", 'error');
    }
  };

  const handleGeneratePayrollPreview = async () => {
    try {
      setPayrollExecuting(true);
      const res = await axios.post(`/api/admin/payroll/preview?month=${payrollMonth}&year=${payrollYear}`);
      setPreviewData(res.data);
    } catch (err) {
      showToast(err.response?.data?.detail || "Preview calculation failed", 'error');
    } finally {
      setPayrollExecuting(false);
    }
  };

  const handleConfirmExecutePayroll = async () => {
    if (!previewData?.preview_token) return;
    try {
      setPayrollExecuting(true);
      const res = await axios.post('/api/admin/payroll/execute', {
        preview_token: previewData.preview_token
      });
      showToast(res.data.message, 'success');
      setPayrollModal(false);
      setPreviewData(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || "Payroll execution failed", 'error');
    } finally {
      setPayrollExecuting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-medium flex items-center space-x-2 animate-in fade-in duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner / KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Active Staff</p>
            <p className="text-2xl font-extrabold text-slate-900">{stats?.total_employees ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Present Today</p>
            <p className="text-2xl font-extrabold text-slate-900">{stats?.today_present ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Pending Leaves</p>
            <p className="text-2xl font-extrabold text-amber-600">{stats?.pending_leaves_count ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Last Payroll</p>
            <p className="text-xl font-extrabold text-slate-900">
              {stats?.last_payroll_run ? `$${stats.last_payroll_run.total_amount?.toLocaleString()}` : 'None'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-2 border border-slate-200/80 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'employees' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Employee Directory ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'leaves' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Leave Requests ({leaves.filter((l) => l.status === 'PENDING').length} pending)
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'payroll' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Monthly Payroll Hub
        </button>
        <button
          onClick={() => setActiveTab('anomalies')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'anomalies' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          AI Anomaly Radar ({anomalyData?.anomalies_detected ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('retention')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'retention' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Attrition & Retention AI ({retentionData?.high_risk_count ?? 0} Alert)
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          System Audit Logs
        </button>
      </div>

      {/* TAB 1: Employees Directory */}
      {activeTab === 'employees' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Registered Employees & Salary Structures</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const nextNum = 101 + employees.length;
                  setNewEmp((prev) => ({ ...prev, employee_code: `EMP${nextNum}` }));
                  setAddEmpModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Employee</span>
              </button>
              <button
                onClick={fetchData}
                className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Full Name</th>
                  <th className="py-2.5 px-4">Department & Role</th>
                  <th className="py-2.5 px-4">Base Salary</th>
                  <th className="py-2.5 px-4">Allowances</th>
                  <th className="py-2.5 px-4">Deductions</th>
                  <th className="py-2.5 px-4">Leave Bal (C/S)</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{e.employee_code}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{e.first_name} {e.last_name}</p>
                      <p className="text-[10px] text-slate-400">{e.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-800 font-medium">{e.designation}</p>
                      <p className="text-[10px] text-slate-500">{e.department}</p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">${e.basic_salary?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-600">+${e.allowances?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-rose-600">-${e.standard_deductions?.toLocaleString()}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {e.casual_leave_balance} / {e.sick_leave_balance}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${e.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                        {e.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Leave Requests Hub */}
      {activeTab === 'leaves' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Leave Approval Center</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Duration</th>
                  <th className="py-2.5 px-4">Reason</th>
                  <th className="py-2.5 px-4">Current Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">No leave requests found.</td>
                  </tr>
                ) : (
                  leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{l.employee_name}</p>
                        <p className="text-[10px] font-mono text-slate-500">{l.employee_code}</p>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700">{l.leave_type}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {l.start_date} to {l.end_date} ({l.total_days} days)
                      </td>
                      <td className="py-3 px-4 text-slate-600 italic max-w-xs truncate">{l.reason}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            l.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : l.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {l.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleReviewLeave(l.id, 'APPROVED')}
                              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewLeave(l.id, 'REJECTED')}
                              className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Payroll Execution Hub */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Run Monthly Payroll</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculates salaries from attendance, active leave, and deduction records with idempotent confirmation lock.
              </p>
            </div>
            <button
              onClick={() => {
                setPreviewData(null);
                setPayrollModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Launch Payroll Wizard</span>
            </button>
          </div>

          {/* Past Payroll History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Disbursed Payroll History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Run ID</th>
                    <th className="py-2.5 px-4">Period</th>
                    <th className="py-2.5 px-4">Disbursed Headcount</th>
                    <th className="py-2.5 px-4">Total Amount</th>
                    <th className="py-2.5 px-4">Executed Timestamp</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrollHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">No payroll runs found yet.</td>
                    </tr>
                  ) : (
                    payrollHistory.map((pr) => (
                      <tr key={pr.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">#{pr.id}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{pr.month} / {pr.year}</td>
                        <td className="py-3 px-4 text-slate-600">{pr.total_employees} employees</td>
                        <td className="py-3 px-4 font-bold text-emerald-600">${pr.total_disbursed_amount?.toLocaleString()}</td>
                        <td className="py-3 px-4 text-slate-500">{new Date(pr.executed_at).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            CONFIRMED
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: AI Anomaly & Wellness Radar (Stretch Goal) */}
      {activeTab === 'anomalies' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">AI Attendance Anomaly & Wellness Intelligence</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Automated statistical scanning for chronic tardiness, unutilized leaves, and burnout indicators.
              </p>
            </div>
            <button
              onClick={fetchData}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rescan Data</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Flagged Anomalies */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 mb-4">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Flagged Attendance Anomalies ({anomalyData?.anomalies?.length ?? 0})</span>
              </h3>
              <div className="space-y-3">
                {anomalyData?.anomalies?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No critical attendance anomalies found.</p>
                ) : (
                  anomalyData?.anomalies?.map((a, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{a.name} ({a.employee_code})</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                          {a.severity}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1">{a.details}</p>
                      <span className="text-[10px] text-slate-400 mt-1 inline-block">Dept: {a.department}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Burnout Risks */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 mb-4">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>Burnout & Overwork Risk Alerts</span>
              </h3>
              <div className="space-y-3">
                {anomalyData?.burnout_warnings?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No burnout patterns detected.</p>
                ) : (
                  anomalyData?.burnout_warnings?.map((b, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/60 text-xs">
                      <span className="font-bold text-slate-800">{b.name} ({b.employee_code})</span>
                      <p className="text-rose-700 text-[11px] mt-1">{b.details}</p>
                      <span className="text-[10px] text-slate-500 mt-1 inline-block">Dept: {b.department}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* AI Strategic Recommendations Card */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold flex items-center space-x-2 mb-2 text-indigo-200">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>AI Strategic HR Recommendations</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-200 mt-3">
              {anomalyData?.recommendations?.map((r, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB: Predictive Retention & Flight Risk AI (Option 3 Innovation) */}
      {activeTab === 'retention' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Compass className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Predictive Employee Attrition & Flight Risk AI</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Machine learning forecast based on compensation benchmark disparities, leave velocity, and shift variations.
              </p>
            </div>

            <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Org Retention Health</span>
                <span className="text-sm font-extrabold text-emerald-600">
                  {retentionData?.org_retention_health_index ?? '80%'} ({retentionData?.climate_status ?? 'HEALTHY'})
                </span>
              </div>
              <button
                onClick={fetchData}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-evaluate</span>
              </button>
            </div>
          </div>

          {/* Retention Health Summary Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                <UserMinus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">AI Retention Diagnostic</p>
                <p className="text-xs text-slate-200 mt-0.5 max-w-2xl">{retentionData?.executive_summary}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-400">{retentionData?.high_risk_count ?? 1}</span>
              <span className="text-[10px] text-slate-400 block font-medium">Critical Flight Alert</span>
            </div>
          </div>

          {/* Employee Risk Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {retentionData?.profiles?.map((p) => {
              const isHigh = p.risk_level === 'HIGH';
              const isMed = p.risk_level === 'MEDIUM';

              return (
                <div
                  key={p.employee_id}
                  className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-all ${
                    isHigh ? 'border-rose-300 bg-rose-50/20' : isMed ? 'border-amber-200' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                        <p className="text-[10px] text-slate-500 font-mono">{p.employee_code} • {p.department}</p>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          isHigh
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isMed
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.flight_risk_score}% {p.risk_level} RISK
                      </span>
                    </div>

                    {/* Risk Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${p.flight_risk_score}%` }}
                      />
                    </div>

                    {/* Behavioral Signals */}
                    <div className="space-y-1 mb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Detected Indicators:
                      </span>
                      {p.key_signals.map((sig, sIdx) => (
                        <p key={sIdx} className="text-[11px] text-slate-600 flex items-start space-x-1.5">
                          <span className={isHigh ? 'text-rose-500 font-bold' : 'text-slate-400 font-bold'}>•</span>
                          <span>{sig}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* AI Recommended Intervention */}
                  <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50 p-2.5 rounded-xl text-[11px]">
                    <span className="text-[10px] font-bold text-indigo-700 flex items-center space-x-1 mb-1">
                      <Lightbulb className="w-3 h-3 text-amber-500" />
                      <span>Recommended Action:</span>
                    </span>
                    <p className="text-slate-700 italic">{p.recommended_action}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">System Transaction & Activity Audit Trail</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/50 text-xs flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mr-2">
                    {log.action}
                  </span>
                  <span className="text-slate-600">{log.user_email}</span>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">{log.details}</p>
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAYROLL MODAL (Human-in-the-Loop Preview & Confirmation) */}
      {payrollModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Controlled Payroll Wizard</h3>
              <button onClick={() => setPayrollModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payroll Month</label>
                  <select
                    value={payrollMonth}
                    onChange={(e) => setPayrollMonth(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Month {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payroll Year</label>
                  <input
                    type="number"
                    value={payrollYear}
                    onChange={(e) => setPayrollYear(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="pt-5">
                  <button
                    onClick={handleGeneratePayrollPreview}
                    disabled={payrollExecuting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
                  >
                    {payrollExecuting ? 'Calculating...' : 'Generate Preview'}
                  </button>
                </div>
              </div>

              {/* Preview Breakdown Table */}
              {previewData && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex justify-between items-center text-xs text-indigo-900">
                    <span>
                      Eligible Employees: <strong>{previewData.total_employees}</strong>
                    </span>
                    <span>
                      Total Disbursed: <strong className="text-sm text-indigo-700">${previewData.total_amount?.toLocaleString()}</strong>
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Employee</th>
                          <th className="p-2">Base</th>
                          <th className="p-2">Deductions</th>
                          <th className="p-2">Payable</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewData.items.map((it) => (
                          <tr key={it.employee_id}>
                            <td className="p-2 font-medium text-slate-800">{it.employee_name} ({it.employee_code})</td>
                            <td className="p-2 text-slate-600">${it.basic_salary}</td>
                            <td className="p-2 text-rose-600">-${it.deductions}</td>
                            <td className="p-2 font-bold text-slate-900">${it.payable_salary}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 flex justify-end space-x-3">
                    <button
                      onClick={() => setPayrollModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmExecutePayroll}
                      disabled={payrollExecuting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-emerald-100 flex items-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm & Disburse Payroll</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {addEmpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Create New Employee ID</h3>
              <button onClick={() => setAddEmpModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={newEmp.employee_code}
                    onChange={(e) => setNewEmp({ ...newEmp, employee_code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-indigo-700"
                    placeholder="EMP106"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newEmp.first_name}
                    onChange={(e) => setNewEmp({ ...newEmp, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    placeholder="Alex"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newEmp.last_name}
                    onChange={(e) => setNewEmp({ ...newEmp, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    placeholder="Morgan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    placeholder="alex@hrms.com"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Password</label>
                  <div className="relative">
                    <input
                      type={showNewEmpPassword ? 'text' : 'password'}
                      required
                      value={newEmp.password}
                      onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })}
                      className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewEmpPassword(!showNewEmpPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                      title={showNewEmpPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewEmpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={newEmp.designation}
                    onChange={(e) => setNewEmp({ ...newEmp, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Salary ($)</label>
                  <input
                    type="number"
                    required
                    value={newEmp.basic_salary}
                    onChange={(e) => setNewEmp({ ...newEmp, basic_salary: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Allowances ($)</label>
                  <input
                    type="number"
                    required
                    value={newEmp.allowances}
                    onChange={(e) => setNewEmp({ ...newEmp, allowances: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deductions ($)</label>
                  <input
                    type="number"
                    required
                    value={newEmp.standard_deductions}
                    onChange={(e) => setNewEmp({ ...newEmp, standard_deductions: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddEmpModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingEmp}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl transition-all shadow-md"
                >
                  {creatingEmp ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Admin AI Assistant */}
      <ChatDrawer onActionCompleted={fetchData} />
    </div>
  );
}
