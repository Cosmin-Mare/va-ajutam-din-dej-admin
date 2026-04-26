import type { NextApiRequest, NextApiResponse } from "next";
import { adminCreatePost } from "@/lib/firestore";

function localISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { title, content, link, date } = req.body as Record<string, unknown>;
  const titleTrim = title != null && String(title).trim() !== "" ? String(title).trim() : "Postare nouă";
  const contentStr = content == null ? "" : String(content);
  const dateStr =
    date != null && String(date).trim() !== "" ? String(date).trim() : localISODate();

  try {
    const newId = await adminCreatePost({
      title: titleTrim,
      content: contentStr,
      link: link == null ? "" : String(link),
      date: dateStr,
    });
    return res.status(201).json({ message: "Post created successfully", id: newId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error creating post" });
  }
}
