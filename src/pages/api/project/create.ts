import type { NextApiRequest, NextApiResponse } from "next";
import { adminCreateProject } from "@/lib/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { title, content, type } = req.body as Record<string, unknown>;
  const titleTrim =
    title != null && String(title).trim() !== "" ? String(title).trim() : "Proiect nou";
  const contentStr = content == null ? "" : String(content);
  const typeStr =
    type != null && String(type).trim() !== "" ? String(type).trim() : "p";

  try {
    const newId = await adminCreateProject({
      title: titleTrim,
      content: contentStr,
      type: typeStr,
    });
    return res.status(201).json({ message: "Project created successfully", id: newId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error creating project", error: String(e) });
  }
}
