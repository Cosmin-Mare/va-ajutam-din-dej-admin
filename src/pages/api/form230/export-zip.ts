import type { NextApiRequest, NextApiResponse } from "next";
import JSZip from "jszip";
import { adminGetForm230Many } from "@/lib/firestore-form230";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const body = req.body as { ids?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === "string") : [];
  if (ids.length === 0) return res.status(400).json({ message: "Selectează formularele." });

  try {
    const rows = await adminGetForm230Many(ids);
    const zip = new JSZip();
    const missing: string[] = [];
    const usedNames = new Set<string>();
    for (const row of rows) {
      if (!row.pdfBase64) {
        missing.push(`${row.nume} ${row.prenume}`);
        continue;
      }
      let base = `${row.nume}_${row.prenume}_${row.cnp.slice(-4)}`.replace(/[^\w\-.]+/g, "_");
      let name = `${base}.pdf`;
      let i = 2;
      while (usedNames.has(name)) {
        name = `${base}_${i}.pdf`;
        i += 1;
      }
      usedNames.add(name);
      zip.file(name, Buffer.from(row.pdfBase64, "base64"));
    }
    if (missing.length) {
      zip.file("lipsa-pdf.txt", `Fără PDF stocat:\n${missing.join("\n")}\n`);
    }
    const buf = await zip.generateAsync({ type: "nodebuffer" });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="formular230-pdf.zip"`);
    return res.status(200).send(buf);
  } catch (e) {
    console.error("[form230/export-zip]", e);
    return res.status(500).json({ message: "Internal server error" });
  }
}
