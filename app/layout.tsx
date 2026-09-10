import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import Script from 'next/script';
import { CookieNotice } from '@/app/components/CookieNotice';
import { ThemeProvider } from '@/app/components/ThemeProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
const gaMeasurementId =
  process.env.NEXT_PUBLIC_GA_TRACKING_ID || 'G-CMGHVCHW1D';

export const metadata: Metadata = {
  metadataBase: new URL('https://affiliate.sureimports.com'),
  title: 'Sure Imports Affiliate Program — Recommend. Refer. Earn.',
  description:
    'Earn transparent commissions when people and businesses purchase eligible Sure Imports services through your referral.',
  icons: {
    icon: [
      {
        url: '/favicon.png?v=2',
        type: 'image/png',
        sizes: '300x300',
      },
    ],
    shortcut: '/favicon.png?v=2',
    apple: '/favicon.png?v=2',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Sure Imports Affiliate Program',
    title: 'Recommend what works. Earn when they buy.',
    description:
      'Earn transparent commissions when people and businesses purchase eligible Sure Imports services through your referral.',
    images: [
      {
        url: '/images/affiliate-social-card.png',
        width: 1200,
        height: 630,
        alt: 'Sure Imports Affiliate Program — Recommend what works. Earn when they buy.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recommend what works. Earn when they buy.',
    description:
      'Earn transparent commissions when people and businesses purchase eligible Sure Imports services through your referral.',
    images: ['/images/affiliate-social-card.png'],
  },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf8f3' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <Script
          id="affiliate-google-consent-default"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              var affiliateConsent = null;
              try { affiliateConsent = localStorage.getItem('sure-imports-affiliate-cookie-consent'); } catch (error) {}
              gtag('consent', 'default', {
                analytics_storage: affiliateConsent === 'analytics' ? 'granted' : 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                functionality_storage: 'granted',
                security_storage: 'granted',
                wait_for_update: 500
              });
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
        <CookieNotice />
        <GoogleAnalytics gaId={gaMeasurementId} />
      </body>
    </html>
  );
}
