export function buildHistoryContext(history) {
  if (!history?.length) return "No existing nodes.";
  return history
    .map((node) => {
      const nodeId = node?.id ?? "unknown";
      const data = node?.data ?? {};
      const title = typeof data.title === "string" ? data.title : "(unknown)";
      const category = data.category ?? "";
      const phase = data.phase ?? "";
      return `- ID: ${nodeId} | [${phase}/${category}] ${title}`;
    })
    .join("\n");
}

export function buildAttachedNodesContext(attachedNodes) {
  if (!Array.isArray(attachedNodes) || attachedNodes.length === 0) return "";
  const lines = attachedNodes
    .map((node) => {
      const nodeId = node?.id ?? "unknown";
      const title = typeof node?.title === "string" ? node.title : "(unknown)";
      const content = typeof node?.content === "string" ? node.content : "";
      const category = node?.category ?? "";
      const phase = node?.phase ?? "";
      const contentSuffix = content.trim() ? ` — ${content.trim()}` : "";
      return `- ID: ${nodeId} | [${phase}/${category}] ${title}${contentSuffix}`;
    })
    .filter(Boolean);
  return lines.length ? lines.join("\n") : "";
}

export function buildRelatedNodesContext(nodes) {
  if (!Array.isArray(nodes) || nodes.length === 0) return "No related nodes were provided.";
  return nodes
    .map((node) => {
      const nodeId = node?.id ?? "unknown";
      const title = node?.title || node?.data?.title || "(unknown)";
      const content = node?.content || node?.data?.content || "";
      const category = node?.category || node?.data?.category || "";
      const phase = node?.phase || node?.data?.phase || "";
      return `- ID: ${nodeId} | [${phase}/${category}] ${title}${content ? ` — ${content}` : ""}`;
    })
    .join("\n");
}

export function buildActivityContext(events) {
  if (!Array.isArray(events) || events.length === 0) return "No recent activity events.";
  return events
    .map((event) => {
      const type = event?.type || event?.actionType || "activity";
      const userName = event?.userName || event?.actorName || event?.userId || "Unknown teammate";
      const nodeTitle = event?.nodeTitle || event?.after?.title || event?.before?.title || "Untitled node";
      const nodeType = event?.nodeType || event?.after?.category || event?.before?.category || "";
      const beforeVisibility = event?.before?.visibility ? ` before=${event.before.visibility}` : "";
      const afterVisibility = event?.after?.visibility ? ` after=${event.after.visibility}` : "";
      const beforeContent = event?.before?.content ? ` prev="${event.before.content}"` : "";
      const afterContent = event?.after?.content ? ` next="${event.after.content}"` : "";
      return `- ${type} by ${userName} on [${nodeType}] ${nodeTitle}${beforeVisibility}${afterVisibility}${beforeContent}${afterContent}`;
    })
    .join("\n");
}

export function buildMeetingMemoryContext(meetingMemory = {}) {
  const executive = meetingMemory?.executive || {};
  const working = meetingMemory?.working || {};
  return [
    `Current direction: ${executive.currentDirection || "None"}`,
    `Unresolved areas: ${(executive.unresolvedAreas || []).join("; ") || "None"}`,
    `Next-step implications: ${(executive.nextStepImplications || []).join("; ") || "None"}`,
    `Active issue titles: ${(working.activeIssueTitles || []).join("; ") || "None"}`,
    `Unresolved questions: ${(working.unresolvedQuestions || []).join("; ") || "None"}`,
    `Decision candidates: ${(working.decisionCandidates || []).join("; ") || "None"}`,
    `Repeated issue keys: ${(working.repeatedIssueKeys || []).join("; ") || "None"}`,
  ].join("\n");
}
