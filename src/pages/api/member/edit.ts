import type { NextApiRequest, NextApiResponse } from "next";
import { adminUpdateMember } from "@/lib/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const body = req.body as Record<string, unknown>;
  const id = Number(body.id);
  const { name, status, is_council, link } = body;

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const council =
    typeof is_council === "boolean"
      ? is_council
      : typeof is_council === "string"
        ? is_council === "1" || is_council.toLowerCase() === "true"
        : false;

  try {
    const ok = await adminUpdateMember({
      id,
      name: name == null ? "" : String(name),
      status: status == null ? "" : String(status),
      is_council: council,
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
