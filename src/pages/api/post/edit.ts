import type { NextApiRequest, NextApiResponse } from "next";
import { adminUpdatePost } from "@/lib/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const body = req.body as Record<string, unknown>;
  const id = Number(body.id);
  const { title, content, link, date } = body;

  if (Number.isNaN(id) || !title || !content || !date) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const ok = await adminUpdatePost({
      id,
      title: String(title),
      content: String(content),
      link: link == null ? "" : String(link),
      date: String(date),
    });
    if (!ok) {
      return res.status(404).json({ message: "Post not found" });
    }
    return res.status(200).json({ message: "Post updated successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error updating post" });
  }
}
