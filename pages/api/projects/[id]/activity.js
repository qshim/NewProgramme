import { appendProjectActivity, getProjectActivity } from "@/lib/thinkingMachine/projectStore";

export default async function handler(req, res) {
  const projectId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
  if (!projectId) return res.status(400).json({ error: "Missing project id" });

  if (req.method === "GET") {
    const activity = await getProjectActivity(projectId);
    return res.status(200).json({ activity });
  }

  if (req.method === "POST") {
    const entry = await appendProjectActivity(projectId, req.body || {});
    return res.status(201).json({ entry });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
