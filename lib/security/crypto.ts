import 'server-only';
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
} from 'crypto';

function masterKey() {
  const encoded = process.env.AFFILIATE_SECURITY_KEY ?? process.env.WAITLIST_ENCRYPTION_KEY;
  if (!encoded) throw new Error('AFFILIATE_SECURITY_KEY is not configured');

  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32) throw new Error('AFFILIATE_SECURITY_KEY must be a 32-byte base64 value');
  return key;
}

function keyFor(purpose: string) {
  return Buffer.from(hkdfSync('sha256', masterKey(), Buffer.alloc(0), purpose, 32));
}

export function encryptPrivateValue(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFor('affiliate-pii-v1'), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), ciphertext.toString('base64url')].join('.');
}

export function decryptPrivateValue(value: string) {
  const [version, iv, tag, ciphertext] = value.split('.');
  if (version !== 'v1' || !iv || !tag || !ciphertext) throw new Error('Invalid encrypted value');
  const decipher = createDecipheriv('aes-256-gcm', keyFor('affiliate-pii-v1'), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8');
}

export function secureFingerprint(value: string, purpose = 'affiliate-fingerprint-v1') {
  return createHmac('sha256', keyFor(purpose)).update(value).digest('hex');
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}
