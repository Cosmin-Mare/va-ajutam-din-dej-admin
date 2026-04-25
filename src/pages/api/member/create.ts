import type { NextApiRequest, NextApiResponse } from "next";
import { adminCreateMember } from "@/lib/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { name, status, is_council, link } = req.body as Record<string, unknown>;
  if (!name || !status || is_council === undefined) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const newId = await adminCreateMember({
      name: String(name),
      status: String(status),
      is_council: Boolean(is_council),
      link: link == null ? "" : String(link),
    });
    return res.status(201).json({ message: "Member created successfully", id: newId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error creating member" });
  }
}
