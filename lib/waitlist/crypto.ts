import 'server-only';
import { createCipheriv, createHmac, hkdfSync, randomBytes } from 'crypto';

function masterKey() {
  const encoded = process.env.WAITLIST_ENCRYPTION_KEY;
  if (!encoded) throw new Error('WAITLIST_ENCRYPTION_KEY is not configured');

  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32) {
    throw new Error('WAITLIST_ENCRYPTION_KEY must be a 32-byte base64 value');
  }
  return key;
}

function deriveKey(purpose: string) {
  return Buffer.from(
    hkdfSync('sha256', masterKey(), Buffer.alloc(0), purpose, 32),
  );
}

export function encryptWaitlistValue(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey('waitlist-encryption-v1'), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv, tag, ciphertext]
    .map((part) => typeof part === 'string' ? part : part.toString('base64url'))
    .join('.');
}

export function waitlistFingerprint(value: string) {
  return createHmac('sha256', deriveKey('waitlist-fingerprint-v1'))
    .update(value)
    .digest('hex');
}
