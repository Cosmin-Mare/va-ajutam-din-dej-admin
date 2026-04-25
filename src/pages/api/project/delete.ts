import type { NextApiRequest, NextApiResponse } from "next";
import { adminDeleteProject } from "@/lib/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Missing project ID" });
  }

  const numId = Number.parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return res.status(400).json({ message: "Invalid project ID" });
  }

  try {
    const ok = await adminDeleteProject(numId);
    if (!ok) {
      return res.status(404).json({ message: "Project not found" });
    }
    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error deleting project" });
  }
}
