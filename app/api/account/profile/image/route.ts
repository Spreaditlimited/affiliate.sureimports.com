import { createHash } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { NextRequest } from 'next/server';
import { currentAffiliate } from '@/lib/auth/session';
import { isTrustedRequest, noStoreJson, requestIp } from '@/lib/auth/request';
import { rateLimit } from '@/lib/auth/rate-limit';
import { prisma } from '@/lib/prisma';
import { readProfileImage } from '@/lib/profile-image';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request)) return noStoreJson({ message: 'Request could not be verified.' }, 403);
  const affiliate = await currentAffiliate();
  if (!affiliate) return noStoreJson({ message: 'Sign in again to upload your photo.' }, 401);
  if (!await rateLimit(`${affiliate.id}:${requestIp(request)}`, 'profile-photo', 5, 15)) return noStoreJson({ message: 'Too many uploads. Please try again in 15 minutes.' }, 429);
  let bytes: Buffer;
  try { bytes = await readProfileImage(request); } catch (error) { return noStoreJson({ message: (error as Error).message }, 422); }
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) return noStoreJson({ message: 'Photo uploads are temporarily unavailable. Please contact support.' }, 503);
  try {
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
    const image = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ resource_type:'image', folder:'affiliate-profiles', public_id:createHash('sha256').update(String(affiliate.id)).digest('hex'), overwrite:true, invalidate:true, format:'jpg', timeout:30000, transformation:[{width:400,height:400,crop:'fill',gravity:'auto'}] }, (error, result) => error || !result ? reject(error || new Error('Upload failed')) : resolve(result));
      stream.end(bytes);
    });
    await prisma.$executeRaw`UPDATE affiliate_accounts SET profileImageUrl = ${image.secure_url}, updatedAt = NOW() WHERE id = ${affiliate.id}`;
    return noStoreJson({ imageUrl:image.secure_url, message:'Profile photo uploaded and saved.' });
  } catch { return noStoreJson({ message:'Your photo could not be saved. Please try again.' }, 503); }
}
export async function DELETE(request: NextRequest) {
  if (!isTrustedRequest(request)) return noStoreJson({ message:'Request could not be verified.' }, 403);
  const affiliate = await currentAffiliate();
  if (!affiliate) return noStoreJson({ message:'Sign in again to update your photo.' }, 401);
  await prisma.$executeRaw`UPDATE affiliate_accounts SET profileImageUrl = NULL, updatedAt = NOW() WHERE id = ${affiliate.id}`;
  return noStoreJson({ message:'Profile photo removed.' });
}
