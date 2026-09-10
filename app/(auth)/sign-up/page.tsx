import type { Metadata } from 'next';
import { AuthShell } from '../components/AuthShell';
import { SignUpForm } from '../components/AuthForms';
export const metadata: Metadata = { title: 'Sign up | Sure Imports Affiliate' };
export default function Page() { return <AuthShell eyebrow="Join the program" title="Create your affiliate account" description="Start with a verified account. Your dashboard and unique referral link will be ready when you sign in."><SignUpForm /></AuthShell>; }
