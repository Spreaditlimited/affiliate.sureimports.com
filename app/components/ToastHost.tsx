'use client';
import { Toaster } from 'sonner';
import styles from './ToastHost.module.css';
export default function ToastHost() {
  return <Toaster className={styles.host} position="top-right" richColors closeButton expand
    visibleToasts={3} duration={6000} offset="max(20px, env(safe-area-inset-top))"
    mobileOffset={{ top: 'max(16px, env(safe-area-inset-top))', left: 16, right: 16 }}
    toastOptions={{ className: styles.toast }} />;
}
