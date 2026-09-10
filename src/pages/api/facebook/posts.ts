import type { NextApiRequest, NextApiResponse } from "next";
import { listFacebookPostsForAdmin } from "@/lib/facebook-sync";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const rawLimit = Number(Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit);
  const afterRaw = Array.isArray(req.query.after) ? req.query.after[0] : req.query.after;
  const limit = Number.isFinite(rawLimit) ? rawLimit : 15;

  try {
    const result = await listFacebookPostsForAdmin({
      limit,
      after: typeof afterRaw === "string" ? afterRaw : undefined,
    });
    return res.status(200).json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Nu am putut citi postările de pe Facebook.";
    console.error("[api/facebook/posts]", message);
    return res.status(500).json({ message });
  }
}
