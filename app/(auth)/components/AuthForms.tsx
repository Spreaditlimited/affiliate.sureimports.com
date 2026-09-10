'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRecaptchaV3 } from '@/lib/security/useRecaptchaV3';
import { CountrySelect } from '@/app/components/CountrySelect';

type Notice = { tone: 'error' | 'success'; text: string } | null;

async function submit(endpoint: string, payload: unknown) {
  const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => ({ message: 'Something went wrong. Please try again.' }));
  return { ok: response.ok, data };
}

function NoticeBox({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return <div className={`form-notice ${notice.tone}`} role="status">{notice.text}</div>;
}

export function SignUpForm() {
  const captcha = useRecaptchaV3();
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setNotice(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (form.get('password') !== form.get('confirmPassword')) { setNotice({ tone: 'error', text: 'Your passwords do not match.' }); setLoading(false); return; }
    let recaptchaToken: string | undefined;
    try { recaptchaToken = await captcha('affiliate_signup'); } catch { setNotice({ tone: 'error', text: 'Security verification could not load. Please refresh and try again.' }); setLoading(false); return; }
    const result = await submit('/api/auth/sign-up', {
      firstName: form.get('firstName'), lastName: form.get('lastName'), email: form.get('email'), phone: form.get('phone'), country: form.get('country'), password: form.get('password'), acceptedTerms: form.get('acceptedTerms') === 'on', recaptchaToken,
    });
    setNotice({ tone: result.ok ? 'success' : 'error', text: result.data.message }); setLoading(false);
    if (result.ok) formElement.reset();
  }
  return <form className="auth-form" onSubmit={onSubmit}>
    <div className="form-grid"><label>First name<input name="firstName" autoComplete="given-name" minLength={2} maxLength={60} required /></label><label>Last name<input name="lastName" autoComplete="family-name" minLength={2} maxLength={60} required /></label></div>
    <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
    <div className="form-grid"><label>Phone number<input name="phone" type="tel" autoComplete="tel" placeholder="+234 800 000 0000" required /></label><label>Country<CountrySelect /></label></div>
    <label>Password<input name="password" type="password" autoComplete="new-password" minLength={10} required /><small>10+ characters, including uppercase, lowercase, and a number.</small></label>
    <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={10} required /></label>
    <label className="checkbox-field"><input name="acceptedTerms" type="checkbox" required /><span>I agree to the <Link href="/affiliate-terms" target="_blank">Affiliate Program Terms</Link> and <Link href="https://www.sureimports.com/privacy-policy">Privacy Policy</Link>.</span></label>
    <NoticeBox notice={notice} /><button className="button auth-submit" disabled={loading}>{loading ? 'Creating account…' : 'Create affiliate account'}</button>
    <p className="auth-switch">Already have an account? <Link href="/sign-in">Sign in</Link></p>
  </form>;
}

export function SignInForm() {
  const router = useRouter(); const captcha = useRecaptchaV3(); const [notice, setNotice] = useState<Notice>(null); const [loading, setLoading] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setNotice(null); const form = new FormData(event.currentTarget);
    let recaptchaToken: string | undefined;
    try { recaptchaToken = await captcha('affiliate_signin'); } catch { setNotice({ tone: 'error', text: 'Security verification could not load. Please refresh and try again.' }); setLoading(false); return; }
    const result = await submit('/api/auth/sign-in', { email: form.get('email'), password: form.get('password'), recaptchaToken });
    if (result.ok) { router.replace('/dashboard'); return; }
    setNotice({ tone: 'error', text: result.data.message }); setLoading(false);
  }
  return <form className="auth-form" onSubmit={onSubmit}>
    <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
    <label><span className="label-row">Password <Link href="/forgot-password">Forgot password?</Link></span><input name="password" type="password" autoComplete="current-password" required /></label>
    <NoticeBox notice={notice} /><button className="button auth-submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
    <p className="auth-switch">New to the program? <Link href="/sign-up">Create an account</Link></p>
  </form>;
}

export function EmailRequestForm({ mode }: { mode: 'forgot' | 'verify' }) {
  const captcha = useRecaptchaV3(); const [notice, setNotice] = useState<Notice>(null); const [loading, setLoading] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); const form = new FormData(event.currentTarget);
    let recaptchaToken: string | undefined;
    try { recaptchaToken = await captcha(mode === 'forgot' ? 'affiliate_forgot_password' : 'affiliate_resend_verification'); } catch { setNotice({ tone: 'error', text: 'Security verification could not load. Please refresh and try again.' }); setLoading(false); return; }
    const endpoint = mode === 'forgot' ? '/api/auth/forgot-password' : '/api/auth/resend-verification';
    const result = await submit(endpoint, { email: form.get('email'), recaptchaToken });
    setNotice({ tone: result.ok ? 'success' : 'error', text: result.data.message }); setLoading(false);
  }
  return <form className="auth-form" onSubmit={onSubmit}><label>Email address<input name="email" type="email" autoComplete="email" required /></label><NoticeBox notice={notice} /><button className="button auth-submit" disabled={loading}>{loading ? 'Sending…' : mode === 'forgot' ? 'Send reset link' : 'Send verification email'}</button><p className="auth-switch"><Link href="/sign-in">Return to sign in</Link></p></form>;
}

export function VerifyEmailForm({ token }: { token: string }) {
  const once = useRef(false); const [notice, setNotice] = useState<Notice>({ tone: 'success', text: 'Verifying your email address…' }); const [done, setDone] = useState(false);
  useEffect(() => { if (once.current) return; once.current = true; submit('/api/auth/verify-email', { token }).then((result) => { setNotice({ tone: result.ok ? 'success' : 'error', text: result.data.message }); setDone(result.ok); }); }, [token]);
  return <div className="auth-form"><NoticeBox notice={notice} />{done ? <Link className="button auth-submit" href="/sign-in">Continue to sign in</Link> : <p className="auth-switch">Need a fresh link? <Link href="/verify-email">Resend verification</Link></p>}</div>;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const captcha = useRecaptchaV3(); const [notice, setNotice] = useState<Notice>(null); const [loading, setLoading] = useState(false); const [done, setDone] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); if (form.get('password') !== form.get('confirmPassword')) { setNotice({ tone: 'error', text: 'Your passwords do not match.' }); return; }
    setLoading(true); let recaptchaToken: string | undefined;
    try { recaptchaToken = await captcha('affiliate_reset_password'); } catch { setNotice({ tone: 'error', text: 'Security verification could not load. Please refresh and try again.' }); setLoading(false); return; }
    const result = await submit('/api/auth/reset-password', { token, password: form.get('password'), recaptchaToken }); setNotice({ tone: result.ok ? 'success' : 'error', text: result.data.message }); setDone(result.ok); setLoading(false);
  }
  if (done) return <div className="auth-form"><NoticeBox notice={notice} /><Link className="button auth-submit" href="/sign-in">Sign in with new password</Link></div>;
  return <form className="auth-form" onSubmit={onSubmit}><label>New password<input name="password" type="password" autoComplete="new-password" minLength={10} required /><small>10+ characters, including uppercase, lowercase, and a number.</small></label><label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={10} required /></label><NoticeBox notice={notice} /><button className="button auth-submit" disabled={loading}>{loading ? 'Updating…' : 'Update password'}</button></form>;
}

export function SignOutButton() {
  const router = useRouter(); const [loading, setLoading] = useState(false);
  return <button className="button button-secondary" disabled={loading} onClick={async () => { setLoading(true); await submit('/api/auth/sign-out', {}); router.replace('/sign-in'); }}>{loading ? 'Signing out…' : 'Sign out'}</button>;
}
