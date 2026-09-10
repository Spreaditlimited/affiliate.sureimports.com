'use client';

import { FormEvent, useState } from 'react';
import { CountrySelect } from '@/app/components/CountrySelect';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export function WaitlistForm() {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');

  async function submitWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message || 'We could not save your details.');
      }

      form.reset();
      setStatus('success');
      setMessage(result.message || 'You are on the waitlist.');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.',
      );
    }
  }

  if (status === 'success') {
    return (
      <div className="waitlist-success" role="status">
        <div className="waitlist-success-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="m6 12 4 4 8-9" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <h3>You&rsquo;re on the list.</h3>
        <p>{message}</p>
        <p className="waitlist-success-note">
          This is a waitlist confirmation, not an affiliate account.
        </p>
      </div>
    );
  }

  return (
    <form className="waitlist-form" onSubmit={submitWaitlist} noValidate>
      <div className="waitlist-field waitlist-field-wide">
        <label htmlFor="fullName">Full name</label>
        <input
          id="fullName"
          name="fullName"
          autoComplete="name"
          maxLength={120}
          placeholder="Your full name"
          required
        />
      </div>

      <div className="waitlist-field waitlist-field-wide">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="waitlist-field">
        <label htmlFor="country">Country</label>
        <CountrySelect id="country" />
      </div>

      <div className="waitlist-field">
        <label htmlFor="phone">Phone number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={24}
          placeholder="Include country code"
          required
        />
      </div>

      <div className="waitlist-honeypot" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {status === 'error' && (
        <p className="waitlist-message waitlist-message-error" role="alert">
          {message}
        </p>
      )}

      <button type="submit" disabled={status === 'submitting'}>
        <span>{status === 'submitting' ? 'Joining…' : 'Join the waitlist'}</span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </button>

      <p className="waitlist-consent">
        By joining, you agree that Sure Imports may contact you about this
        relaunch. You are not creating an affiliate account yet.
      </p>
    </form>
  );
}
