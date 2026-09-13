export const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;
export function isProfileImage(bytes: Buffer) {
  if (!bytes.length || bytes.length > MAX_PROFILE_IMAGE_BYTES) return false;
  return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ||
    (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP');
}
export async function readProfileImage(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Choose a photo to upload.');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > MAX_PROFILE_IMAGE_BYTES) { await reader.cancel(); throw new Error('Choose a photo no larger than 2 MB.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = Buffer.concat(chunks);
  if (!isProfileImage(bytes)) throw new Error('Choose a JPEG, PNG or WebP photo, no larger than 2 MB.');
  return bytes;
}
