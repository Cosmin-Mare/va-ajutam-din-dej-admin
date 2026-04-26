import type { NextApiRequest, NextApiResponse } from "next";
import { isFirebaseConfigured } from "@/lib/firebase-admin";
import {
  loadMemberEntity,
  loadPostEntity,
  loadProjectEntity,
  setMemberPhotoField,
  setPostMediaFields,
  setProjectMediaFields,
} from "@/lib/firestore";
import {
  contentTypeFromName,
  deleteObjectIfInBucket,
  parseBase64Payload,
  safeExtFromFileName,
  uploadImageBuffer,
} from "@/lib/storage-admin";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "9mb",
    },
  },
};

type Entity = "post" | "project" | "member";
type MediaField = "thumbnail" | "gallery" | "photo";

function assertEntity(v: unknown): Entity {
  if (v === "post" || v === "project" || v === "member") return v;
  throw new Error("Tip invalid");
}

function assertField(v: unknown, entity: Entity): MediaField {
  if (v === "thumbnail" || v === "gallery" || v === "photo") {
    if (entity === "member" && v !== "photo") {
      throw new Error("Pentru membri, folosește field=photo");
    }
    if (entity !== "member" && v === "photo") {
      throw new Error("field=photo e doar pentru membri");
    }
    if (v === "gallery" && entity === "member") {
      throw new Error("Galeria nu se aplică membrilor");
    }
    return v;
  }
  throw new Error("field invalid");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  if (!isFirebaseConfigured()) {
    return res.status(503).json({ message: "Firebase nu este configurat" });
  }

  const body = req.body as Record<string, unknown>;
  let entity: Entity;
  let field: MediaField;
  let id: number;
  let fileName: string;
  let dataBase64: string;
  try {
    entity = assertEntity(body.entity);
    field = assertField(body.field, entity);
    id = Number(body.id);
    if (Number.isNaN(id)) throw new Error("id invalid");
    fileName = String(body.fileName || "image.jpg");
    dataBase64 = String(body.dataBase64 || "");
  } catch (e) {
    return res.status(400).json({ message: e instanceof Error ? e.message : "Cerere invalidă" });
  }

  if (!dataBase64) {
    return res.status(400).json({ message: "Lipsește conținutul fișierului" });
  }

  let buf: Buffer;
  let contentType: string;
  try {
    const p = parseBase64Payload(dataBase64);
    buf = p.buffer;
    contentType = contentTypeFromName(fileName, p.contentType);
  } catch {
    return res.status(400).json({ message: "Base64 invalid" });
  }
  const ext = safeExtFromFileName(fileName);

  try {
    if (entity === "post") {
      const post = await loadPostEntity(id);
      if (!post) return res.status(404).json({ message: "Post not found" });

      if (field === "thumbnail") {
        if (post.thumbnailUrl) await deleteObjectIfInBucket(post.thumbnailUrl);
        const { downloadUrl } = await uploadImageBuffer(`posts/${id}/thumbnail${ext}`, buf, contentType);
        await setPostMediaFields(id, { thumbnailUrl: downloadUrl });
        return res.status(201).json({ downloadUrl, field: "thumbnail" });
      }
      const gallery = post.galleryUrls ? [...post.galleryUrls] : [];
      const n = gallery.length;
      const { downloadUrl } = await uploadImageBuffer(`posts/${id}/${n}${ext}`, buf, contentType);
      gallery.push(downloadUrl);
      await setPostMediaFields(id, { galleryUrls: gallery });
      return res.status(201).json({ downloadUrl, field: "gallery" });
    }

    if (entity === "project") {
      const project = await loadProjectEntity(id);
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (field === "thumbnail") {
        if (project.thumbnailUrl) await deleteObjectIfInBucket(project.thumbnailUrl);
        const { downloadUrl } = await uploadImageBuffer(`projects/${id}/thumbnail${ext}`, buf, contentType);
        await setProjectMediaFields(id, { thumbnailUrl: downloadUrl });
        return res.status(201).json({ downloadUrl, field: "thumbnail" });
      }
      const gallery = project.galleryUrls ? [...project.galleryUrls] : [];
      const n = gallery.length;
      const { downloadUrl } = await uploadImageBuffer(`projects/${id}/${n}${ext}`, buf, contentType);
      gallery.push(downloadUrl);
      await setProjectMediaFields(id, { galleryUrls: gallery });
      return res.status(201).json({ downloadUrl, field: "gallery" });
    }

    const member = await loadMemberEntity(id);
    if (!member) return res.status(404).json({ message: "Member not found" });
    if (member.photoUrl) await deleteObjectIfInBucket(member.photoUrl);
    const { downloadUrl } = await uploadImageBuffer(`members/${id}/photo${ext}`, buf, contentType);
    await setMemberPhotoField(id, downloadUrl);
    return res.status(201).json({ downloadUrl, field: "photo" });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ message: e instanceof Error ? e.message : "Eroare la încărcare" });
  }
}
