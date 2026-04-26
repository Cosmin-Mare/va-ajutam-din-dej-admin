import type { NextApiRequest, NextApiResponse } from "next";
import { adminCreateSponsorPartner } from "@/lib/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const body = req.body as { role?: unknown } | undefined;
  const r = body?.role;
  const role =
    r === "partner" || r === "sponsor" ? (r as "sponsor" | "partner") : undefined;

  try {
    const newId = await adminCreateSponsorPartner(
      role != null ? { role } : {}
    );
    return res.status(201).json({ message: "Created", id: newId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error creating" });
  }
}
