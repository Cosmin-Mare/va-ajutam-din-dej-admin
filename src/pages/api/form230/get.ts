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
    if (!row) return res.status(404).json({ message: "Not found" });
    const { pdfBase64, ...rest } = row;
    return res.status(200).json({
      ...rest,
      createdAt: row.createdAt.toISOString(),
      hasPdf: Boolean(pdfBase64),
    });
  } catch (e) {
    console.error("[form230/get]", e);
    return res.status(500).json({ message: "Internal server error" });
  }
}
