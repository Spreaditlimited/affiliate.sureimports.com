import type { Metadata } from 'next';
import { AuthShell } from '../../components/AuthShell';
import { VerifyEmailForm } from '../../components/AuthForms';
export const metadata: Metadata = { title: 'Verify email | Sure Imports Affiliate' };
export default async function Page({ params }: PageProps<'/verify-email/[token]'>) { const { token } = await params; return <AuthShell eyebrow="One last step" title="Confirming your email" description="We are securely validating the verification link for your affiliate account."><VerifyEmailForm token={token} /></AuthShell>; }
