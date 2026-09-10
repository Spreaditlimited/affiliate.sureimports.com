'use client';

import { useState, type InputHTMLAttributes } from 'react';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export function PasswordInput({ className = '', ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return <span className="password-input">
    <input {...props} className={className} type={visible ? 'text' : 'password'} />
    <button
      type="button"
      className="password-input-toggle"
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
      onClick={() => setVisible((current) => !current)}
    >
      {visible ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 5.2 9 5.2a16.8 16.8 0 0 1-2.3 2.8M6.6 6.6A17.8 17.8 0 0 0 3 9.2s3.5 5.2 9 5.2c1 0 2-.2 2.8-.5" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.5-5.2 9-5.2 9 5.2 9 5.2-3.5 5.2-9 5.2S3 12 3 12Z" /><circle cx="12" cy="12" r="2.4" /></svg>}
    </button>
  </span>;
}
