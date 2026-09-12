import type { NextApiRequest, NextApiResponse } from "next";
import { normalizeCnp, validCNP } from "@/lib/cnp";
import { FORM230_STATUSES, type Form230Status } from "@/lib/form230-config";
import { adminUpdateForm230 } from "@/lib/firestore-form230";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const body = req.body as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return res.status(400).json({ message: "Missing id" });

  const patch: Parameters<typeof adminUpdateForm230>[1] = {};
  if (typeof body.status === "string" && (FORM230_STATUSES as readonly string[]).includes(body.status)) {
    patch.status = body.status as Form230Status;
  }
  if (typeof body.errorNote === "string") patch.errorNote = body.errorNote;
  if (typeof body.nume === "string") patch.nume = body.nume.trim();
  if (typeof body.prenume === "string") patch.prenume = body.prenume.trim();
  if (typeof body.initiala === "string") patch.initiala = body.initiala.trim();
  if (typeof body.cnp === "string") {
    const cnp = normalizeCnp(body.cnp);
    if (!validCNP(cnp)) return res.status(400).json({ message: "CNP invalid" });
    patch.cnp = cnp;
  }
  if (typeof body.email === "string") patch.email = body.email.trim();
  if (typeof body.telefon === "string") patch.telefon = body.telefon.trim();
  if (typeof body.localitate === "string") patch.localitate = body.localitate.trim();
  if (typeof body.judet === "string") patch.judet = body.judet.trim();
  if (typeof body.strada === "string") patch.strada = body.strada.trim();
  if (typeof body.numar === "string") patch.numar = body.numar.trim();
  if (body.durationYears === "1" || body.durationYears === "2") patch.durationYears = body.durationYears;
  if (typeof body.consentAnafShare === "boolean") patch.consentAnafShare = body.consentAnafShare;

  try {
    const ok = await adminUpdateForm230(id, patch);
    if (!ok) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[form230/update]", e);
    return res.status(500).json({ message: "Internal server error" });
  }
}
