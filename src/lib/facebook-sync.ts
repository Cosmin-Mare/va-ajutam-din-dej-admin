import { FieldValue, getFirestore, type DocumentData } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase-admin";
import {
  facebookPageId,
  facebookPostImageUrls,
  facebookPostPermalink,
  fetchFacebookPagePostsPage,
  fetchFacebookPostById,
  type FacebookPost,
} from "@/lib/facebook";
import { uploadImageBuffer } from "@/lib/storage-admin";

export type FacebookAdminListItem = {
  id: string;
  title: string;
  excerpt: string;
  createdTime: string;
  permalink: string;
  picture: string | null;
  alreadySynced: boolean;
  sitePostId: number | null;
};

export type FacebookSyncResult = {
  created: number;
  skipped: number;
  createdIds: number[];
  errors: string[];
};

function postsCollection(): string {
  return process.env.FIRESTORE_POSTS_COLLECTION?.trim() || "posts";
}

function postThumbField(): string {
  return process.env.FIRESTORE_POST_THUMBNAIL_FIELD?.trim() || "thumbnailStorageUrl";
}

function postGalleryField(): string {
  return process.env.FIRESTORE_POST_GALLERY_FIELD?.trim() || "galleryStorageUrls";
}

function db() {
  return getFirestore(getAdminApp());
}

