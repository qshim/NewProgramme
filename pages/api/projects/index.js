import { createProject, listProjects } from "@/lib/thinkingMachine/projectStore";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const currentUserId = Array.isArray(req.query?.currentUserId) ? req.query.currentUserId[0] : req.query?.currentUserId;
    const query = Array.isArray(req.query?.query) ? req.query.query[0] : req.query?.query;
    const scope = Array.isArray(req.query?.scope) ? req.query.scope[0] : req.query?.scope;
    const projects = await listProjects({
      currentUserId,
      query,
      scope,
    });
    return res.status(200).json({ projects });
  }

  if (req.method === "POST") {
    const project = await createProject(req.body || {});
    return res.status(201).json({ project });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
