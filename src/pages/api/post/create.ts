import type { NextApiRequest, NextApiResponse } from "next";
import { adminCreatePost } from "@/lib/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { title, content, link, date } = req.body as Record<string, unknown>;
  if (!title || !content || !date) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    await adminCreatePost({
      title: String(title),
      content: String(content),
      link: link == null ? "" : String(link),
      date: String(date),
    });
    return res.status(201).json({ message: "Post created successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error creating post" });
  }
}
