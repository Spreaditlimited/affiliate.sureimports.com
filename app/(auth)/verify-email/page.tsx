import type { Metadata } from 'next';
import { AuthShell } from '../components/AuthShell';
import { EmailRequestForm } from '../components/AuthForms';
export const metadata: Metadata = { title: 'Verify email | Sure Imports Affiliate' };
export default function Page() { return <AuthShell eyebrow="Email verification" title="Request a new verification link" description="Enter the email used for your account. For your security, each new link invalidates the previous one."><EmailRequestForm mode="verify" /></AuthShell>; }
