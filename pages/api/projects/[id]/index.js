import { getProject, updateProject } from "@/lib/thinkingMachine/projectStore";

export default async function handler(req, res) {
  const projectId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
  if (!projectId) return res.status(400).json({ error: "Missing project id" });

  if (req.method === "GET") {
    const project = await getProject(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    return res.status(200).json({ project });
  }

  if (req.method === "PATCH") {
    const project = await updateProject(projectId, req.body || {});
    return res.status(200).json({ project });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
