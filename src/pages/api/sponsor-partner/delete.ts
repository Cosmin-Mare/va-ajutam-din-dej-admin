import type { NextApiRequest, NextApiResponse } from "next";
import { adminDeleteSponsorPartner } from "@/lib/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Missing ID" });
  }

  const numId = Number.parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  try {
    const ok = await adminDeleteSponsorPartner(numId);
    if (!ok) {
      return res.status(404).json({ message: "Not found" });
    }
    return res.status(200).json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error deleting" });
  }
}
