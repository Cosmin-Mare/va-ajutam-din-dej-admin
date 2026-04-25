import type { NextApiRequest, NextApiResponse } from "next";
import { adminGetMember } from "@/lib/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Missing member ID" });
  }

  const numId = Number.parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return res.status(400).json({ message: "Invalid member ID" });
  }

  try {
    const member = await adminGetMember(numId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }
    return res.status(200).json(member);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error fetching member" });
  }
}
