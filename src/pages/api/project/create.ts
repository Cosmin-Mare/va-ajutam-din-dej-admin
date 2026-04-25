import type { NextApiRequest, NextApiResponse } from "next";
import { adminCreateProject } from "@/lib/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { title, content, type } = req.body as Record<string, unknown>;
  if (!title || !content || !type) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const newId = await adminCreateProject({
      title: String(title),
      content: String(content),
      type: String(type),
    });
    return res.status(201).json({ message: "Project created successfully", id: newId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error creating project", error: String(e) });
  }
}
