import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Mail, MessageSquare, KeyRound } from 'lucide-react';
import { LoginLayout, AuthCard } from './AuthLayout.jsx';
import { Field, Ctrl, TextInput } from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useUi } from '../../context/UiContext.jsx';
import { api } from '../../lib/api.js';

// Three-step forgot-password flow: request a PIN via email or SMS, verify
// it, then set a new password. Mirrors backend/routes/auth.routes.js.
function ForgotPasswordBody() {
  const { toast, closeModal, openSuccess } = useUi();
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [channel, setChannel] = useState('email');
  const [pin, setPin] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);

  async function requestPin() {
    if (!identifier.trim()) return toast('Enter your username or email.', 'bad');
    setBusy(true);
    try {
      const r = await api.post('/auth/forgot-password/request', { identifier: identifier.trim(), channel }, { auth: false });
      toast(r.message || `PIN sent via ${channel}.`, 'ok');
      setStep(2);
    } catch (e) { toast(e.message, 'bad'); }
    finally { setBusy(false); }
  }

  async function verifyPin() {
    if (pin.trim().length !== 6) return toast('Enter the 6-digit PIN.', 'bad');
    setBusy(true);
    try {
      await api.post('/auth/forgot-password/verify', { identifier: identifier.trim(), pin: pin.trim() }, { auth: false });
      setStep(3);
    } catch (e) { toast(e.message, 'bad'); }
    finally { setBusy(false); }
  }

  async function resetPassword() {
    if (pw.length < 6) return toast('Password must be at least 6 characters.', 'bad');
    if (pw !== pw2) return toast('Passwords do not match.', 'bad');
    setBusy(true);
    try {
      await api.post('/auth/forgot-password/reset', { identifier: identifier.trim(), pin: pin.trim(), new_password: pw }, { auth: false });
      closeModal();
      openSuccess({ title: 'Password updated', message: 'You can now log in with your new password.' });
    } catch (e) { toast(e.message, 'bad'); }
    finally { setBusy(false); }
  }

  if (step === 1) {
    return (
      <div>
        <Field label="Username or email">
          <Ctrl icon={<User size={16} />}><TextInput value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="Username or Email" /></Ctrl>
        </Field>
        <Field label="Send the PIN via">
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" onClick={() => setChannel('email')}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[12.5px] font-semibold border ${channel === 'email' ? 'bg-accent-600 border-accent-600 text-white' : 'bg-white border-navy-900/15 text-navy-900/70'}`}>
              <Mail size={14} /> Email
            </button>
            <button type="button" onClick={() => setChannel('sms')}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[12.5px] font-semibold border ${channel === 'sms' ? 'bg-accent-600 border-accent-600 text-white' : 'bg-white border-navy-900/15 text-navy-900/70'}`}>
              <MessageSquare size={14} /> SMS
            </button>
          </div>
        </Field>
        <div className="flex gap-2.5"><Button variant="ghost" block onClick={closeModal}>Cancel</Button><Button block disabled={busy} onClick={requestPin}>{busy ? 'Sending…' : 'Send PIN'}</Button></div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        <p className="text-[12.5px] text-navy-900/60 mb-4">Enter the 6-digit PIN sent to you via {channel === 'email' ? 'email' : 'SMS'}. It expires in 10 minutes.</p>
        <Field label="6-digit PIN">
          <Ctrl icon={<KeyRound size={16} />}>
            <TextInput value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" inputMode="numeric" className="tracking-[6px] font-bold" />
          </Ctrl>
        </Field>
        <div className="flex gap-2.5">
          <Button variant="ghost" block onClick={() => setStep(1)}>Back</Button>
          <Button block disabled={busy} onClick={verifyPin}>{busy ? 'Verifying…' : 'Verify PIN'}</Button>
        </div>
        <button type="button" onClick={requestPin} className="w-full text-center text-[11.5px] font-semibold text-accent-700 hover:underline mt-3">Resend PIN</button>
      </div>
    );
  }

  return (
    <div>
      <Field label="New password"><Ctrl icon={<Lock size={16} />}><TextInput type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="At least 6 characters" /></Ctrl></Field>
      <Field label="Confirm new password"><Ctrl icon={<Lock size={16} />}><TextInput type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Re-enter password" /></Ctrl></Field>
      <div className="flex gap-2.5"><Button variant="ghost" block onClick={closeModal}>Cancel</Button><Button block disabled={busy} onClick={resetPassword}>{busy ? 'Saving…' : 'Reset Password'}</Button></div>
    </div>
  );
}

export default function Login({ goto }) {
  const { login } = useAuth();
  const { toast, openModal } = useUi();
  const saved = localStorage.getItem('rescom_remember') || '';
  const [username, setUsername] = useState(saved);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(!!saved);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e?.preventDefault();
    if (!username || !password) { setError('Enter your username and password.'); return; }
    setError(''); setBusy(true);
    try {
      await login(username, password);
      remember ? localStorage.setItem('rescom_remember', username) : localStorage.removeItem('rescom_remember');
      toast('Welcome back!', 'ok');
    } catch (err) { setError(err.message); toast(err.message, 'bad'); } finally { setBusy(false); }
  }

  return (
    <LoginLayout>
      <AuthCard>
        <h1 className="text-[28px] font-extrabold text-[#0a1490] text-center">Welcome Back!</h1>
        <p className="text-center text-navy-900/60 text-[13px] mb-6">Login to continue to your account</p>
        <form onSubmit={submit}>
          <Field error={error}><Ctrl icon={<User size={16} />} error={!!error}><TextInput placeholder="Email or Username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" /></Ctrl></Field>
          <Field><Ctrl icon={<Lock size={16} />}>
            <TextInput type={showPw ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            <button type="button" aria-label="Toggle password" onClick={() => setShowPw(v => !v)} className="text-navy-900/45 p-1">{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </Ctrl></Field>
          <div className="flex items-center justify-between text-[12.5px] mb-5">
            <label className="flex items-center gap-2 cursor-pointer text-navy-900/75"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 accent-[#0a1490]" />Remember me</label>
            <button type="button" className="font-semibold text-accent-700 hover:underline" onClick={() => openModal({ title: 'Forgot password?', sub: 'Get a one-time PIN by email or SMS to reset your password.', body: <ForgotPasswordBody />, footer: null })}>Forgot Password?</button>
          </div>
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-[#0a1490] hover:bg-[#08106f] text-white font-semibold py-3 text-[14px] transition disabled:opacity-50">{busy ? 'Signing in…' : 'Login'}</button>
        </form>
        <div className="text-center text-[12.5px] text-navy-900/60 mt-5">Don't have an account? <button type="button" className="font-semibold text-accent-700 hover:underline" onClick={() => goto('register')}>Sign up</button></div>
      </AuthCard>
    </LoginLayout>
  );
}
