import type { NextApiRequest, NextApiResponse } from "next";
import { adminUpdateSponsorPartner } from "@/lib/firestore";

function parseRole(v: unknown): "sponsor" | "partner" | null {
  if (v === "sponsor" || v === "partner") return v;
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const body = req.body as Record<string, unknown>;
  const id = Number(body.id);
  const { name, websiteUrl, role, sortKey } = body;

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Missing id" });
  }
  const r = parseRole(role);
  if (r == null) {
    return res.status(400).json({ message: "Rol invalid (sponsor sau partener)" });
  }
  const sk =
    typeof sortKey === "number"
      ? sortKey
      : typeof sortKey === "string" && sortKey.trim() !== ""
        ? Number.parseFloat(sortKey)
        : Number.NaN;
  if (Number.isNaN(sk)) {
    return res.status(400).json({ message: "Ordine invalidă" });
  }

  try {
    const ok = await adminUpdateSponsorPartner({
      id,
      name: name == null ? "" : String(name),
      websiteUrl: websiteUrl == null ? "" : String(websiteUrl),
      role: r,
      sortKey: sk,
    });
    if (!ok) {
      return res.status(404).json({ message: "Not found" });
    }
    return res.status(200).json({ message: "Updated" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error updating" });
  }
}