function isWeakTitleLine(line: string): boolean {
  const stripped = line
    .replace(/[#@][A-Za-z0-9_]+/g, "")
    .replace(/[\s.,!?„”"':;()\-–—]+/g, "");
  return stripped.length < 8;
}

export function titleFromFacebookMessage(message: string): string {
  const lines = message
    .split(/\r?\n/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const chosen = lines.find((line) => !isWeakTitleLine(line)) ?? lines[0] ?? "";
  if (!chosen) return "Noutate";
  if (chosen.length <= 90) return chosen;
  const cut = chosen.slice(0, 87);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > 40 ? cut.slice(0, sp) : cut).trim()}…`;
}

function numericPostIdFromGraphId(facebookPostId: string): string {
  return facebookPostId.includes("_") ? facebookPostId.split("_").pop() || facebookPostId : facebookPostId;
}

function contentFromFacebookPost(post: FacebookPost): string {
  const message = post.message?.trim() ?? "";
  if (message) return message;
  const story = post.story?.trim() ?? "";
  if (story) return story;
  return "Vezi postarea pe Facebook.";
}

function excerptFromContent(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= 220) return normalized;
  return `${normalized.slice(0, 217).trim()}…`;
}

function guessImageContentType(url: string, fallback: string): string {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".gif")) return "image/gif";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  return fallback || "image/jpeg";
}

function extForContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*,*/*;q=0.8" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const contentType = (res.headers.get("content-type") || "").split(";")[0]?.trim() || "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 32) return null;
    return { buffer: buf, contentType: guessImageContentType(url, contentType) };
  } catch {
    return null;
  }
}

async function uploadPostImages(
  sitePostId: number,
  imageUrls: string[]
): Promise<{ thumbnailUrl?: string; galleryUrls: string[] }> {
  const cap = Math.min(imageUrls.length, 10);
  const galleryUrls: string[] = [];
  let thumbnailUrl: string | undefined;

  for (let i = 0; i < cap; i++) {
    const src = imageUrls[i]!;
    const downloaded = await downloadImage(src);
    if (!downloaded) continue;
    const ext = extForContentType(downloaded.contentType);
    const name = i === 0 ? `facebook-thumb.${ext}` : `facebook-${i}.${ext}`;
    const uploaded = await uploadImageBuffer(`posts/${sitePostId}/${name}`, downloaded.buffer, downloaded.contentType);
    if (i === 0) thumbnailUrl = uploaded.downloadUrl;
    else galleryUrls.push(uploaded.downloadUrl);
  }

  return { thumbnailUrl, galleryUrls };
}

type ExistingPost = {
  docId: string;
  numericId: number;
  facebookPostId: string;
  facebookLink: string;
  title: string;
  date: Date;
};

function socialUrlFromDoc(data: DocumentData): string {
  const fb = data.facebookLink;
  const legacy = data.link;
  const pick = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v.trim() : "");
  return pick(fb) || pick(legacy);
}

function coerceDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof v === "object" && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate();
  }
  if (typeof v === "string" || typeof v === "number") return new Date(v);
  return new Date(0);
}

function existingFromDoc(docId: string, data: DocumentData): ExistingPost {
  const n = Number.parseInt(docId, 10);
  return {
    docId,
    numericId: Number.isNaN(n) ? 0 : n,
    facebookPostId: typeof data.facebookPostId === "string" ? data.facebookPostId : "",
    facebookLink: socialUrlFromDoc(data),
    title: String(data.title ?? ""),
    date: coerceDate(data.date),
  };
}

function normalizeTitle(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchExisting(existing: ExistingPost[], post: FacebookPost, permalink: string): ExistingPost | undefined {
  const numeric = numericPostIdFromGraphId(post.id);
  const incomingTitle = normalizeTitle(titleFromFacebookMessage(contentFromFacebookPost(post)));
  const incomingDate = new Date(post.created_time);
  return existing.find((row) => {
    if (row.facebookPostId && row.facebookPostId === post.id) return true;
    if (permalink && row.facebookLink && row.facebookLink === permalink) return true;
    if (numeric && row.facebookLink && row.facebookLink.includes(numeric)) return true;
    if (
      incomingTitle &&
      normalizeTitle(row.title) === incomingTitle &&
      Math.abs(row.date.getTime() - incomingDate.getTime()) < 72 * 3600 * 1000
    ) {
      return true;
    }
    return false;
  });
}

async function loadExistingPosts(): Promise<ExistingPost[]> {
  const snap = await db().collection(postsCollection()).get();
  return snap.docs.map((d) => existingFromDoc(d.id, d.data()));
}

function toListItem(post: FacebookPost, existing: ExistingPost[]): FacebookAdminListItem {
  const permalink = facebookPostPermalink(post);
  const content = contentFromFacebookPost(post);
  const match = matchExisting(existing, post, permalink);
  return {
    id: post.id,
    title: titleFromFacebookMessage(content),
    excerpt: excerptFromContent(content),
    createdTime: post.created_time,
    permalink,
    picture: post.full_picture || facebookPostImageUrls(post)[0] || null,
    alreadySynced: Boolean(match),
    sitePostId: match?.numericId && match.numericId > 0 ? match.numericId : match ? Number(match.docId) || null : null,
  };
}

export async function listFacebookPostsForAdmin(opts: {
  limit?: number;
  after?: string;
}): Promise<{ posts: FacebookAdminListItem[]; nextCursor: string | null }> {
  const [page, existing] = await Promise.all([
    fetchFacebookPagePostsPage({ limit: opts.limit, after: opts.after }),
    loadExistingPosts(),
  ]);
  return {
    posts: page.posts.map((post) => toListItem(post, existing)),
    nextCursor: page.nextCursor,
  };
}

export async function importSelectedFacebookPosts(ids: string[]): Promise<FacebookSyncResult> {
  const unique: string[] = [];
  const seen: Record<string, true> = {};
  for (const raw of ids) {
    const id = raw.trim();
    if (!id || seen[id]) continue;
    seen[id] = true;
    unique.push(id);
    if (unique.length >= 8) break;
  }
  const result: FacebookSyncResult = {
    created: 0,
    skipped: 0,
    createdIds: [],
    errors: [],
  };
  if (unique.length === 0) return result;

  const existing = await loadExistingPosts();
  let nextId = existing.reduce((max, row) => Math.max(max, row.numericId), 0) + 1;

  for (const id of unique) {
    try {
      const post = await fetchFacebookPostById(id);
      const permalink = facebookPostPermalink(post);
      const match = matchExisting(existing, post, permalink);
      if (match) {
        result.skipped += 1;
        continue;
      }

      const title = titleFromFacebookMessage(contentFromFacebookPost(post));
      const content = contentFromFacebookPost(post);
      const siteId = nextId;
      const payload: Record<string, unknown> = {
        title,
        content,
        date: new Date(post.created_time),
        facebookLink: permalink,
        facebookPostId: post.id,
        facebookPageId: facebookPageId(),
        importedFrom: "facebook",
        facebookSyncedAt: FieldValue.serverTimestamp(),
      };
      const images = facebookPostImageUrls(post);
      if (images.length > 0) {
        const media = await uploadPostImages(siteId, images);
        if (media.thumbnailUrl) payload[postThumbField()] = media.thumbnailUrl;
        if (media.galleryUrls.length > 0) payload[postGalleryField()] = media.galleryUrls;
      }
      await db().collection(postsCollection()).doc(String(siteId)).set(payload);

      existing.push({
        docId: String(siteId),
        numericId: siteId,
        facebookPostId: post.id,
        facebookLink: permalink,
        title,
        date: new Date(post.created_time),
      });
      result.created += 1;
      result.createdIds.push(siteId);
      nextId += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      result.errors.push(`${id}: ${msg}`);
    }
  }

  return result;
}
