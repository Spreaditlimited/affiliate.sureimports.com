'use client';
import { useState } from 'react';
export function ReferralLinkCard({ code }: { code: string }) {
  const [status, setStatus] = useState<'idle' | 'sure' | 'linescout' | 'error'>('idle');
  const referralCode = code.toLowerCase();
  const links = { sure: `https://www.sureimports.com/?ref=${referralCode}`, linescout: `https://linescout.sureimports.com/affiliates/${referralCode}` };
  async function copyLink(target: 'sure' | 'linescout') {
    try { await navigator.clipboard.writeText(links[target]); setStatus(target); }
    catch { setStatus('error'); }
    window.setTimeout(() => setStatus('idle'), 1800);
  }
  return <section className="referral-link-card referral-link-card-multiple"><div className="referral-link-options"><div><span>Sure Imports referral link</span><strong>{links.sure}</strong></div><button type="button" onClick={() => copyLink('sure')}>{status === 'sure' ? 'Copied' : 'Copy link'}</button><div><span>LineScout sourcing referral link</span><strong>{links.linescout}</strong></div><button type="button" onClick={() => copyLink('linescout')}>{status === 'linescout' ? 'Copied' : status === 'error' ? 'Copy failed' : 'Copy link'}</button></div></section>;
}
