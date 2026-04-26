import type { NextApiRequest, NextApiResponse } from "next";
import { adminListSponsorPartners } from "@/lib/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const rows = await adminListSponsorPartners();
    return res.status(200).json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal server error" });
  }
}
