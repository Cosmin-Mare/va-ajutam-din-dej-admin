import type { NextApiRequest, NextApiResponse } from "next";
import { FORM230_STATUS_LABEL } from "@/lib/form230-config";
import { adminGetForm230Many } from "@/lib/firestore-form230";
import { buildSimpleXlsx } from "@/lib/xlsx-simple";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const body = req.body as { ids?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === "string") : [];
  if (ids.length === 0) return res.status(400).json({ message: "Selectează formularele." });

  try {
    const rows = await adminGetForm230Many(ids);
    const headers = [
      "Status",
      "Data",
      "An fiscal",
      "Nume",
      "Prenume",
      "Initiala",
      "CNP",
      "Email",
      "Telefon",
      "Localitate",
      "Judet",
      "Strada",
      "Numar",
      "Durata (ani)",
      "Acord ANAF",
      "Newsletter",
    ];
    const data = rows.map((r) => [
      FORM230_STATUS_LABEL[r.status],
      r.createdAt.toLocaleString("ro-RO"),
      String(r.taxYear),
      r.nume,
      r.prenume,
      r.initiala,
      r.cnp,
      r.email,
      r.telefon,
      r.localitate,
      r.judet,
      r.strada,
      r.numar,
      r.durationYears,
      r.consentAnafShare ? "da" : "nu",
      r.consentNewsletter ? "da" : "nu",
    ]);
    const buf = await buildSimpleXlsx("Formular 230", headers, data);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="formular230-verificare.xlsx"`);
    return res.status(200).send(buf);
  } catch (e) {
    console.error("[form230/export-excel]", e);
    return res.status(500).json({ message: "Internal server error" });
  }
}
