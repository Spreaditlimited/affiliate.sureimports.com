'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './AccountTray.module.css';

export default function AccountTray({ name, email, image, children }: { name: string; email?: string; image?: string | null; children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const prior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => { dialog.current?.close(); document.body.style.overflow = prior; };
  }, [open]);
  useEffect(() => { const closeOnDesktop = () => { if (window.innerWidth >= 1024) setOpen(false); }; window.addEventListener('resize', closeOnDesktop); return () => window.removeEventListener('resize', closeOnDesktop); }, []);
  const avatar = image ? <img src={image} alt="" /> : name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  return <>
    <span className={`${styles.avatar} ${styles.desktopAvatar}`} aria-label={`${name} profile image`}>{avatar}</span>
    <button type="button" className={`${styles.avatar} ${styles.mobileAvatar}`} aria-label="Open account menu" aria-expanded={open} onClick={() => setOpen(true)}>{image ? <img src={image} alt="" /> : name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</button>
    <dialog ref={dialog} aria-label="Account menu" className={styles.tray} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right) setOpen(false); } }}>
      <button type="button" aria-label="Close account menu" className={styles.close} onClick={() => setOpen(false)}>×</button>
      <header><strong>{name}</strong>{email ? <small>{email}</small> : null}</header>
      <div onClick={(event) => { if ((event.target as HTMLElement).closest('a,button')) setOpen(false); }}>{children}</div>
    </dialog>
  </>;
}
