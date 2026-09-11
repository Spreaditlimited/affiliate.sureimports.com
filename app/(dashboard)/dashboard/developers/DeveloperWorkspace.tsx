'use client';

import { useState } from 'react';

const apiReferenceUrl = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3001/developers/shipping-api'
  : 'https://www.sureimports.com/developers/shipping-api';

type Credential = { pidCredential: string; name: string; keyPrefix: string; scopes: string; active: boolean; lastUsedAt: string | null; createdAt: string };
const endpoint = 'https://www.sureimports.com/api/v1/shipping-requests';
const example = `curl --request POST ${endpoint} \\
  --header "Authorization: Bearer si_live_REPLACE_ME" \\
  --header "Idempotency-Key: order-88421" \\
  --header "Content-Type: application/json" \\
  --data '{
    "customer": { "firstName": "Ada", "lastName": "Okafor", "email": "ada@example.com", "phone": "+2348012345678" },
    "shipment": {
      "shippingName": "Ada Stores", "destinationCountry": "Nigeria",
      "shippingPlanId": "REPLACE_WITH_PLAN_ID", "estimatedQuantity": 32.5,
      "description": "Two cartons of fashion accessories",
      "expectedShipments": "Ready for collection in Guangzhou"
    },
    "externalReference": "partner-order-88421"
  }'`;

