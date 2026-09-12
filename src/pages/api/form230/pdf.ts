import type { NextApiRequest, NextApiResponse } from "next";
import { adminGetForm230 } from "@/lib/firestore-form230";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) return res.status(400).json({ message: "Missing id" });
  try {
    const row = await adminGetForm230(id);
    if (!row?.pdfBase64) return res.status(404).json({ message: "PDF lipsește" });
    const buf = Buffer.from(row.pdfBase64, "base64");
    const name = `${row.nume}_${row.prenume}`.replace(/[^\w\-.]+/g, "_") + ".pdf";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
    return res.status(200).send(buf);
  } catch (e) {
    console.error("[form230/pdf]", e);
    return res.status(500).json({ message: "Internal server error" });
  }
}
