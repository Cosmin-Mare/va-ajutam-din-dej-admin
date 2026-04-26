import {
  FieldValue,
  getFirestore,
  type DocumentData,
  type Timestamp,
} from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase-admin";
import type { Member, Post, Project } from "@/lib/types";

function postsCollection(): string {
  return process.env.FIRESTORE_POSTS_COLLECTION?.trim() || "posts";
}
function projectsCollection(): string {
  return process.env.FIRESTORE_PROJECTS_COLLECTION?.trim() || "projects";
}
function membersCollection(): string {
  return process.env.FIRESTORE_MEMBERS_COLLECTION?.trim() || "members";
}

function postThumbField(): string {
  return process.env.FIRESTORE_POST_THUMBNAIL_FIELD?.trim() || "thumbnailStorageUrl";
}
function postGalleryField(): string {
  return process.env.FIRESTORE_POST_GALLERY_FIELD?.trim() || "galleryStorageUrls";
}
function projectThumbField(): string {
  return process.env.FIRESTORE_PROJECT_THUMBNAIL_FIELD?.trim() || "thumbnailStorageUrl";
}
function projectGalleryField(): string {
  return process.env.FIRESTORE_PROJECT_GALLERY_FIELD?.trim() || "galleryStorageUrls";
}
function memberPhotoField(): string {
  return process.env.FIRESTORE_MEMBER_PHOTO_FIELD?.trim() || "photoStorageUrl";
}

function db() {
  return getFirestore(getAdminApp());
}

function coerceDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof v === "object" && "toDate" in v && typeof (v as Timestamp).toDate === "function") {
    return (v as Timestamp).toDate();
  }
  if (typeof v === "string" || typeof v === "number") return new Date(v);
  return new Date();
}

function coerceBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
  return false;
}

function socialUrlFromDoc(data: DocumentData): string {
  const fb = data.facebookLink;
  const legacy = data.link;
  const pick = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v.trim() : "");
  const a = pick(fb);
  if (a) return a;
  return pick(legacy);
}

function docToPost(id: string, data: DocumentData): Post {
  const thumbKey = postThumbField();
  const galleryKey = postGalleryField();
  const thumb = data[thumbKey];
  const gallery = data[galleryKey];
  return {
    id: Number(id),
    title: String(data.title ?? ""),
    content: String(data.content ?? ""),
    date: coerceDate(data.date),
    link: socialUrlFromDoc(data),
    thumbnailUrl: typeof thumb === "string" ? thumb : undefined,
    galleryUrls: Array.isArray(gallery)
      ? gallery.filter((u): u is string => typeof u === "string")
      : undefined,
  };
}

function docToProject(id: string, data: DocumentData): Project {
  const thumbKey = projectThumbField();
  const galleryKey = projectGalleryField();
  const thumb = data[thumbKey];
  const gallery = data[galleryKey];
  return {
    id: Number(id),
    title: String(data.title ?? ""),
    content: String(data.content ?? ""),
    type: (data.type as string) ?? "p",
    thumbnailUrl: typeof thumb === "string" ? thumb : undefined,
    galleryUrls: Array.isArray(gallery)
      ? gallery.filter((u): u is string => typeof u === "string")
      : undefined,
  };
}

function docToMember(id: string, data: DocumentData): Member {
  const photoKey = memberPhotoField();
  const photo = data[photoKey];
  return {
    id: Number(id),
    name: String(data.name ?? ""),
    status: String(data.status ?? ""),
    is_council: coerceBool(data.is_council ?? data.isCouncil),
    link: (() => {
      const u = socialUrlFromDoc(data);
      return u === "" ? null : u;
    })(),
    photoUrl: typeof photo === "string" ? photo : undefined,
  };
}

