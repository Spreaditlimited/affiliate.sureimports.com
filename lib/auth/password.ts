import 'server-only';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';

const KEY_LENGTH = 64;

function derive(password: string, salt: Buffer, length: number, N: number, r: number, p: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, length, { N, r, p, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await derive(password, salt, KEY_LENGTH, 32768, 8, 1);
  return `scrypt-v1$32768$8$1$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [version, n, r, p, salt, expected] = stored.split('$');
  if (version !== 'scrypt-v1' || !salt || !expected) return false;
  const expectedBuffer = Buffer.from(expected, 'base64url');
  const derived = await derive(password, Buffer.from(salt, 'base64url'), expectedBuffer.length, Number(n), Number(r), Number(p));
  return expectedBuffer.length === derived.length && timingSafeEqual(expectedBuffer, derived);
}