export function DeveloperWorkspace({ initialCredentials }: { initialCredentials: Credential[] }) {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [name, setName] = useState('Production integration');
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  async function createKey() {
    setBusy(true); setNotice(''); setSecret('');
    try {
      const response = await fetch('/api/developer/credentials', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setSecret(result.data.secret);
      setCredentials((current) => [{ ...result.data, active: true, lastUsedAt: null }, ...current]);
      setNotice(result.message);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to create API key.'); }
    finally { setBusy(false); }
  }

  async function revoke(pidCredential: string) {
    if (!window.confirm('Revoke this API key? Applications using it will stop working immediately.')) return;
    const response = await fetch(`/api/developer/credentials/${encodeURIComponent(pidCredential)}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) return setNotice(result.message || 'Unable to revoke API key.');
    setCredentials((current) => current.map((item) => item.pidCredential === pidCredential ? { ...item, active: false } : item));
    setNotice(result.message);
  }

  return <div className="developer-workspace">
    <section className="developer-intro"><div><span>API v1</span><h2>Create owned shipping requests</h2><p>Submit shipping-only opportunities from your product. The API key identifies you as the permanent owner of each accepted request; customers never supply or select an affiliate ID.</p></div><div className="developer-intro-actions"><a href="#quickstart">Read quickstart</a><a href="/api/developer/quickstart" download>Download guide</a><a href={apiReferenceUrl} target="_blank" rel="noreferrer">API reference</a></div></section>
    <section className="developer-panel"><header><div><strong>API keys</strong><span>Secrets are shown once. Store them in a server-side secret manager.</span></div></header><div className="developer-key-create"><input value={name} maxLength={120} onChange={(event) => setName(event.target.value)} aria-label="API key name" /><button onClick={createKey} disabled={busy}>{busy ? 'Creating…' : 'Create secret key'}</button></div>{secret ? <div className="developer-secret"><div><strong>Copy this key now</strong><span>It cannot be recovered after you leave this page.</span></div><code>{secret}</code><button onClick={() => navigator.clipboard.writeText(secret)}>Copy</button></div> : null}{notice ? <p className="developer-notice">{notice}</p> : null}<div className="developer-key-list">{credentials.length ? credentials.map((credential) => <article key={credential.pidCredential}><div><strong>{credential.name}</strong><code>{credential.keyPrefix}••••••••</code></div><span>{credential.scopes}</span><small>{credential.lastUsedAt ? `Last used ${new Date(credential.lastUsedAt).toLocaleDateString('en-GB')}` : 'Never used'}</small><b className={credential.active ? 'is-active' : ''}>{credential.active ? 'Active' : 'Revoked'}</b>{credential.active ? <button onClick={() => revoke(credential.pidCredential)}>Revoke</button> : null}</article>) : <p className="developer-empty">No API keys yet.</p>}</div></section>
    <section className="developer-docs" id="quickstart"><aside><strong>On this page</strong><a href="#authentication">Authentication</a><a href="#plans">Shipping plans</a><a href="#request">Create request</a><a href="#status">Request status</a><a href="#idempotency">Idempotency</a><a href="#ownership">Ownership</a><a href="#errors">Errors</a></aside><div>
      <article><span>01</span><h2>Quickstart</h2><p>Call the production endpoint from your backend. Never expose a secret key in browser JavaScript, mobile application bundles, public repositories or screenshots.</p><pre><code>{example}</code></pre></article>
      <article id="authentication"><span>02</span><h2>Authentication</h2><p>Send the key in the HTTP <code>Authorization</code> header using the Bearer scheme. Keys carry <code>shipping:write</code> and <code>shipping:read</code> scopes and can be revoked immediately from this page.</p></article>
      <article id="plans"><span>03</span><h2>Discover shipping plans</h2><p>Call <code>GET /api/v1/shipping-plans?destinationCountry=Nigeria</code> with your Bearer key. The response supplies supported <code>shippingPlanId</code> and authoritative <code>billingUnit</code> values.</p></article>
      <article id="request"><span>04</span><h2>Create a shipping request</h2><p><code>POST /api/v1/shipping-requests</code> accepts a customer identity, shipment details and your external reference. <code>shippingPlanId</code> must be a Sure Imports plan for the selected destination. Submit <code>estimatedQuantity</code> in the plan’s returned <code>billingUnit</code>—KG or CBM. Commission uses the final quantity confirmed on the paid invoice, not this estimate.</p><div className="developer-fields"><b>Required</b><code>customer.firstName</code><code>customer.email</code><code>customer.phone</code><code>shipment.shippingName</code><code>shipment.destinationCountry</code><code>shipment.shippingPlanId</code><code>shipment.estimatedQuantity</code><code>shipment.description</code><code>externalReference</code></div><p>HTTP 201 returns <code>requestId</code>, <code>status</code>, <code>ownership.attributionId</code> and <code>ownership.lockedAt</code>.</p></article>
      <article id="status"><span>05</span><h2>Read request status</h2><p>Call <code>GET /api/v1/shipping-requests/REQUEST_ID</code>. A key can read only requests owned by the same affiliate account.</p></article>
      <article id="idempotency"><span>06</span><h2>Idempotency</h2><p>Every POST requires an <code>Idempotency-Key</code> header between 8 and 120 characters. Retrying the identical payload with the same key returns the original response. Reusing a key with different content returns HTTP 409.</p></article>
      <article id="ownership"><span>07</span><h2>Ownership and earnings</h2><p>The API key’s affiliate account permanently owns the accepted request. Request ownership does not replace the customer’s general affiliate relationship. When its invoice becomes fully paid, the locked unit, final quantity, currency and configured rate create one auditable Ship with Us commission.</p><ul><li>Per-KG rates are configured independently in NGN and USD.</li><li>Nigeria shipments billed by volume use the configured NGN-per-CBM rate.</li><li>Duties, storage, verification, penalties and unrelated fees are excluded.</li><li>Cancelled or reversed payments void the associated commission.</li></ul></article>
      <article id="errors"><span>08</span><h2>Errors</h2><div className="developer-errors"><code>400 INVALID_REQUEST</code><p>Fields, country or plan are invalid.</p><code>401 UNAUTHORIZED</code><p>The key is missing, invalid, expired or revoked.</p><code>403 INSUFFICIENT_SCOPE</code><p>The key cannot create requests.</p><code>404 NOT_FOUND</code><p>The owned request does not exist.</p><code>409 IDEMPOTENCY_CONFLICT</code><p>The key was reused with different content.</p><code>409 EXTERNAL_REFERENCE_CONFLICT</code><p>Your external reference already identifies another request.</p><code>429 RATE_LIMITED</code><p>Too many requests were sent. Respect <code>Retry-After</code>.</p><code>500 INTERNAL_ERROR</code><p>The request was not safely completed.</p><code>503 SERVICE_UNAVAILABLE</code><p>Retry later using the same idempotency key.</p></div></article>
    </div></section>
  </div>;
}
