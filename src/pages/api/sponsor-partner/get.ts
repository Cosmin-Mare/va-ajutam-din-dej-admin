import type { NextApiRequest, NextApiResponse } from "next";
import { adminGetSponsorPartner } from "@/lib/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
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
    const row = await adminGetSponsorPartner(numId);
    if (!row) {
      return res.status(404).json({ message: "Not found" });
    }
    return res.status(200).json(row);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error fetching" });
  }
}