async function nextNumericDocId(collectionName: string): Promise<number> {
  const snap = await db().collection(collectionName).get();
  let max = 0;
  for (const d of snap.docs) {
    const n = Number.parseInt(d.id, 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

export type AdminPostRow = {
  id: number;
  title: string;
  content: string;
  date: string;
  link: string;
  thumbnailUrl?: string;
  galleryUrls?: string[];
};

export type AdminProjectRow = {
  id: number;
  title: string;
  content: string;
  type: string;
  thumbnailUrl?: string;
  galleryUrls?: string[];
};

export type AdminMemberRow = {
  id: number;
  name: string;
  status: string;
  is_council: boolean;
  link: string;
  photoUrl?: string;
};

function postToRow(p: Post): AdminPostRow {
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    date: p.date.toISOString(),
    link: p.link,
    thumbnailUrl: p.thumbnailUrl,
    galleryUrls: p.galleryUrls,
  };
}

function projectToRow(p: Project): AdminProjectRow {
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    type: String(p.type),
    thumbnailUrl: p.thumbnailUrl,
    galleryUrls: p.galleryUrls,
  };
}

function memberToRow(m: Member): AdminMemberRow {
  return {
    id: m.id,
    name: m.name,
    status: m.status,
    is_council: m.is_council,
    link: m.link ?? "",
    photoUrl: m.photoUrl,
  };
}

export async function adminListPosts(): Promise<AdminPostRow[]> {
  const snap = await db().collection(postsCollection()).get();
  const posts = snap.docs.map((d) => docToPost(d.id, d.data()));
  posts.sort((a, b) => b.date.getTime() - a.date.getTime());
  return posts.map(postToRow);
}

export async function adminGetPost(id: number): Promise<AdminPostRow | undefined> {
  const snap = await db().collection(postsCollection()).doc(String(id)).get();
  if (!snap.exists) return undefined;
  return postToRow(docToPost(snap.id, snap.data()!));
}

export async function adminCreatePost(input: {
  title: string;
  content: string;
  link: string;
  date: string;
}): Promise<number> {
  const id = await nextNumericDocId(postsCollection());
  const ref = db().collection(postsCollection()).doc(String(id));
  const trimmed = typeof input.link === "string" ? input.link.trim() : "";
  const payload: Record<string, unknown> = {
    title: input.title,
    content: input.content,
    date: new Date(input.date),
  };
  if (trimmed) payload.facebookLink = trimmed;
  await ref.set(payload);
  return id;
}

export async function adminUpdatePost(input: {
  id: number;
  title: string;
  content: string;
  link: string;
  date: string;
}): Promise<boolean> {
  const ref = db().collection(postsCollection()).doc(String(input.id));
  const snap = await ref.get();
  if (!snap.exists) return false;
  const trimmed = typeof input.link === "string" ? input.link.trim() : "";
  await ref.update({
    title: input.title,
    content: input.content,
    date: new Date(input.date),
    ...(trimmed === ""
      ? { facebookLink: FieldValue.delete(), link: FieldValue.delete() }
      : { facebookLink: trimmed, link: FieldValue.delete() }),
  });
  return true;
}

export async function adminDeletePost(id: number): Promise<boolean> {
  const ref = db().collection(postsCollection()).doc(String(id));
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

export async function adminListProjects(): Promise<AdminProjectRow[]> {
  const snap = await db().collection(projectsCollection()).get();
  const projects = snap.docs.map((d) => docToProject(d.id, d.data()));
  projects.sort((a, b) => a.id - b.id);
  return projects.map(projectToRow);
}

export async function adminGetProject(id: number): Promise<AdminProjectRow | undefined> {
  const snap = await db().collection(projectsCollection()).doc(String(id)).get();
  if (!snap.exists) return undefined;
  return projectToRow(docToProject(snap.id, snap.data()!));
}

export async function adminCreateProject(input: {
  title: string;
  content: string;
  type: string;
}): Promise<number> {
  const id = await nextNumericDocId(projectsCollection());
  await db()
    .collection(projectsCollection())
    .doc(String(id))
    .set({
      title: input.title,
      content: input.content,
      type: input.type,
    });
  return id;
}

export async function adminUpdateProject(input: {
  id: number;
  title: string;
  content: string;
  type: string;
}): Promise<boolean> {
  const ref = db().collection(projectsCollection()).doc(String(input.id));
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.update({
    title: input.title,
    content: input.content,
    type: input.type,
  });
  return true;
}

export async function adminDeleteProject(id: number): Promise<boolean> {
  const ref = db().collection(projectsCollection()).doc(String(id));
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

export async function adminListMembers(): Promise<AdminMemberRow[]> {
  const snap = await db().collection(membersCollection()).get();
  const members = snap.docs.map((d) => docToMember(d.id, d.data()));
  members.sort((a, b) => a.name.localeCompare(b.name, "ro"));
  return members.map(memberToRow);
}

export async function adminGetMember(id: number): Promise<AdminMemberRow | undefined> {
  const snap = await db().collection(membersCollection()).doc(String(id)).get();
  if (!snap.exists) return undefined;
  return memberToRow(docToMember(snap.id, snap.data()!));
}

export async function adminCreateMember(input: {
  name: string;
  status: string;
  is_council: boolean;
  link: string;
}): Promise<number> {
  const id = await nextNumericDocId(membersCollection());
  const linkTrim = typeof input.link === "string" ? input.link.trim() : "";
  const docBody: Record<string, unknown> = {
    name: input.name,
    status: input.status,
    is_council: input.is_council,
  };
  if (linkTrim) docBody.facebookLink = linkTrim;
  await db().collection(membersCollection()).doc(String(id)).set(docBody);
  return id;
}

export async function adminUpdateMember(input: {
  id: number;
  name: string;
  status: string;
  is_council: boolean;
  link: string;
}): Promise<boolean> {
  const ref = db().collection(membersCollection()).doc(String(input.id));
  const snap = await ref.get();
  if (!snap.exists) return false;
  const linkTrim = typeof input.link === "string" ? input.link.trim() : "";
  await ref.update({
    name: input.name,
    status: input.status,
    is_council: input.is_council,
    ...(linkTrim === ""
      ? { facebookLink: FieldValue.delete(), link: FieldValue.delete() }
      : { facebookLink: linkTrim, link: FieldValue.delete() }),
  });
  return true;
}

export async function adminDeleteMember(id: number): Promise<boolean> {
  const ref = db().collection(membersCollection()).doc(String(id));
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

export async function loadPostEntity(id: number): Promise<Post | undefined> {
  const snap = await db().collection(postsCollection()).doc(String(id)).get();
  if (!snap.exists) return undefined;
  return docToPost(snap.id, snap.data()!);
}

export async function loadProjectEntity(id: number): Promise<Project | undefined> {
  const snap = await db().collection(projectsCollection()).doc(String(id)).get();
  if (!snap.exists) return undefined;
  return docToProject(snap.id, snap.data()!);
}

export async function loadMemberEntity(id: number): Promise<Member | undefined> {
  const snap = await db().collection(membersCollection()).doc(String(id)).get();
  if (!snap.exists) return undefined;
  return docToMember(snap.id, snap.data()!);
}

export async function setPostMediaFields(id: number, data: { thumbnailUrl?: string | null; galleryUrls?: string[] }): Promise<boolean> {
  const ref = db().collection(postsCollection()).doc(String(id));
  const snap = await ref.get();
  if (!snap.exists) return false;
  const thumbK = postThumbField();
  const galleryK = postGalleryField();
  const patch: Record<string, unknown> = {};
  if ("thumbnailUrl" in data) {
    const v = data.thumbnailUrl;
    patch[thumbK] = v == null || v === "" ? FieldValue.delete() : v;
  }
  if (data.galleryUrls !== undefined) {
    patch[galleryK] = data.galleryUrls;
  }
  if (Object.keys(patch).length === 0) return true;
  await ref.update(patch);
  return true;
}

export async function setProjectMediaFields(
  id: number,
  data: { thumbnailUrl?: string | null; galleryUrls?: string[] }
): Promise<boolean> {
  const ref = db().collection(projectsCollection()).doc(String(id));
  const snap = await ref.get();
  if (!snap.exists) return false;
  const thumbK = projectThumbField();
  const galleryK = projectGalleryField();
  const patch: Record<string, unknown> = {};
  if ("thumbnailUrl" in data) {
    const v = data.thumbnailUrl;
    patch[thumbK] = v == null || v === "" ? FieldValue.delete() : v;
  }
  if (data.galleryUrls !== undefined) {
    patch[galleryK] = data.galleryUrls;
  }
  if (Object.keys(patch).length === 0) return true;
  await ref.update(patch);
  return true;
}

export async function setMemberPhotoField(id: number, url: string | null): Promise<boolean> {
  const ref = db().collection(membersCollection()).doc(String(id));
  const snap = await ref.get();
  if (!snap.exists) return false;
  const k = memberPhotoField();
  await ref.update({ [k]: url == null || url === "" ? FieldValue.delete() : url });
  return true;
}
