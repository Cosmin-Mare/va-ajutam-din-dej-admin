import type { NextApiRequest, NextApiResponse } from "next";
import { adminUpdateMember } from "@/lib/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const body = req.body as Record<string, unknown>;
  const id = Number(body.id);
  const { name, status, is_council, link } = body;

  if (Number.isNaN(id) || !name || !status || is_council === undefined) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const ok = await adminUpdateMember({
      id,
      name: String(name),
      status: String(status),
      is_council: Boolean(is_council),
      link: link == null ? "" : String(link),
    });
    if (!ok) {
      return res.status(404).json({ message: "Member not found" });
    }
    return res.status(200).json({ message: "Member updated successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error updating member" });
  }
}
