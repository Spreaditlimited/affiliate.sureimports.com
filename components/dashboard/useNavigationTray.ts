'use client';
import { useEffect } from 'react';

export function useNavigationTray(open: boolean, setOpen: (open: boolean) => void, id: string) {
  useEffect(() => {
    if (!open) return;
    const tray = document.getElementById(id);
    if (!tray) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(tray.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled])')).filter((node) => node.getClientRects().length);
    focusable()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
      if (event.key === 'Tab') {
        const nodes = focusable(); const first = nodes[0]; const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    const resize = () => { if (window.innerWidth >= 1024) setOpen(false); };
    document.addEventListener('keydown', keydown); window.addEventListener('resize', resize);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); window.removeEventListener('resize', resize); previous?.focus(); };
  }, [open, setOpen, id]);
}
