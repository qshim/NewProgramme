import { getProjectGraph, saveProjectGraph } from "@/lib/thinkingMachine/projectStore";

export default async function handler(req, res) {
  const projectId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
  if (!projectId) return res.status(400).json({ error: "Missing project id" });

  if (req.method === "GET") {
    const payload = await getProjectGraph(projectId);
    if (!payload) {
      const timestamp = new Date().toISOString();
      return res.status(200).json({
        project: {
          id: projectId,
          title: "Untitled Project",
          createdAt: timestamp,
          updatedAt: timestamp,
          members: [],
        },
        graph: {
          nodes: [],
          edges: [],
          stage: "research-diverge",
          updatedAt: timestamp,
        },
        meetingMemory: {
          rawChunks: [],
          working: {
            activeIssueNodeIds: [],
            unresolvedQuestionNodeIds: [],
            recentDecisionNodeIds: [],
            repeatedIssueKeys: [],
            lastUpdatedAt: "",
          },
          executive: {
            currentDirection: "",
            unresolvedAreas: [],
            nextStepImplications: [],
            lastUpdatedAt: "",
          },
        },
      });
    }
    return res.status(200).json(payload);
  }

  if (req.method === "PUT") {
    const payload = await saveProjectGraph(projectId, req.body || {}, req.body?.actor || null);
    return res.status(200).json(payload);
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
