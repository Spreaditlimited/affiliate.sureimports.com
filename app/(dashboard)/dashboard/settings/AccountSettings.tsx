'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { CountrySelect } from '@/app/components/CountrySelect';
import { PasswordInput } from '@/app/components/PasswordInput';

type Notice = { tone: 'success' | 'error'; text: string } | null;
type Session = { pidSession: string; current: boolean; createdLabel: string; lastSeenLabel: string; expiresLabel: string };
type AffiliateProfile = { firstName: string; lastName: string; email: string; phone: string; country: string; referralCode: string };

async function send(endpoint: string, method: 'PATCH' | 'DELETE', payload: unknown) {
  const response = await fetch(endpoint, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  const result = await response.json().catch(() => ({ message: 'Something went wrong. Please try again.' }));
  return { ok: response.ok, message: String(result.message || 'Something went wrong. Please try again.') };
}

function Feedback({ notice }: { notice: Notice }) {
  return notice ? <p className={`settings-feedback ${notice.tone === 'error' ? 'is-error' : ''}`} role="status">{notice.text}</p> : null;
}

export function AccountSettings({ profile, sessions }: { profile: AffiliateProfile; sessions: Session[] }) {
  const router = useRouter();
  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [sessionBusy, setSessionBusy] = useState('');
  const [profileNotice, setProfileNotice] = useState<Notice>(null);
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);
  const [sessionNotice, setSessionNotice] = useState<Notice>(null);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileBusy(true); setProfileNotice(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const result = await send('/api/account/profile', 'PATCH', {
      firstName: form.get('firstName'), lastName: form.get('lastName'), phone: form.get('phone'),
      country: form.get('country'), currentPassword: form.get('currentPassword'),
    });
    setProfileNotice({ tone: result.ok ? 'success' : 'error', text: result.message });
    if (result.ok) {
      const passwordInput = formElement.elements.namedItem('currentPassword');
      if (passwordInput instanceof HTMLInputElement) passwordInput.value = '';
      router.refresh();
    }
    setProfileBusy(false);
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordNotice(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (form.get('newPassword') !== form.get('confirmPassword')) {
      setPasswordNotice({ tone: 'error', text: 'Your new passwords do not match.' });
      return;
    }
    setPasswordBusy(true);
    const result = await send('/api/account/password', 'PATCH', {
      currentPassword: form.get('currentPassword'), newPassword: form.get('newPassword'),
    });
    setPasswordNotice({ tone: result.ok ? 'success' : 'error', text: result.message });
    if (result.ok) {
      formElement.reset();
      router.refresh();
    }
    setPasswordBusy(false);
  }

  async function removeSessions(payload: { pidSession?: string; allOthers?: boolean }, key: string) {
    setSessionBusy(key); setSessionNotice(null);
    const result = await send('/api/account/sessions', 'DELETE', payload);
    setSessionNotice({ tone: result.ok ? 'success' : 'error', text: result.message });
    if (result.ok) router.refresh();
    setSessionBusy('');
  }

  const otherSessions = sessions.filter((session) => !session.current);
  return <div className="account-settings-grid">
    <section className="dashboard-panel account-settings-panel">
      <header><div><span>Profile information</span><small>Encrypted personal information</small></div><b>Verified email</b></header>
      <form className="settings-form" onSubmit={updateProfile}>
        <div className="settings-form-grid"><label><span>First name</span><input name="firstName" defaultValue={profile.firstName} autoComplete="given-name" minLength={2} maxLength={60} required /></label><label><span>Last name</span><input name="lastName" defaultValue={profile.lastName} autoComplete="family-name" minLength={2} maxLength={60} required /></label></div>
        <label><span>Email address</span><input value={profile.email} disabled readOnly aria-describedby="email-help" /><small id="email-help">Contact support to change your verified email address.</small></label>
        <div className="settings-form-grid"><label><span>Phone number</span><input name="phone" type="tel" defaultValue={profile.phone} autoComplete="tel" minLength={7} maxLength={24} required /></label><label><span>Country</span><CountrySelect defaultValue={profile.country} /></label></div>
        <label><span>Current password</span><PasswordInput name="currentPassword" autoComplete="current-password" required /><small>Required to protect changes to your personal information.</small></label>
        <Feedback notice={profileNotice} />
        <div className="settings-form-footer"><span>Referral code: <strong>{profile.referralCode.toLowerCase()}</strong></span><button className="button" disabled={profileBusy}>{profileBusy ? 'Saving…' : 'Save profile'}</button></div>
      </form>
    </section>

    <section className="dashboard-panel account-settings-panel">
      <header><div><span>Password</span><small>Secure your affiliate account</small></div></header>
      <form className="settings-form" onSubmit={updatePassword}>
        <label><span>Current password</span><PasswordInput name="currentPassword" autoComplete="current-password" required /></label>
        <label><span>New password</span><PasswordInput name="newPassword" autoComplete="new-password" minLength={10} required /><small>At least 10 characters with uppercase, lowercase, and a number.</small></label>
        <label><span>Confirm new password</span><PasswordInput name="confirmPassword" autoComplete="new-password" minLength={10} required /></label>
        <Feedback notice={passwordNotice} />
        <div className="settings-form-footer"><span>Changing your password signs out every other device.</span><button className="button" disabled={passwordBusy}>{passwordBusy ? 'Changing…' : 'Change password'}</button></div>
      </form>
    </section>

    <section className="dashboard-panel account-settings-panel account-session-panel">
      <header><div><span>Active sessions</span><small>Devices currently signed into your account</small></div>{otherSessions.length ? <button className="button button-secondary" type="button" disabled={Boolean(sessionBusy)} onClick={() => removeSessions({ allOthers: true }, 'all')}>{sessionBusy === 'all' ? 'Signing out…' : 'Sign out other devices'}</button> : null}</header>
      <div className="settings-session-list">{sessions.map((session) => <article key={session.pidSession}><div className={`session-indicator ${session.current ? 'is-current' : ''}`}><i /></div><div><strong>{session.current ? 'This device' : 'Signed-in device'}</strong><span>Last active {session.lastSeenLabel}</span><small>Signed in {session.createdLabel} · Expires {session.expiresLabel}</small></div>{session.current ? <b>Current</b> : <button type="button" disabled={Boolean(sessionBusy)} onClick={() => removeSessions({ pidSession: session.pidSession }, session.pidSession)}>{sessionBusy === session.pidSession ? 'Signing out…' : 'Sign out'}</button>}</article>)}</div>
      <Feedback notice={sessionNotice} />
    </section>
  </div>;
}
