import type { Metadata } from 'next';
import { AuthShell } from '../components/AuthShell';
import { SignInForm } from '../components/AuthForms';
export const metadata: Metadata = { title: 'Sign in | Sure Imports Affiliate' };
export default function Page() { return <AuthShell eyebrow="Welcome back" title="Sign in to your account" description="Track referrals, commissions, and payouts from your private affiliate dashboard."><SignInForm /></AuthShell>; }
