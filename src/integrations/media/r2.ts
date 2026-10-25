import "server-only";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getMediaConfig } from "@/lib/config/env.server";
import { HttpError } from "@/lib/http/errors";
import { imageSignatureMatches } from "@/modules/gallery/schema";

function storage() {
  const config = getMediaConfig();
  const client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.R2_ACCESS_KEY_ID,
      secretAccessKey: config.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
    maxAttempts: 1,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    requestHandler: { connectionTimeout: 3000, requestTimeout: 8000 },
  });
  return { client, config };
}
const unavailable = () =>
  new HttpError(
    503,
    "PROVIDER_UNAVAILABLE",
    "Photo storage is temporarily unavailable. Please try again.",
  );
export async function presignObject(
  stagingKey: string,
  mimeType: string,
  sizeBytes: number,
) {
  const { client, config } = storage();
  try {
    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: config.R2_BUCKET_NAME,
        Key: stagingKey,
        ContentType: mimeType,
        ContentLength: sizeBytes,
        IfNoneMatch: "*",
      }),
      {
        expiresIn: 300,
        signableHeaders: new Set([
          "content-type",
          "content-length",
          "if-none-match",
        ]),
      },
    );
    return {
      uploadUrl,
      expiresInSeconds: 300,
      requiredHeaders: { "Content-Type": mimeType, "If-None-Match": "*" },
    };
  } catch {
    throw unavailable();
  } finally {
    client.destroy();
  }
}
export async function verifyAndCopy(
  stagingKey: string,
  objectKey: string,
  mimeType: string,
  sizeBytes: number,
) {
  const { client, config } = storage();
  try {
    const head = await client.send(
      new HeadObjectCommand({ Bucket: config.R2_BUCKET_NAME, Key: stagingKey }),
    );
    if (
      head.ContentLength !== sizeBytes ||
      sizeBytes > config.MAX_IMAGE_BYTES ||
      head.ContentType !== mimeType ||
      !head.ETag
    )
      throw new HttpError(
        400,
        "UPLOAD_INVALID",
        "The uploaded file does not match its declared type or size.",
      );
    const data = await client.send(
      new GetObjectCommand({
        Bucket: config.R2_BUCKET_NAME,
        Key: stagingKey,
        Range: "bytes=0-31",
        IfMatch: head.ETag,
      }),
    );
    const prefix = await data.Body?.transformToByteArray();
    if (!prefix || !imageSignatureMatches(prefix, mimeType))
      throw new HttpError(
        400,
        "UPLOAD_INVALID",
        "Upload a valid JPEG, PNG or WebP image.",
      );
    // Browsers can write only to staging. Stored gallery URLs never have a reusable PUT capability.
    await client.send(
      new CopyObjectCommand({
        Bucket: config.R2_BUCKET_NAME,
        Key: objectKey,
        CopySource: `${config.R2_BUCKET_NAME}/${stagingKey}`,
        CopySourceIfMatch: head.ETag,
        MetadataDirective: "REPLACE",
        ContentType: mimeType,
        CacheControl: "no-store",
        ContentDisposition: "inline",
      }),
    );
  } catch (e) {
    if (e instanceof HttpError) throw e;
    if (
      e &&
      typeof e === "object" &&
      "$metadata" in e &&
      (e.$metadata as { httpStatusCode?: number }).httpStatusCode === 404
    )
      throw new HttpError(
        409,
        "UPLOAD_NOT_FOUND",
        "The upload has not arrived yet. Retry uploading the photo.",
      );
    throw unavailable();
  } finally {
    client.destroy();
  }
}
export async function deleteObject(objectKey: string) {
  const { client, config } = storage();
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.R2_BUCKET_NAME,
        Key: objectKey,
      }),
    );
  } catch {
    throw unavailable();
  } finally {
    client.destroy();
  }
}
export function photoUrl(objectKey: string) {
  return `${getMediaConfig().MEDIA_CDN_BASE_URL}/${objectKey}`;
}
