import type { NextApiRequest, NextApiResponse } from "next";
import { validCNP } from "@/lib/cnp";
import { b230Filename, buildB230Xml } from "@/lib/b230-xml";
import { form230TaxYear } from "@/lib/form230-config";
import { adminGetForm230Many, adminSetForm230Status } from "@/lib/firestore-form230";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const body = req.body as {
    ids?: unknown;
    nrBorderou?: unknown;
    markIncluded?: unknown;
  };
  const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === "string") : [];
  if (ids.length === 0) return res.status(400).json({ message: "Selectează formularele valide." });

  try {
    const rows = await adminGetForm230Many(ids);
    if (rows.length === 0) return res.status(404).json({ message: "Niciun formular găsit." });
    const invalid = rows.filter((r) => !validCNP(r.cnp) || r.status === "cu_eroare");
    if (invalid.length) {
      return res.status(400).json({
        message: `${invalid.length} formular(e) au CNP invalid sau status „Cu eroare”. Scoate-le din selecție.`,
      });
    }
    const years = new Set(rows.map((r) => r.taxYear));
    if (years.size > 1) {
      return res.status(400).json({ message: "Selectează formulare din același an fiscal." });
    }
    const taxYear = rows[0]!.taxYear || form230TaxYear();
    const nrBorderou = typeof body.nrBorderou === "string" && body.nrBorderou.trim() ? body.nrBorderou.trim() : "1";
    const xml = buildB230Xml({ taxYear, nrBorderou, rows });
    if (body.markIncluded === true) {
      await adminSetForm230Status(
        rows.map((r) => r.id),
        "inclus_in_borderou"
      );
    }
    const filename = b230Filename();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(xml);
  } catch (e) {
    console.error("[form230/export-xml]", e);
    return res.status(500).json({ message: "Internal server error" });
  }
}
