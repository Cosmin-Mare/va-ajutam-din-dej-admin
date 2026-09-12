import type { NextApiRequest, NextApiResponse } from "next";
import { FORM230_STATUSES, type Form230Status } from "@/lib/form230-config";
import { adminSetForm230Status } from "@/lib/firestore-form230";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const body = req.body as { ids?: unknown; status?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === "string") : [];
  const status = typeof body.status === "string" ? body.status : "";
  if (ids.length === 0) return res.status(400).json({ message: "Selectează cel puțin un formular." });
  if (!(FORM230_STATUSES as readonly string[]).includes(status)) {
    return res.status(400).json({ message: "Status invalid" });
  }
  try {
    const n = await adminSetForm230Status(ids, status as Form230Status);
    return res.status(200).json({ ok: true, updated: n });
  } catch (e) {
    console.error("[form230/status]", e);
    return res.status(500).json({ message: "Internal server error" });
  }
}
