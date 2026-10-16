import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import crypto from 'crypto';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.R2_ACCESS_KEY_ID,
    secretAccessKey: config.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

export async function createPresignedUploadUrl({
  bucket = config.R2_BUCKET_PRIVATE,
  prefix = 'uploads',
  extension = 'bin',
  contentType = 'application/octet-stream',
  expiresIn = 900,
}: {
  bucket?: string;
  prefix?: string;
  extension?: string;
  contentType?: string;
  expiresIn?: number;
}): Promise<{ uploadUrl: string; key: string }> {
  const randomKey = `${prefix}/${crypto.randomUUID()}.${extension}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: randomKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });
    return { uploadUrl, key: randomKey };
  } catch (err) {
    // If running in development without valid R2 credentials, provide a mock dev upload URL
    console.warn('R2 presign fallback for local dev:', err);
    return {
      uploadUrl: `${config.API_URL}/api/uploads/dev-mock-upload?key=${encodeURIComponent(randomKey)}`,
      key: randomKey,
    };
  }
}

export async function createSignedPlaybackUrl(
  key: string,
  bucket = config.R2_BUCKET_PRIVATE,
  expiresIn = config.R2_SIGNED_URL_TTL_SECONDS
): Promise<string> {
  if (!key) return '';

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return await getSignedUrl(r2Client, command, { expiresIn });
  } catch (err) {
    // If mock or demo asset
    console.warn('R2 playback presign fallback:', err);
    // Return direct or mock stream URL
    return `${config.API_URL}/api/public/media/stream?key=${encodeURIComponent(key)}`;
  }
}
