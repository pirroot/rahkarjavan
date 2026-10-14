import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  region: 'default',
  endpoint: process.env.LIARA_ENDPOINT,
  credentials: {
    accessKeyId: process.env.LIARA_ACCESS_KEY ?? '',
    secretAccessKey: process.env.LIARA_SECRET_KEY ?? '',
  },
  forcePathStyle: true,
  requestHandler: {
    requestTimeout: 600_000,
    connectionTimeout: 10_000,
  },
} as never);

export const BUCKET = process.env.LIARA_BUCKET_NAME ?? '';
