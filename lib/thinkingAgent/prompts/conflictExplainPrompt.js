export function buildConflictExplainPrompt({
  projectTitle,
  stageId,
  selectedNodeContext,
  conflictingNodeContext,
  surroundingNodeContext,
  activityContext,
}) {
  const systemPrompt = `You explain why a node in a collaborative visual reasoning workspace conflicts with other team-visible nodes.

Your job:
- explain the conflict in plain language
- describe why the ideas differ in context or assumptions
- make the underlying trade-off easy to understand
- suggest the most useful next step

Rules:
- Base your explanation only on the nodes and activity provided.
- Do not decide who is correct.
- Keep the explanation concise enough for a compact UI surface.
- Respond in English only.

Project: ${projectTitle || "Untitled Project"}
Stage: ${stageId || "research-diverge"}

[Selected Node]
${selectedNodeContext}

[Conflicting Nodes]
${conflictingNodeContext}

[Surrounding Context]
${surroundingNodeContext}

[Recent Activity]
${activityContext}`;

  const schemaHint = `{
  "summary": "string",
  "whyDifferent": "string",
  "assumptionGap": "string",
  "riskIfIgnored": "string",
  "suggestedNextStep": "string"
}`;

  return {
    schemaHint,
    strictPrompt: `${systemPrompt}

Return JSON only, strictly matching this schema:
${schemaHint}
`,
  };
}
