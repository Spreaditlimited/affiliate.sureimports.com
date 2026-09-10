import type { Metadata } from 'next';
import { AuthShell } from '../../components/AuthShell';
import { ResetPasswordForm } from '../../components/AuthForms';
export const metadata: Metadata = { title: 'Choose a new password | Sure Imports Affiliate' };
export default async function Page({ params }: PageProps<'/reset-password/[token]'>) { const { token } = await params; return <AuthShell eyebrow="Secure recovery" title="Choose a new password" description="Your new password will immediately revoke every existing session on this account."><ResetPasswordForm token={token} /></AuthShell>; }
