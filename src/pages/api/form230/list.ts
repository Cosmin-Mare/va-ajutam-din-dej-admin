import type { NextApiRequest, NextApiResponse } from "next";
import { form230TaxYear, FORM230_STATUSES, type Form230Status } from "@/lib/form230-config";
import { adminListForm230 } from "@/lib/firestore-form230";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const taxRaw = typeof req.query.taxYear === "string" ? req.query.taxYear : "";
  const taxYear = /^\d{4}$/.test(taxRaw) ? Number(taxRaw) : form230TaxYear();
  const statusRaw = typeof req.query.status === "string" ? req.query.status : "all";
  const status =
    statusRaw === "all"
      ? "all"
      : (FORM230_STATUSES as readonly string[]).includes(statusRaw)
        ? (statusRaw as Form230Status)
        : "all";
  try {
    const rows = await adminListForm230({ taxYear, status });
    return res.status(200).json({ taxYear, rows });
  } catch (e) {
    console.error("[form230/list]", e);
    return res.status(500).json({ message: "Internal server error" });
  }
}
