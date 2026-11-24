import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Building2, User, ShieldCheck, ArrowRight, Bot, Shield, Cpu, Activity, UserPlus, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'reset'

  // Show/Hide Password Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login State
  const [email, setEmail] = useState('john.doe@hrms.com');
  const [password, setPassword] = useState('password123');

  // Register State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [designation, setDesignation] = useState('Software Engineer');

  // Reset Password State
  const [resetEmail, setResetEmail] = useState('john.doe@hrms.com');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await register({
          first_name: firstName,
          last_name: lastName,
          email: regEmail,
          password: regPassword,
          department,
          designation
        });
      } else if (mode === 'reset') {
        if (newPassword !== confirmPassword) {
          setError('New password and confirm password do not match.');
          setLoading(false);
          return;
        }
        const res = await axios.post('/api/auth/reset-password', {
          email: resetEmail,
          new_password: newPassword
        });
        setSuccessMsg(res.data.message);
        setEmail(resetEmail);
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setMode('login');
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.response?.data?.detail || (mode === 'register' ? 'Registration failed' : mode === 'reset' ? 'Password reset failed' : 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (type) => {
    setMode('login');
    setError('');
    setSuccessMsg('');
    if (type === 'admin') {
      setEmail('admin@hrms.com');
      setPassword('admin123');
    } else {
      setEmail('john.doe@hrms.com');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Hero Showcase Panel (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center space-x-3">
          <div className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight">NexHR</span>
            <span className="ml-2 text-[10px] font-bold uppercase tracking-widest bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 px-2 py-0.5 rounded-full">
              Enterprise AI
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Autonomous HR Operations, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-300">Powered by Agents.</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Experience next-generation workforce management with voice-enabled tool calling, controlled payroll execution, and predictive retention intelligence.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <Bot className="w-5 h-5 text-indigo-300 mb-2" />
              <h3 className="text-xs font-bold text-white">Multi-Agent Routing</h3>
              <p className="text-[11px] text-slate-400 mt-1">Specialized agents for attendance, leaves, and payroll.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <Shield className="w-5 h-5 text-emerald-300 mb-2" />
              <h3 className="text-xs font-bold text-white">AI Firewall & Ledger</h3>
              <p className="text-[11px] text-slate-400 mt-1">Prompt injection defense & cryptographic audit chain.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <Cpu className="w-5 h-5 text-violet-300 mb-2" />
              <h3 className="text-xs font-bold text-white">MCP Protocol Ready</h3>
              <p className="text-[11px] text-slate-400 mt-1">Standardized JSON-RPC tool server integration.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <Activity className="w-5 h-5 text-amber-300 mb-2" />
              <h3 className="text-xs font-bold text-white">Retention AI Radar</h3>
              <p className="text-[11px] text-slate-400 mt-1">Predictive flight-risk scoring & anomaly detection.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between border-t border-white/10 pt-6">
          <span>Dual-Portal Architecture (Employee & Super Admin)</span>
          <span className="font-mono text-indigo-300">v1.0.0</span>
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex flex-col items-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
              <Building2 className="w-8 h-8" />
            </div>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-900 tracking-tight">NexHR Platform</h2>
            <p className="text-xs text-slate-500 font-medium">Autonomous Chatbot-Driven HRMS</p>
          </div>

          {/* Mode Switcher Tabs (Sign In | Create Employee ID) */}
          {mode !== 'reset' && (
            <div className="bg-slate-200/70 p-1 rounded-2xl flex items-center mb-6">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                  mode === 'login' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                  mode === 'register' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Employee ID</span>
              </button>
            </div>
          )}

          {mode === 'login' && (
            <>
              <div className="mb-4">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select a demo role or sign in with your credentials.</p>
              </div>

              {/* Quick Demo Switcher Cards */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => setPreset('employee')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    email === 'john.doe@hrms.com'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-600/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 text-indigo-700 font-bold text-xs mb-0.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Employee Portal</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">John Doe (EMP101)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPreset('admin')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    email === 'admin@hrms.com'
                      ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-2 ring-amber-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 text-amber-700 font-bold text-xs mb-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Super Admin</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Payroll & Operations</p>
                </button>
              </div>
            </>
          )}

          {mode === 'register' && (
            <div className="mb-4">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Create Employee Account</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register below to automatically receive an Employee ID (e.g., <span className="font-mono font-bold text-indigo-600">EMP106</span>) and access the portal.
              </p>
            </div>
          )}

          {mode === 'reset' && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 mb-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <span>Reset Password</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your registered work email and choose a new password.
              </p>
            </div>
          )}

          <div className="bg-white py-7 px-6 sm:px-7 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-200/80">
            <form className="space-y-3.5" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                  {successMsg}
                </div>
              )}

              {mode === 'login' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                      placeholder="name@hrms.com"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(email);
                          setMode('reset');
                          setError('');
                          setSuccessMsg('');
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        Reset Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {mode === 'register' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-indigo-500 focus:outline-none"
                        placeholder="Alex"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-indigo-500 focus:outline-none"
                        placeholder="Morgan"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Work Email</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-indigo-500 focus:outline-none"
                      placeholder="alex.morgan@hrms.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password (min 6 chars)</label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-indigo-500 focus:outline-none"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        title={showRegPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="Engineering">Engineering</option>
                        <option value="Product">Product</option>
                        <option value="Operations">Operations</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="Infrastructure">Infrastructure</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                      <input
                        type="text"
                        required
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs focus:bg-white focus:border-indigo-500 focus:outline-none"
                        placeholder="Software Engineer"
                      />
                    </div>
                  </div>
                </>
              )}

              {mode === 'reset' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Registered Email</label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-indigo-500 focus:outline-none"
                      placeholder="name@hrms.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">New Password (min 6 chars)</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-indigo-500 focus:outline-none"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-indigo-500 focus:outline-none"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60 active:scale-[0.99]"
              >
                <span>
                  {loading
                    ? 'Processing...'
                    : mode === 'register'
                    ? 'Create ID & Enter Portal'
                    : mode === 'reset'
                    ? 'Confirm Password Reset'
                    : 'Sign In to Portal'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {mode === 'login' && (
              <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                <p className="text-[11px] text-slate-500">
                  Demo Passwords: <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">password123</span> (Employee) • <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">admin123</span> (Admin)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
