import { randomUUID } from "node:crypto";
import { getStorage } from "firebase-admin/storage";
import { getAdminApp, getFirebaseProjectId } from "@/lib/firebase-admin";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function storageRoot(): string {
  return (process.env.FIREBASE_STORAGE_ROOT?.trim() || "").replace(/^\/+|\/+$/g, "");
}

function withPrefix(relative: string): string {
  const root = storageRoot();
  const rel = relative.replace(/^\/+/, "");
  if (!root) return rel;
  return `${root}/${rel}`;
}

export function parseObjectPathFromDownloadUrl(
  url: string
): { bucket: string; objectPath: string } | null {
  const m = String(url).match(/\/v0\/b\/([^/]+)\/o\/([^?]+)/);
  if (!m) return null;
  return { bucket: m[1], objectPath: decodeURIComponent(m[2]) };
}

function buildDownloadUrl(bucket: string, objectPath: string, downloadToken: string): string {
  const encoded = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}?alt=media&token=${downloadToken}`;
}

async function resolveStorageBucketName(): Promise<string> {
  const projectId = getFirebaseProjectId();
  const app = getAdminApp();
  const storage = getStorage(app);
  const explicit = process.env.FIREBASE_STORAGE_BUCKET?.trim();
  const candidates = explicit
    ? [explicit]
    : [`${projectId}.firebasestorage.app`, `${projectId}.appspot.com`];

  for (const name of candidates) {
    const [ok] = await storage.bucket(name).exists();
    if (ok) return name;
  }

  const hint = explicit
    ? `FIREBASE_STORAGE_BUCKET=${explicit} was not found.`
    : `No default bucket. Set FIREBASE_STORAGE_BUCKET. Tried: ${candidates.join(", ")}.`;
  throw new Error(hint);
}

export type UploadResult = { downloadUrl: string; objectPath: string; bucket: string };

export async function uploadImageBuffer(
  objectPath: string,
  buffer: Buffer,
  contentType: string
): Promise<UploadResult> {
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("Fișierul depășește 8MB.");
  }
  if (!contentType.startsWith("image/")) {
    throw new Error("Sunt acceptate doar imagini.");
  }
  const bucketName = await resolveStorageBucketName();
  const fullPath = withPrefix(objectPath);
  const bucket = getStorage(getAdminApp()).bucket(bucketName);
  const file = bucket.file(fullPath);
  const downloadToken = randomUUID();
  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType,
      cacheControl: "public, max-age=31536000",
      metadata: { firebaseStorageDownloadToken: downloadToken },
    },
  });
  return {
    bucket: bucketName,
    objectPath: fullPath,
    downloadUrl: buildDownloadUrl(bucketName, fullPath, downloadToken),
  };
}

export async function deleteObjectIfInBucket(downloadUrl: string): Promise<void> {
  const parsed = parseObjectPathFromDownloadUrl(downloadUrl);
  if (!parsed) return;
  const expectedBucket = await resolveStorageBucketName();
  if (parsed.bucket !== expectedBucket) return;
  const bucket = getStorage(getAdminApp()).bucket(expectedBucket);
  try {
    await bucket.file(parsed.objectPath).delete({ ignoreNotFound: true });
  } catch {
    /* best-effort */
  }
}

export function safeExtFromFileName(name: string): string {
  const m = name.toLowerCase().match(/\.(webp|png|jpe?g|gif)$/);
  if (m) return m[0];
  return ".jpg";
}

export function contentTypeFromName(name: string, fallback: string): string {
  const n = name.toLowerCase();
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  return fallback.startsWith("image/") ? fallback : "image/jpeg";
}

export function parseBase64Payload(raw: string): { buffer: Buffer; contentType: string } {
  const trimmed = raw.trim();
  const m = trimmed.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (m) {
    const b64 = m[2]!.replace(/\s/g, "");
    return { buffer: Buffer.from(b64, "base64"), contentType: m[1] || "image/jpeg" };
  }
  return { buffer: Buffer.from(trimmed, "base64"), contentType: "image/jpeg" };
}
