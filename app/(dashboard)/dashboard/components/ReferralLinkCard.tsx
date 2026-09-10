'use client';
import { useState } from 'react';
export function ReferralLinkCard({ code }: { code: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle'); const link = `https://www.sureimports.com/?ref=${code}`;
  async function copyLink() {
    try { await navigator.clipboard.writeText(link); setStatus('copied'); }
    catch { setStatus('error'); }
    window.setTimeout(() => setStatus('idle'), 1800);
  }
  return <section className="referral-link-card"><div><span>Your referral link</span><strong>{link}</strong></div><button type="button" onClick={copyLink}>{status === 'copied' ? 'Copied' : status === 'error' ? 'Copy failed' : 'Copy link'}</button></section>;
}
