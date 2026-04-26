import type { NextApiRequest, NextApiResponse } from "next";
import { adminCreateMember } from "@/lib/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { name, status, is_council, link } = req.body as Record<string, unknown>;
  const nameStr = name != null && String(name).trim() !== "" ? String(name).trim() : "Membru nou";
  const statusStr = status != null ? String(status) : "";
  const council =
    typeof is_council === "boolean"
      ? is_council
      : typeof is_council === "string"
        ? is_council === "1" || is_council.toLowerCase() === "true"
        : false;

  try {
    const newId = await adminCreateMember({
      name: nameStr,
      status: statusStr,
      is_council: council,
      link: link == null ? "" : String(link),
    });
    return res.status(201).json({ message: "Member created successfully", id: newId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error creating member" });
  }
}
