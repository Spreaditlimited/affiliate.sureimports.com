'use client';
import { useId, useState } from 'react';
import styles from './WorkspaceSearch.module.css';

export default function WorkspaceSearch({ items, onNavigate }: { items: { label: string; href: string }[]; onNavigate?: (href: string) => void }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const id = useId();
  const matches = items.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className={styles.search} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5" /><path d="m16 16 5 5" /></svg>
    <input aria-label="Search workspace pages" aria-controls={id} aria-expanded={open} placeholder="Search here..." value={query} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }} />
    {open ? <nav id={id} aria-label="Search results" className={styles.results}>{matches.length ? matches.map((item) => <a key={item.href} href={item.href} onClick={(event) => { if (onNavigate && !event.metaKey && !event.ctrlKey) { event.preventDefault(); onNavigate(item.href); } setOpen(false); setQuery(''); }}>{item.label}</a>) : <p>No matching pages.</p>}</nav> : null}
  </div>;
}
