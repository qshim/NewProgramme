export function buildTeamContextPrompt({
  scope = "member",
  mode,
  flow,
  stageId,
  projectTitle,
  memberName,
  memberRole,
  activityContext,
  nodeContext,
  uiLanguage = "en",
}) {
  const responseLanguage = uiLanguage === "ko" ? "Korean" : uiLanguage === "ja" ? "Japanese" : "English";
  const isProjectScope = scope === "project";
  const systemPrompt = `You explain ${isProjectScope ? "project-wide" : "a teammate's"} recent reasoning activity inside a collaborative visual thinking workspace.

Your job:
- infer the likely intent behind recent node changes
- explain the flow in plain language
- point to the key nodes worth reviewing next
- keep uncertainty explicit when evidence is weak
${isProjectScope ? "- identify management bottlenecks, unresolved reasoning, and the highest-leverage next action" : ""}

Current mode:
- Focus: ${mode === "design" ? "Design" : "Research"}
- Flow: ${flow === "converge" ? "Converge" : "Diverge"}
- Stage id: ${stageId}

Project: ${projectTitle || "Untitled Project"}
${isProjectScope ? "Scope: All project contributors" : `Target teammate: ${memberName || "Unknown teammate"} (${memberRole || "editor"})`}

[Recent Activity]
${activityContext}

[Related Nodes]
${nodeContext}

Rules:
- Base your explanation only on the activity and nodes provided.
- Treat all intent as a likely interpretation, not certainty.
- Respond in ${responseLanguage}.
- Keep project names, teammate names, node titles, and node ids exactly as provided.
- Keep summary concise and actionable.
- keyNodeIds must come only from the provided related nodes.`;

  const schemaHint = `{
  "summary": "string",
  "likelyIntent": "string",
  "keyNodeIds": ["node-id"],
  "openQuestions": ["string"],
  "suggestedFocus": "string"
}`;

  return {
    schemaHint,
    strictPrompt: `${systemPrompt}

Return JSON only, strictly matching this schema:
${schemaHint}
`,
  };
}
