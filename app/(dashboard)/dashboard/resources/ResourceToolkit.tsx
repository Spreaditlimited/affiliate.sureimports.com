'use client';

import Image from 'next/image';
import { useState } from 'react';

type Service = {
  key: string;
  name: string;
  reward: string;
  basis: string;
};

const campaigns = [
  { label: 'General introduction', title: 'Introduce Sure Imports', copy: 'Buying from China does not have to feel complicated. Sure Imports helps individuals and businesses source products, verify suppliers, and buy with greater confidence. Learn more through my link:' },
  { label: 'Supplier research', title: 'Share supplier intelligence', copy: 'Before paying a supplier, get better information. Sure Imports offers supplier reports, verification, and intelligence designed to help importers make informed decisions. Explore the available services here:' },
  { label: 'Phones and laptops', title: 'Share device sourcing', copy: 'Looking for phones or laptops sourced from China? Sure Imports can help you understand the buying process and place an eligible order. Start here:' },
  { label: 'Short social caption', title: 'Post a concise recommendation', copy: 'Source smarter from China with Sure Imports. Explore their buying, supplier research, and verification services through my link:' },
] as const;

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');
  async function copy() {
    try { await navigator.clipboard.writeText(value); setState('copied'); }
    catch { setState('error'); }
    window.setTimeout(() => setState('idle'), 1800);
  }
  return <button type="button" onClick={copy}>{state === 'copied' ? 'Copied' : state === 'error' ? 'Copy failed' : label}</button>;
}

export function ResourceToolkit({ code, services }: { code: string; services: Service[] }) {
  const link = `https://www.sureimports.com/?ref=${code.toLowerCase()}`;
  const shareText = `Discover Sure Imports through my referral link: ${link}`;
  const encodedLink = encodeURIComponent(link);
  const encodedText = encodeURIComponent(shareText);

  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({ title: 'Sure Imports', text: 'Discover Sure Imports through my referral link.', url: link }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(link).catch(() => undefined);
  }

  return <div className="resource-workspace">
    <section className="resource-share-card"><div><span>Your referral link</span><strong>{link}</strong><p>Every eligible customer should begin from this link so their referral is permanently attributed to you.</p></div><div className="resource-share-actions"><CopyButton value={link} label="Copy link" /><button type="button" onClick={nativeShare}>Share</button></div><nav aria-label="Share referral link"><a href={`https://wa.me/?text=${encodedText}`} target="_blank" rel="noreferrer">WhatsApp</a><a href={`https://twitter.com/intent/tweet?text=${encodedText}`} target="_blank" rel="noreferrer">X</a><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`} target="_blank" rel="noreferrer">Facebook</a><a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`} target="_blank" rel="noreferrer">LinkedIn</a></nav></section>

    <div className="resource-section-heading"><div><span>01</span><h2>Approved brand assets</h2></div><p>Use the official files without stretching, recolouring, cropping, or separating the mark from the wordmark.</p></div>
    <section className="brand-download-grid"><article className="brand-download-card is-light"><div><Image src="/images/logo.png" width={664} height={106} alt="Sure Imports logo for light backgrounds" /></div><footer><div><strong>Logo for light backgrounds</strong><span>PNG · transparent</span></div><a href="/images/logo.png" download>Download</a></footer></article><article className="brand-download-card is-dark"><div><Image src="/images/logo-white.png" width={664} height={106} alt="Sure Imports logo for dark backgrounds" /></div><footer><div><strong>Logo for dark backgrounds</strong><span>PNG · transparent</span></div><a href="/images/logo-white.png" download>Download</a></footer></article><article className="brand-download-card is-icon"><div><Image src="/favicon.png" width={300} height={300} alt="Sure Imports icon" /></div><footer><div><strong>Sure Imports icon</strong><span>PNG · square</span></div><a href="/favicon.png" download>Download</a></footer></article></section>

    <div className="resource-section-heading"><div><span>02</span><h2>Campaign copy</h2></div><p>Add your own experience and voice, but keep service claims accurate and retain your referral link.</p></div>
    <section className="campaign-copy-grid">{campaigns.map((campaign) => { const completeCopy = `${campaign.copy} ${link}`; return <article key={campaign.label}><header><span>{campaign.label}</span><CopyButton value={completeCopy} /></header><h3>{campaign.title}</h3><p>{campaign.copy}</p><small>{link}</small></article>; })}</section>

    <div className="resource-section-heading"><div><span>03</span><h2>What you can earn from</h2></div><p>These rules are controlled by Sure Imports and always reflect the currently active programme configuration.</p></div>
    <section className="resource-rate-list">{services.map((service) => <article key={service.key}><div><strong>{service.name}</strong><span>{service.basis.replaceAll('_', ' ').toLowerCase()}</span></div><b>{service.reward}</b></article>)}</section>

    <div className="resource-section-heading"><div><span>04</span><h2>Affiliate playbook</h2></div><p>Strong referrals come from clear recommendations to people who genuinely need the service.</p></div>
    <section className="affiliate-playbook-grid"><article><span>01</span><h3>Start with the problem</h3><p>Explain the sourcing, buying, or supplier-research problem before introducing Sure Imports as a possible solution.</p></article><article><span>02</span><h3>Send the exact link</h3><p>Use your unique referral URL in every campaign. Do not shorten or remove its referral code unless tracking has been confirmed.</p></article><article><span>03</span><h3>Set honest expectations</h3><p>Never guarantee pricing, delivery dates, results, or earnings. Direct customers to Sure Imports for service-specific confirmation.</p></article><article><span>04</span><h3>Respect your audience</h3><p>Do not spam groups or send unsolicited bulk messages. Recommend services only where they are relevant and welcome.</p></article></section>

    <aside className="resource-compliance-note"><strong>Responsible promotion</strong><p>Do not impersonate Sure Imports, run advertisements using the brand name without written approval, or promise discounts and outcomes that Sure Imports has not formally published.</p></aside>
  </div>;
}
