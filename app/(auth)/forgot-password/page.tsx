import type { Metadata } from 'next';
import { AuthShell } from '../components/AuthShell';
import { EmailRequestForm } from '../components/AuthForms';
export const metadata: Metadata = { title: 'Reset password | Sure Imports Affiliate' };
export default function Page() { return <AuthShell eyebrow="Account recovery" title="Reset your password" description="Enter your account email and we will send a secure reset link that expires in 30 minutes."><EmailRequestForm mode="forgot" /></AuthShell>; }
