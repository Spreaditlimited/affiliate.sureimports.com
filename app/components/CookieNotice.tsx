'use client';

import { useEffect, useState } from 'react';
import styles from './CookieNotice.module.css';

const CONSENT_KEY = 'sure-imports-affiliate-cookie-consent';
type ConsentChoice = 'analytics' | 'essential';

type ConsentWindow = Window & {
  gtag?: (...args: unknown[]) => void;
};

function updateGoogleConsent(choice: ConsentChoice) {
  (window as ConsentWindow).gtag?.('consent', 'update', {
    analytics_storage: choice === 'analytics' ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}

function CookieIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.5 13.2A8.8 8.8 0 1 1 10.8 3.5a4.5 4.5 0 0 0 5.7 5.7 4.5 4.5 0 0 0 4 4Z" />
      <circle cx="8" cy="10" r="1" />
      <circle cx="11" cy="16" r="1" />
      <circle cx="6.5" cy="15.5" r=".7" />
    </svg>
  );
}

export function CookieNotice() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const savedChoice = localStorage.getItem(CONSENT_KEY);
      if (savedChoice === 'analytics' || savedChoice === 'essential') {
        updateGoogleConsent(savedChoice);
        return;
      }
    } catch (error) {
      console.warn('Cookie preference storage is unavailable.', error);
    }

    setIsVisible(true);
  }, []);

  function saveChoice(choice: ConsentChoice) {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch (error) {
      console.warn('Cookie preference could not be saved.', error);
    }

    updateGoogleConsent(choice);
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <aside
      className={styles.notice}
      aria-label="Cookie preferences"
      aria-live="polite"
    >
      <div className={styles.icon}>
        <CookieIcon />
      </div>
      <div className={styles.content}>
        <strong>Your privacy, your choice</strong>
        <p>
          We use essential cookies to keep affiliate accounts secure. With your
          permission, we also use analytics cookies to understand how this site
          is used.{' '}
          <a href="https://www.sureimports.com/privacy-policy">
            Privacy policy
          </a>
        </p>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={() => saveChoice('essential')}>
          Essential only
        </button>
        <button type="button" onClick={() => saveChoice('analytics')}>
          Allow analytics
        </button>
      </div>
    </aside>
  );
}
