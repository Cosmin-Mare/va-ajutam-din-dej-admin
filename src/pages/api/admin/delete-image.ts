import type { NextApiRequest, NextApiResponse } from "next";
import { isFirebaseConfigured } from "@/lib/firebase-admin";
import {
  loadMemberEntity,
  loadPostEntity,
  loadProjectEntity,
  loadSponsorPartnerEntity,
  setMemberPhotoField,
  setPostMediaFields,
  setProjectMediaFields,
  setSponsorPartnerLogoField,
} from "@/lib/firestore";
import { deleteObjectIfInBucket } from "@/lib/storage-admin";

type Entity = "post" | "project" | "member" | "sponsor_partner";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  if (!isFirebaseConfigured()) {
    return res.status(503).json({ message: "Firebase nu este configurat" });
  }

  const body = req.body as Record<string, unknown>;
  const entity = body.entity;
  if (
    entity !== "post" &&
    entity !== "project" &&
    entity !== "member" &&
    entity !== "sponsor_partner"
  ) {
    return res.status(400).json({ message: "entity invalid" });
  }
  const id = Number(body.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "id invalid" });
  }
  const field = String(body.field || "");

  try {
    if (entity === "post") {
      const post = await loadPostEntity(id);
      if (!post) return res.status(404).json({ message: "Post not found" });
      if (field === "thumbnail") {
        if (post.thumbnailUrl) await deleteObjectIfInBucket(post.thumbnailUrl);
        await setPostMediaFields(id, { thumbnailUrl: null });
        return res.status(200).json({ message: "ok" });
      }
      if (field === "gallery") {
        const url = String(body.url || "");
        if (!url) return res.status(400).json({ message: "Lipsește url pentru galerie" });
        if (!post.galleryUrls?.includes(url)) {
          return res.status(404).json({ message: "URL negăsit în galerie" });
        }
        await deleteObjectIfInBucket(url);
        const next = post.galleryUrls.filter((u) => u !== url);
        await setPostMediaFields(id, { galleryUrls: next });
        return res.status(200).json({ message: "ok" });
      }
      return res.status(400).json({ message: "field trebuie să fie thumbnail sau gallery" });
    }

    if (entity === "project") {
      const project = await loadProjectEntity(id);
      if (!project) return res.status(404).json({ message: "Project not found" });
      if (field === "thumbnail") {
        if (project.thumbnailUrl) await deleteObjectIfInBucket(project.thumbnailUrl);
        await setProjectMediaFields(id, { thumbnailUrl: null });
        return res.status(200).json({ message: "ok" });
      }
      if (field === "gallery") {
        const url = String(body.url || "");
        if (!url) return res.status(400).json({ message: "Lipsește url pentru galerie" });
        if (!project.galleryUrls?.includes(url)) {
          return res.status(404).json({ message: "URL negăsit în galerie" });
        }
        await deleteObjectIfInBucket(url);
        const next = (project.galleryUrls || []).filter((u) => u !== url);
        await setProjectMediaFields(id, { galleryUrls: next });
        return res.status(200).json({ message: "ok" });
      }
      return res.status(400).json({ message: "field trebuie să fie thumbnail sau gallery" });
    }

    if (entity === "sponsor_partner") {
      if (field && field !== "logo") {
        return res.status(400).json({ message: "Pentru sponsor/partener folosește field=logo" });
      }
      const sp = await loadSponsorPartnerEntity(id);
      if (!sp) return res.status(404).json({ message: "Sponsor/partener negăsit" });
      if (sp.logoUrl) await deleteObjectIfInBucket(sp.logoUrl);
      await setSponsorPartnerLogoField(id, null);
      return res.status(200).json({ message: "ok" });
    }

    if (field && field !== "photo") {
      return res.status(400).json({ message: "Pentru membru folosește field=photo" });
    }
    const member = await loadMemberEntity(id);
    if (!member) return res.status(404).json({ message: "Member not found" });
    if (member.photoUrl) await deleteObjectIfInBucket(member.photoUrl);
    await setMemberPhotoField(id, null);
    return res.status(200).json({ message: "ok" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Eroare la ștergere" });
  }
}
