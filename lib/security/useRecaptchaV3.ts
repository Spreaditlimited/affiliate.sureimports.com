'use client';

import { useCallback } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const siteKey = process.env.NEXT_PUBLIC_GOOGLE_CAPTCHA_SITE_KEY;
let scriptPromise: Promise<void> | null = null;

function localhost() {
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
}

function loadScript(key: string) {
  if (window.grecaptcha) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  if (!/^[A-Za-z0-9_-]+$/.test(key)) return Promise.reject(new Error('Invalid CAPTCHA configuration.'));

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(key)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('CAPTCHA could not be loaded.'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function useRecaptchaV3() {
  return useCallback(async (action: string) => {
    if (typeof window === 'undefined' || localhost()) return undefined;
    if (!siteKey) throw new Error('CAPTCHA is not configured.');
    await loadScript(siteKey);
    return new Promise<string>((resolve, reject) => {
      if (!window.grecaptcha) return reject(new Error('CAPTCHA is unavailable.'));
      window.grecaptcha.ready(() => window.grecaptcha!.execute(siteKey, { action }).then(resolve).catch(reject));
    });
  }, []);
}
