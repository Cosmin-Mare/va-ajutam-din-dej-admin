import type { NextApiRequest, NextApiResponse } from "next";
import { importSelectedFacebookPosts } from "@/lib/facebook-sync";

export const config = {
  maxDuration: 60,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.filter((id: unknown) => typeof id === "string")
    : [];

  if (ids.length === 0) {
    return res.status(400).json({ message: "Selectează cel puțin o postare." });
  }
  if (ids.length > 8) {
    return res.status(400).json({ message: "Importă cel mult 8 postări odată." });
  }

  try {
    const result = await importSelectedFacebookPosts(ids);
    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Importul a eșuat.";
    console.error("[api/facebook/sync]", message);
    return res.status(500).json({ message });
  }
}
