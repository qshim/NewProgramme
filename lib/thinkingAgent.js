import OpenAI from "openai";
import { z } from "zod";
import { randomUUID } from "crypto";
import {
  getReasoningModeProfile,
  normalizeConfidence,
  normalizeNodeCategory,
  normalizeOwnerId,
  normalizeNodePhase,
  normalizeReasoningStage,
  normalizeRelationLabel,
  normalizeSuggestionTags,
  normalizeSourceType,
  normalizeVisibility,
} from "@/lib/thinkingMachine/nodeMeta";
import {
  AIAnalysisResultSchema,
  ChatMessageSchema,
  ChatNodeResultSchema,
  ConflictExplainSummarySchema,
  MeetingChunkResultSchema,
  TeamContextSummarySchema,
} from "@/lib/thinkingAgent/schemas";
import {
  buildActivityContext,
  buildAttachedNodesContext,
  buildHistoryContext,
  buildMeetingMemoryContext,
  buildRelatedNodesContext,
} from "@/lib/thinkingAgent/contextBuilders";
import { createJsonCompletion, repairToSchema } from "@/lib/thinkingAgent/openaiJson";
import { calculatePosition, toEdge, toNode } from "@/lib/thinkingAgent/graphDtos";
import {
  inferMeetingConfidence,
  inferMeetingVisibility,
  normalizeCategory,
  normalizeChatMessages,
  normalizeCrossConnections,
  normalizeMeetingOperation,
  normalizePhase,
  normalizeConflictExplainSummary,
  normalizeStage,
  normalizeTeamContextSummary,
  normalizeUserNodes,
  toRepeatedIssueKey,
} from "@/lib/thinkingAgent/normalizers";
import { buildProcessIdeaPrompt } from "@/lib/thinkingAgent/prompts/processIdeaPrompt";
import { buildChatToNodesPrompt } from "@/lib/thinkingAgent/prompts/chatToNodesPrompt";
import { buildMeetingIngestPrompt } from "@/lib/thinkingAgent/prompts/meetingIngestPrompt";
import { buildTeamContextPrompt } from "@/lib/thinkingAgent/prompts/teamContextPrompt";
import { buildConflictExplainPrompt } from "@/lib/thinkingAgent/prompts/conflictExplainPrompt";

function stripCodeFences(text) {
  if (typeof text !== "string") return "";
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function safeJsonParse(text) {
  const cleaned = stripCodeFences(text);
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(cleaned.slice(first, last + 1));
    }
    throw new Error("Model did not return valid JSON.");
  }
}

function pickFirstDefined(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function normalizeEnum(value, allowed, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  const direct = allowed.find((a) => a === trimmed);
  if (direct) return direct;
  const lower = trimmed.toLowerCase();
  const found = allowed.find((a) => a.toLowerCase() === lower);
  return found ?? fallback;
}

function normalizeAnalysisResult(raw, stage) {
  const user_nodes_all = normalizeUserNodes(
    pickFirstDefined(raw?.user_nodes, raw?.userNodes, raw?.nodes, raw?.userNodesList)
  );

  const suggestion_label = pickFirstDefined(
    raw?.suggestion_label,
    raw?.suggestionLabel,
    raw?.suggestion_title,
    raw?.suggestionTitle
  );
  const suggestion_content = pickFirstDefined(
    raw?.suggestion_content,
    raw?.suggestionContent,
    raw?.suggestion_body,
    raw?.suggestionBody
  );
  const suggestion_category = normalizeCategory(
    pickFirstDefined(raw?.suggestion_category, raw?.suggestionCategory)
  );
  const suggestion_phase = normalizePhase(
    pickFirstDefined(raw?.suggestion_phase, raw?.suggestionPhase),
    suggestion_category
  );
  let suggestion_connects_to_index = pickFirstDefined(
    raw?.suggestion_connects_to_index,
    raw?.suggestionConnectsToIndex,
    raw?.suggestion_connects_to,
    raw?.suggestionConnectsTo
  );
  suggestion_connects_to_index = Number.isFinite(suggestion_connects_to_index)
    ? Number(suggestion_connects_to_index)
    : 0;

  const connection_label =
    (typeof raw?.connection_label === "string" && raw.connection_label) ||
    (typeof raw?.connectionLabel === "string" && raw.connectionLabel) ||
    "proposes";

  const cross_connections = normalizeCrossConnections(
    pickFirstDefined(raw?.cross_connections, raw?.crossConnections, raw?.crossConnectionsList)
  );

  // Enforce hard caps so Zod schema (max 4 user_nodes, max 3 cross_connections)
  // is always satisfied even if the model returns more.
  const user_nodes = user_nodes_all.slice(0, 4);
  const limited_cross_connections = cross_connections.slice(0, 3);

  // Fill suggestion defaults if missing (keep app functional)
  const mainIdx =
    user_nodes.length > 0
      ? Math.min(Math.max(0, suggestion_connects_to_index), user_nodes.length - 1)
      : 0;
  const mainNode = user_nodes[mainIdx] ?? null;

  const finalSuggestionLabel =
    (typeof suggestion_label === "string" && suggestion_label.trim()) ||
    (mainNode ? `${mainNode.label} extension` : "Idea extension");
  const finalSuggestionContent =
    (typeof suggestion_content === "string" && suggestion_content.trim()) ||
    (mainNode
      ? `To make "${mainNode.content}" more concrete, what constraints, assumptions, and resources are needed?`
      : "To develop this idea further, let's clarify key assumptions, constraints, and resources.");

  const finalSuggestionCategory = mainNode ? normalizeCategory(mainNode.category) : suggestion_category;
  const finalSuggestionPhase = mainNode
    ? normalizePhase(mainNode.phase, mainNode.category)
    : normalizePhase(suggestion_phase, finalSuggestionCategory);
  const finalSuggestionTags = normalizeSuggestionTags(
    pickFirstDefined(raw?.suggestion_tags, raw?.suggestionTags, raw?.tags),
    {
      category: finalSuggestionCategory,
      sourceType: "agent",
      phase: finalSuggestionPhase,
      title: finalSuggestionLabel,
      content: finalSuggestionContent,
    }
  );

  const normalized = {
    user_nodes,
    suggestion_label: finalSuggestionLabel,
    suggestion_content: finalSuggestionContent,
    suggestion_category: finalSuggestionCategory,
    suggestion_phase: finalSuggestionPhase,
    suggestion_tags: finalSuggestionTags,
    suggestion_connects_to_index: mainIdx,
    connection_label,
    cross_connections: limited_cross_connections,
  };

  return enrichAnalysisResult(normalized, stage);
}

function normalizeChatNodeResult(raw, stage) {
  const user_nodes_all = normalizeUserNodes(
    pickFirstDefined(raw?.user_nodes, raw?.userNodes, raw?.nodes)
  );
  const cross_connections_all = normalizeCrossConnections(
    pickFirstDefined(raw?.cross_connections, raw?.crossConnections)
  );
  // Align with ChatNodeResultSchema: at most 4 nodes and 3 cross connections.
  const normalized = {
    user_nodes: user_nodes_all.slice(0, 4),
    cross_connections: cross_connections_all.slice(0, 3),
  };
  return enrichChatNodeResult(normalized, stage);
}

function normalizeMeetingUnits(rawUnits = []) {
  if (!Array.isArray(rawUnits)) return [];
  return rawUnits
    .map((unit) => {
      const category = normalizeCategory(unit?.category);
      const operation = normalizeMeetingOperation(unit?.operation);
      return {
        label: typeof unit?.label === "string" ? unit.label : "",
        content: typeof unit?.content === "string" ? unit.content : "",
        category,
        phase: normalizePhase(unit?.phase, category),
        ownerId: typeof unit?.ownerId === "string" && unit.ownerId.trim() ? unit.ownerId : "mock-user-1",
        sourceType: normalizeSourceType(unit?.sourceType || "mixed"),
        visibility: normalizeVisibility(unit?.visibility || inferMeetingVisibility(category, operation)),
        confidence: normalizeConfidence(unit?.confidence || inferMeetingConfidence(category, operation)),
        operation,
        existing_node_id: typeof unit?.existing_node_id === "string" ? unit.existing_node_id : "",
        relation_label: normalizeRelationLabel(unit?.relation_label || (operation === "contradict" ? "contradicts" : operation === "strengthen" ? "supports" : "refines")),
        repeated_issue_key: typeof unit?.repeated_issue_key === "string" && unit.repeated_issue_key.trim()
          ? unit.repeated_issue_key.trim()
          : toRepeatedIssueKey(unit?.label || unit?.content),
      };
    })
    .filter((unit) => unit.label.trim() && unit.content.trim());
}

function normalizeMeetingChunkResult(raw = {}, stage) {
  const units = normalizeMeetingUnits(pickFirstDefined(raw?.units, raw?.meeting_units, raw?.reasoning_units));
  const classifiedUnits = rebalanceNodeCategories(
    units.map((unit) => ({
      ...unit,
      category: classifyNodeHeuristic(unit),
      phase: normalizePhase(unit?.phase, classifyNodeHeuristic(unit)),
    })),
    stage
  ).map((unit, index) => ({
    ...units[index],
    category: normalizeCategory(unit?.category),
    phase: normalizePhase(unit?.phase, unit?.category),
  }));

  return {
    chunk_summary:
      typeof raw?.chunk_summary === "string" && raw.chunk_summary.trim()
        ? raw.chunk_summary.trim()
        : "The latest meeting input was added to the decision memory.",
    units: classifiedUnits.slice(0, 5),
    working_memory: {
      active_issue_titles: Array.isArray(raw?.working_memory?.active_issue_titles)
        ? raw.working_memory.active_issue_titles.filter((value) => typeof value === "string" && value.trim()).slice(0, 6)
        : classifiedUnits
            .filter((unit) => ["Problem", "Constraint", "Risk", "Decision", "Conflict"].includes(unit.category))
            .map((unit) => unit.label)
            .slice(0, 6),
      unresolved_questions: Array.isArray(raw?.working_memory?.unresolved_questions)
        ? raw.working_memory.unresolved_questions.filter((value) => typeof value === "string" && value.trim()).slice(0, 6)
        : classifiedUnits.filter((unit) => unit.category === "OpenQuestion").map((unit) => unit.label).slice(0, 6),
      decision_candidates: Array.isArray(raw?.working_memory?.decision_candidates)
        ? raw.working_memory.decision_candidates.filter((value) => typeof value === "string" && value.trim()).slice(0, 4)
        : classifiedUnits.filter((unit) => unit.category === "Decision").map((unit) => unit.label).slice(0, 4),
      repeated_issue_keys: Array.isArray(raw?.working_memory?.repeated_issue_keys)
        ? raw.working_memory.repeated_issue_keys.filter((value) => typeof value === "string" && value.trim()).slice(0, 8)
        : classifiedUnits.map((unit) => unit.repeated_issue_key).filter(Boolean).slice(0, 8),
    },
    executive_memory: {
      current_direction:
        typeof raw?.executive_memory?.current_direction === "string" && raw.executive_memory.current_direction.trim()
          ? raw.executive_memory.current_direction.trim()
          : "The discussion is still forming and needs a clearer direction.",
      unresolved_areas: Array.isArray(raw?.executive_memory?.unresolved_areas)
        ? raw.executive_memory.unresolved_areas.filter((value) => typeof value === "string" && value.trim()).slice(0, 5)
        : [],
      next_step_implications: Array.isArray(raw?.executive_memory?.next_step_implications)
        ? raw.executive_memory.next_step_implications.filter((value) => typeof value === "string" && value.trim()).slice(0, 5)
        : [],
    },
  };
}

function lc(value) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function containsAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function classifyNodeHeuristic(node) {
  const text = `${node?.label || ""} ${node?.content || ""}`.toLowerCase();
  if (!text.trim()) return normalizeCategory(node?.category);

  if (
    containsAny(text, [
      /\b(goal|objective|target|aim|desired outcome|success state|raise awareness|increase|improve|achieve)\b/,
      /\b(aims to|goal is to|designed to|intends to)\b/,
    ])
  ) {
    return "Goal";
  }

  if (
    containsAny(text, [
      /\b(risk|danger|uncertain|failure|downside|blocked|blocker|threat|failure mode|concern)\b/,
      /\b(could fail|might fail|may break|could break)\b/,
    ])
  ) {
    return "Risk";
  }
  if (
    containsAny(text, [
      /\b(evidence|data|metric|fact|observed|research|result|validated|analytics|signal)\b/,
      /\b(user(s)? said|interview(s)?|measured|conversion|retention|benchmark)\b/,
    ])
  ) {
    return "Evidence";
  }
  if (
    containsAny(text, [
      /\b(problem|pain|issue|challenge|struggle|friction|bottleneck)\b/,
      /\b(hard to|difficult to|unable to|too slow|too expensive)\b/,
    ])
  ) {
    return "Problem";
  }
  if (
    containsAny(text, [
      /\b(question|unknown|unclear|whether)\b/,
      /\b(explore|investigate|identify|discover|find out)\b/,
      /\b(how might|what if|still unclear)\b/,
    ])
  ) {
    return "OpenQuestion";
  }
  if (/\b(conflict|trade-off|tradeoff|tension|versus|vs\.?|contradiction)\b/.test(text)) return "Conflict";
  if (/\b(decision|decide|chosen|priority|commit|we will|selected)\b/.test(text)) return "Decision";
  if (/\b(insight|learned|pattern|realized|takeaway|it turns out)\b/.test(text)) return "Insight";
  if (/\b(constraint|limit|limitation|budget|deadline|dependency|requirement)\b/.test(text)) return "Constraint";
  if (
    containsAny(text, [
      /\b(idea|concept|proposal|approach|experiment|possible direction)\b/,
      /\b(we could|what if|let'?s try)\b/,
    ])
  ) {
    return "Idea";
  }
  return normalizeCategory(node?.category);
}

function rebalanceNodeCategories(nodes, stage) {
  const list = Array.isArray(nodes) ? [...nodes] : [];
  if (!list.length) return list;

  const counts = list.reduce((acc, node) => {
    const category = normalizeCategory(node?.category);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  const dominantEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const dominantCategory = dominantEntry?.[0] || null;
  const dominantCount = dominantEntry?.[1] || 0;
  const modeProfile = getReasoningModeProfile(normalizeReasoningStage(stage));
  const isOverconcentrated = dominantCategory && dominantCount >= Math.max(3, Math.ceil(list.length * 0.75));

  if (!isOverconcentrated) return list;

  return list.map((node, index) => {
    const heuristicCategory = classifyNodeHeuristic({ ...node, category: dominantCategory });
    const nextCategory =
      heuristicCategory !== dominantCategory
        ? heuristicCategory
        : modeProfile.nodeBias[index % modeProfile.nodeBias.length] || dominantCategory;

    return {
      ...node,
      category: nextCategory,
      phase: normalizePhase(node?.phase, nextCategory),
    };
  });
}

function detectConflictPair(nodes) {
  const list = Array.isArray(nodes) ? nodes : [];
  const polarityPairs = [
    ["manual", "automatic"],
    ["private", "shared"],
    ["fast", "quality"],
    ["cheap", "premium"],
    ["simple", "feature rich"],
    ["flexible", "consistent"],
    ["centralized", "decentralized"],
  ];
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      const a = `${list[i]?.label || ""} ${list[i]?.content || ""}`.toLowerCase();
      const b = `${list[j]?.label || ""} ${list[j]?.content || ""}`.toLowerCase();
      if (!a.trim() || !b.trim()) continue;
      const tensionWords = /\b(but|however|trade-off|tradeoff|tension|conflict|contradict|versus|vs\.?|while also)\b/;
      const oppositeStatement =
        (/\b(should|must|need to|require)\b/.test(a) && /\b(should not|must not|cannot|can't|avoid)\b/.test(b)) ||
        (/\b(should|must|need to|require)\b/.test(b) && /\b(should not|must not|cannot|can't|avoid)\b/.test(a));
      const opposingPair = polarityPairs.some(
        ([left, right]) => (a.includes(left) && b.includes(right)) || (a.includes(right) && b.includes(left))
      );
      if (tensionWords.test(`${a} ${b}`) || oppositeStatement || opposingPair) {
        return [list[i], list[j]];
      }
    }
  }
  return null;
}

function buildConflictNode(conflictPair) {
  if (!conflictPair) return null;
  const [left, right] = conflictPair;
  return {
    label: "Core tension",
    content: `${left.label} conflicts with ${right.label}.`,
    category: "Conflict",
    phase: "Problem",
    ownerId: "mock-user-1",
    sourceType: "mixed",
    visibility: "candidate",
    confidence: "medium",
  };
}

function buildDecisionSuggestion(nodes) {
  const options = (Array.isArray(nodes) ? nodes : []).filter((node) => {
    const category = normalizeCategory(node?.category);
    return category === "Option" || category === "Idea" || category === "Decision";
  });
  if (options.length < 2) return null;

  const ranked = [...options].sort((a, b) => {
    const aText = lc(`${a.label} ${a.content}`);
    const bText = lc(`${b.label} ${b.content}`);
    const score = (text) =>
      (/\b(evidence|validated|feasible|simple|fast|clear)\b/.test(text) ? 2 : 0) +
      (/\b(risk|complex|expensive|unclear|blocked)\b/.test(text) ? -1 : 0);
    return score(bText) - score(aText);
  });
  const top = ranked[0];
  return {
    label: `Choose ${top.label}`,
    content: `${top.label} appears strongest because it is more actionable, better supported, and carries fewer visible risks than the alternatives.`,
    category: "Decision",
    phase: "Solution",
  };
}

function detectMissingStructure(nodes, stage) {
  const categories = new Set((Array.isArray(nodes) ? nodes : []).map((node) => normalizeCategory(node?.category)));
  const normalizedStage = normalizeReasoningStage(stage);
  const modeProfile = getReasoningModeProfile(normalizedStage);
  const wantsResearch = modeProfile.focus === "research";
  const wantsConverge = modeProfile.breadth === "converge";
  const candidates = [];
  if (wantsResearch && !categories.has("Problem")) {
    candidates.push({
      label: "Clarify the core problem",
      content: "The structure is missing a clear problem statement that anchors the rest of the reasoning.",
      category: "Problem",
      phase: "Problem",
    });
  }
  if (!categories.has("Evidence")) {
    candidates.push({
      label: wantsConverge ? "Strengthen the strongest claim" : "Add supporting evidence",
      content: wantsConverge
        ? "Pick the strongest claim on the canvas and support it with one concrete signal, observation, or data point."
        : "The current structure would be stronger with at least one evidence node to validate the main claims.",
      category: "Evidence",
      phase: "Problem",
    });
  }
  if (!wantsResearch && wantsConverge && !categories.has("Decision") && (categories.has("Idea") || categories.has("Option"))) {
    candidates.push({
      label: "Move toward a decision",
      content: "There are options on the canvas, but no decision node yet to show the preferred direction.",
      category: "Decision",
      phase: "Solution",
    });
  }
  if (!categories.has("OpenQuestion")) {
    candidates.push({
      label: wantsConverge ? "Name the remaining blocker" : "Capture an open question",
      content: wantsConverge
        ? "Capture the one open question that still blocks commitment or clear understanding."
        : "Mark one explicit open question so the team knows what still needs exploration.",
      category: "OpenQuestion",
      phase: "Problem",
    });
  }
  if (wantsResearch && !categories.has("Assumption")) {
    candidates.push({
      label: "Surface a hidden assumption",
      content: "Make one assumption explicit so the team can test what is currently being taken for granted.",
      category: "Assumption",
      phase: "Problem",
    });
  }
  return candidates[0] || null;
}

function enrichAnalysisResult(result, stage) {
  const userNodes = Array.isArray(result?.user_nodes) ? [...result.user_nodes] : [];
  const classifiedUserNodes = rebalanceNodeCategories(userNodes.map((node) => ({
    ...node,
    category: classifyNodeHeuristic(node),
    phase: normalizePhase(node?.phase, classifyNodeHeuristic(node)),
  })), stage);

  const conflictPair = detectConflictPair(classifiedUserNodes);
  if (conflictPair && classifiedUserNodes.length < 4) {
    classifiedUserNodes.push(buildConflictNode(conflictPair));
  }

  const decisionSuggestion = buildDecisionSuggestion(classifiedUserNodes);
  const missingStructureSuggestion = detectMissingStructure(classifiedUserNodes, stage);
  const chosenSuggestion = decisionSuggestion || missingStructureSuggestion;

  const next = {
    ...result,
    user_nodes: classifiedUserNodes.slice(0, 4),
  };

  if (chosenSuggestion) {
    next.suggestion_label = chosenSuggestion.label;
    next.suggestion_content = chosenSuggestion.content;
    next.suggestion_category = chosenSuggestion.category;
    next.suggestion_phase = chosenSuggestion.phase;
    next.suggestion_tags = normalizeSuggestionTags(next.suggestion_tags, {
      category: chosenSuggestion.category,
      sourceType: "agent",
      phase: chosenSuggestion.phase,
      title: chosenSuggestion.label,
      content: chosenSuggestion.content,
    });
    next.connection_label = chosenSuggestion.category === "Decision" ? "proposes" : "refines";
    next.suggestion_connects_to_index = Math.min(next.suggestion_connects_to_index ?? 0, Math.max(0, next.user_nodes.length - 1));
  }

  return next;
}

function enrichChatNodeResult(result, stage) {
  const userNodes = Array.isArray(result?.user_nodes) ? [...result.user_nodes] : [];
  const classifiedUserNodes = rebalanceNodeCategories(userNodes.map((node) => ({
    ...node,
    category: classifyNodeHeuristic(node),
    phase: normalizePhase(node?.phase, classifyNodeHeuristic(node)),
  })), stage);
  const conflictPair = detectConflictPair(classifiedUserNodes);
  if (conflictPair && classifiedUserNodes.length < 4) {
    classifiedUserNodes.push(buildConflictNode(conflictPair));
  }
  const missing = detectMissingStructure(classifiedUserNodes, stage);
  if (missing && classifiedUserNodes.length < 4) {
    classifiedUserNodes.push({
      ...missing,
      ownerId: "mock-user-1",
      sourceType: "agent",
      visibility: "candidate",
      confidence: "medium",
    });
  }
  return {
    ...result,
    user_nodes: classifiedUserNodes.slice(0, 4),
  };
}

function formatZodIssues(issues) {
  if (!Array.isArray(issues)) return "Invalid AI output.";
  return issues
    .slice(0, 6)
    .map((i) => `${(i?.path ?? []).join(".") || "(root)"}: ${i?.message || "invalid"}`)
    .join(" | ");
}

export function createThinkingAgent({ apiKey }) {
  const client = new OpenAI({ apiKey });

  async function processIdea({ text, history, stage }) {
    const historyContext = buildHistoryContext(history);
    const { stage: stageId, mode, flow } = normalizeStage(stage);
    const modeProfile = getReasoningModeProfile(stageId);
    const { strictPrompt, schemaHint } = buildProcessIdeaPrompt({
      mode,
      flow,
      stageId,
      modeProfile,
      historyContext,
    });

    let content = await createJsonCompletion({
      client,
      model: "gpt-4o-2024-08-06",
      systemPrompt: strictPrompt,
      userPrompt: text,
    });

    let raw = safeJsonParse(content);
    let normalized = normalizeAnalysisResult(raw, stageId);
    let result;
    try {
      result = AIAnalysisResultSchema.parse(normalized);
    } catch (e) {
      if (e?.name === "ZodError") {
        const repaired = await repairToSchema({
          client,
          model: "gpt-4o-mini",
          schemaName: "AIAnalysisResult",
          schemaHint,
          badJsonText: JSON.stringify(raw, null, 2),
        });
        content = repaired;
        raw = safeJsonParse(content);
        normalized = normalizeAnalysisResult(raw, stageId);
        result = AIAnalysisResultSchema.parse(normalized);
      } else {
        throw e;
      }
    }

    const slotCounts = {};
    for (const hNode of history ?? []) {
      const hData = hNode?.data ?? {};
      const hCat = normalizeCategory(hData.category ?? "");
      const hPhase = normalizePhase(hData.phase ?? "", hCat);
      if (hPhase && hCat) {
        const key = `${hPhase}_${hCat}`;
        slotCounts[key] = (slotCounts[key] ?? 0) + 1;
      }
    }

    const createdNodes = [];
    const createdNodeIds = [];
    for (const un of result.user_nodes) {
      const nodeId = randomUUID();
      const key = `${un.phase}_${un.category}`;
      const slotIdx = slotCounts[key] ?? 0;
      const pos = calculatePosition(un.phase, un.category, slotIdx);
      slotCounts[key] = slotIdx + 1;

      createdNodes.push(
        toNode({
          id: nodeId,
          label: un.label,
          content: un.content,
          category: un.category,
          phase: un.phase,
          ownerId: un.ownerId,
          sourceType: un.sourceType,
          visibility: un.visibility,
          confidence: un.confidence,
          is_ai_generated: false,
          position: pos,
        })
      );
      createdNodeIds.push(nodeId);
    }

    const suggestionId = randomUUID();
    const sKey = `${result.suggestion_phase}_${result.suggestion_category}`;
    const sSlot = slotCounts[sKey] ?? 0;
    const suggestPos = calculatePosition(result.suggestion_phase, result.suggestion_category, sSlot);

    const suggestionNode = toNode({
      id: suggestionId,
      label: result.suggestion_label,
      content: result.suggestion_content,
      category: result.suggestion_category,
      phase: result.suggestion_phase,
      ownerId: "mock-user-1",
      sourceType: "agent",
      visibility: "candidate",
      confidence: "medium",
      suggestionTags: result.suggestion_tags,
      is_ai_generated: true,
      position: suggestPos,
    });

    const nodes = [...createdNodes, suggestionNode];
    const edges = [];

    for (let i = 0; i < createdNodeIds.length - 1; i += 1) {
      edges.push(
        toEdge({
          id: `e-input-${createdNodeIds[i]}-${createdNodeIds[i + 1]}`,
          source: createdNodeIds[i],
          target: createdNodeIds[i + 1],
          label: "refines",
        })
      );
    }

    let idx = result.suggestion_connects_to_index;
    if (idx >= createdNodeIds.length) idx = 0;
    const mainNodeId = createdNodeIds[idx];
    edges.push(
      toEdge({
        id: `e-suggest-${mainNodeId}-${suggestionId}`,
        source: mainNodeId,
        target: suggestionId,
        label: result.connection_label,
      })
    );

    const existingIds = new Set((history ?? []).map((n) => n?.id).filter(Boolean));
    const crossConnectedNewIds = new Set();

    for (const cross of result.cross_connections ?? []) {
      if (!existingIds.has(cross.existing_node_id)) continue;
      let newIdx = cross.new_node_index;
      if (newIdx >= createdNodeIds.length) newIdx = 0;
      const targetId = createdNodeIds[newIdx];
      edges.push(
        toEdge({
          id: `e-cross-${cross.existing_node_id}-${targetId}`,
          source: cross.existing_node_id,
          target: targetId,
          label: cross.connection_label,
        })
      );
      crossConnectedNewIds.add(targetId);
    }

    if ((history ?? []).length && createdNodeIds.length && crossConnectedNewIds.size === 0) {
      const firstNewId = createdNodeIds[0];
      const firstNewCat = result.user_nodes?.[0]?.category ?? null;

      let bestExisting = null;
      for (let i = (history ?? []).length - 1; i >= 0; i -= 1) {
        const h = history[i];
        const hCat = normalizeCategory(h?.data?.category ?? "");
        if (hCat === firstNewCat) {
          bestExisting = h?.id ?? null;
          break;
        }
      }
      if (!bestExisting) bestExisting = history?.[history.length - 1]?.id ?? null;

      if (bestExisting && existingIds.has(bestExisting)) {
        const edgeId = `e-cross-${bestExisting}-${firstNewId}`;
        const existingEdgeIds = new Set(edges.map((e) => e.id));
        if (!existingEdgeIds.has(edgeId)) {
          edges.push(
            toEdge({
              id: edgeId,
              source: bestExisting,
              target: firstNewId,
            label: "refines",
            })
          );
        }
      }
    }

    return { nodes, edges };
  }

  async function chatWithSuggestion({
    suggestion_title,
    suggestion_content,
    suggestion_category,
    suggestion_phase,
    messages,
    user_message,
    attached_nodes,
    stage,
  }) {
    const safeMessages = z.array(ChatMessageSchema).parse(normalizeChatMessages(messages));
    const attachedContext = buildAttachedNodesContext(attached_nodes);
    const { stage: stageId, mode, flow } = normalizeStage(stage);
    const modeProfile = getReasoningModeProfile(stageId);
    const systemPrompt = `You are an AI conversation partner that helps users explore and improve ideas.

Use the suggestion card below as the conversation anchor.

Current high-level mode:
- Focus: ${mode === "design" ? "Design" : "Research"}
- Flow: ${flow === "converge" ? "Converge (summarize, prioritize, decide)" : "Diverge (explore, branch, generate options)"}
- Reasoning profile: ${modeProfile.label}

Stage behavior:
- If flow is Diverge: prioritize asking probing questions, suggesting variations, and surfacing overlooked angles. Avoid prematurely deciding or collapsing options.
- If flow is Converge: prioritize summarizing what has been said, clarifying trade-offs, and guiding the user toward 2–3 concrete next decisions or actions.
- In this mode, especially reinforce: ${modeProfile.nodeBias.join(", ")}.
- If focus is Research, prefer evidence, assumptions, and contradictions over solutioning too early.
- If focus is Design, prefer options, tradeoffs, decisions, and actionable next moves.

- If this is the first message (messages is empty), explain the suggestion clearly in 2-3 sentences and end with an open question aligned with the current flow.
- In follow-up turns, refine, expand, and validate the idea based on the user's replies and the current mode/flow.
- Keep responses concise.
- Respond in English only.

[Suggestion Card]
Category: ${suggestion_category} / ${suggestion_phase}
Title: ${suggestion_title}
Content: ${suggestion_content}
${attachedContext ? `\n[Attached Nodes]\n${attachedContext}\n\nWhen attached nodes are present, treat them as primary ground truth context and tie your replies back to them.` : ""}
Current stage id: ${stageId}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...safeMessages,
        { role: "user", content: user_message },
      ],
    });

    return response.choices?.[0]?.message?.content ?? "";
  }

  async function chatToNodes({
    suggestion_title,
    suggestion_content,
    suggestion_category,
    suggestion_phase,
    messages,
    existing_nodes,
    attached_nodes,
    stage,
  }) {
    const safeMessages = z.array(ChatMessageSchema).parse(normalizeChatMessages(messages));
    const historyContext = buildHistoryContext(existing_nodes ?? []);
    const attachedContext = buildAttachedNodesContext(attached_nodes);
    const conversationText = safeMessages
      .map((m) => `[${String(m.role).toUpperCase()}] ${m.content}`)
      .join("\n");

    const { stage: stageId, mode, flow } = normalizeStage(stage);
    const modeProfile = getReasoningModeProfile(stageId);
    const { strictPrompt, schemaHint } = buildChatToNodesPrompt({
      mode,
      flow,
      stageId,
      modeProfile,
      suggestion_category,
      suggestion_phase,
      suggestion_title,
      suggestion_content,
      conversationText,
      attachedContext,
      historyContext,
    });

    let content = await createJsonCompletion({
      client,
      model: "gpt-4o-2024-08-06",
      systemPrompt: strictPrompt,
      userPrompt: "Convert this conversation into nodes.",
    });

    let raw = safeJsonParse(content);
    let normalized = normalizeChatNodeResult(raw, stageId);
    let result;
    try {
      result = ChatNodeResultSchema.parse(normalized);
    } catch (e) {
      if (e?.name === "ZodError") {
        const repaired = await repairToSchema({
          client,
          model: "gpt-4o-mini",
          schemaName: "ChatNodeResult",
          schemaHint,
          badJsonText: JSON.stringify(raw, null, 2),
        });
        content = repaired;
        raw = safeJsonParse(content);
        normalized = normalizeChatNodeResult(raw, stageId);
        result = ChatNodeResultSchema.parse(normalized);
      } else {
        throw e;
      }
    }

    const slotCounts = {};
    for (const hNode of existing_nodes ?? []) {
      const hData = hNode?.data ?? {};
      const hCat = normalizeCategory(hData.category ?? "");
      const hPhase = normalizePhase(hData.phase ?? "", hCat);
      if (hPhase && hCat) {
        const key = `${hPhase}_${hCat}`;
        slotCounts[key] = (slotCounts[key] ?? 0) + 1;
      }
    }

    const createdNodes = [];
    const createdNodeIds = [];
    for (const un of result.user_nodes) {
      const nodeId = randomUUID();
      const key = `${un.phase}_${un.category}`;
      const slotIdx = slotCounts[key] ?? 0;
      const pos = calculatePosition(un.phase, un.category, slotIdx);
      slotCounts[key] = slotIdx + 1;

      createdNodes.push(
        toNode({
          id: nodeId,
          label: un.label,
          content: un.content,
          category: un.category,
          phase: un.phase,
          ownerId: un.ownerId,
          sourceType: un.sourceType,
          visibility: un.visibility,
          confidence: un.confidence,
          is_ai_generated: false,
          position: pos,
        })
      );
      createdNodeIds.push(nodeId);
    }

    const edges = [];
    for (let i = 0; i < createdNodeIds.length - 1; i += 1) {
      edges.push(
        toEdge({
          id: `e-chat-${createdNodeIds[i]}-${createdNodeIds[i + 1]}`,
          source: createdNodeIds[i],
          target: createdNodeIds[i + 1],
          label: "refines",
        })
      );
    }

    const existingIds = new Set((existing_nodes ?? []).map((n) => n?.id).filter(Boolean));
    const crossConnected = new Set();

    for (const cross of result.cross_connections ?? []) {
      if (!existingIds.has(cross.existing_node_id)) continue;
      let newIdx = cross.new_node_index;
      if (newIdx >= createdNodeIds.length) newIdx = 0;
      const targetId = createdNodeIds[newIdx];
      edges.push(
        toEdge({
          id: `e-cross-${cross.existing_node_id}-${targetId}`,
          source: cross.existing_node_id,
          target: targetId,
          label: cross.connection_label,
        })
      );
      crossConnected.add(targetId);
    }

    if ((existing_nodes ?? []).length && createdNodeIds.length && crossConnected.size === 0) {
      const firstId = createdNodeIds[0];
      const anchor = existing_nodes?.[existing_nodes.length - 1]?.id ?? null;
      if (anchor && existingIds.has(anchor)) {
        edges.push(
          toEdge({
            id: `e-cross-${anchor}-${firstId}`,
            source: anchor,
            target: firstId,
            label: "refines",
          })
        );
      }
    }

    return { nodes: createdNodes, edges };
  }

  async function ingestMeetingChunk({
    projectTitle,
    chunkText,
    chunkType,
    speakerName,
    meetingSessionId,
    existing_nodes,
    meeting_memory,
    stage,
  }) {
    const safeChunkText = typeof chunkText === "string" ? chunkText.trim() : "";
    if (!safeChunkText) {
      throw new Error("Missing required field: chunkText");
    }

    const historyContext = buildHistoryContext(existing_nodes ?? []);
    const memoryContext = buildMeetingMemoryContext(meeting_memory || {});
    const { stage: stageId, mode, flow } = normalizeStage(stage);
    const modeProfile = getReasoningModeProfile(stageId);
    const { systemPrompt, schemaHint } = buildMeetingIngestPrompt({
      mode,
      flow,
      stageId,
      modeProfile,
      chunkType,
      speakerName,
      meetingSessionId,
      projectTitle,
      historyContext,
      memoryContext,
    });

    let content = await createJsonCompletion({
      client,
      model: "gpt-4o-2024-08-06",
      systemPrompt,
      userPrompt: `Latest meeting chunk:\n${safeChunkText}`,
    });

    let raw = safeJsonParse(content);
    let normalized = normalizeMeetingChunkResult(raw, stageId);
    let result;
    try {
      result = MeetingChunkResultSchema.parse(normalized);
    } catch (e) {
      if (e?.name !== "ZodError") throw e;
      const repaired = await repairToSchema({
        client,
        model: "gpt-4o-mini",
        schemaName: "MeetingChunkResult",
        schemaHint,
        badJsonText: JSON.stringify(raw, null, 2),
      });
      content = repaired;
      raw = safeJsonParse(content);
      normalized = normalizeMeetingChunkResult(raw, stageId);
      result = MeetingChunkResultSchema.parse(normalized);
    }

    const slotCounts = {};
    for (const hNode of existing_nodes ?? []) {
      const hData = hNode?.data ?? {};
      const hCat = normalizeCategory(hData.category ?? "");
      const hPhase = normalizePhase(hData.phase ?? "", hCat);
      if (hPhase && hCat) {
        const key = `${hPhase}_${hCat}`;
        slotCounts[key] = (slotCounts[key] ?? 0) + 1;
      }
    }

    const existingIds = new Set((existing_nodes ?? []).map((node) => node?.id).filter(Boolean));
    const createdNodes = [];
    const createdNodeIds = [];
    const strengthenedNodeIds = [];
    const linkedExistingNodeIds = [];
    const edges = [];

    (result.units || []).forEach((unit) => {
      const existingNodeId = existingIds.has(unit.existing_node_id) ? unit.existing_node_id : null;
      if (unit.operation === "strengthen" && existingNodeId) {
        strengthenedNodeIds.push(existingNodeId);
        linkedExistingNodeIds.push(existingNodeId);
        return;
      }

      const nodeId = randomUUID();
      const key = `${unit.phase}_${unit.category}`;
      const slotIdx = slotCounts[key] ?? 0;
      const position = calculatePosition(unit.phase, unit.category, slotIdx);
      slotCounts[key] = slotIdx + 1;

      createdNodes.push(
        toNode({
          id: nodeId,
          label: unit.label,
          content: unit.content,
          category: unit.category,
          phase: unit.phase,
          ownerId: unit.ownerId,
          sourceType: unit.sourceType,
          visibility: unit.visibility,
          confidence: unit.confidence,
          is_ai_generated: false,
          position,
        })
      );
      createdNodeIds.push(nodeId);

      if (existingNodeId) {
        edges.push(
          toEdge({
            id: `e-meeting-${existingNodeId}-${nodeId}`,
            source: existingNodeId,
            target: nodeId,
            label: unit.relation_label,
          })
        );
        linkedExistingNodeIds.push(existingNodeId);
      }
    });

    for (let i = 0; i < createdNodeIds.length - 1; i += 1) {
      edges.push(
        toEdge({
          id: `e-meeting-seq-${createdNodeIds[i]}-${createdNodeIds[i + 1]}`,
          source: createdNodeIds[i],
          target: createdNodeIds[i + 1],
          label: "refines",
        })
      );
    }

    if ((existing_nodes ?? []).length && createdNodeIds.length && linkedExistingNodeIds.length === 0) {
      const anchor = existing_nodes?.[existing_nodes.length - 1]?.id ?? null;
      if (anchor && existingIds.has(anchor)) {
        edges.push(
          toEdge({
            id: `e-meeting-anchor-${anchor}-${createdNodeIds[0]}`,
            source: anchor,
            target: createdNodeIds[0],
            label: "refines",
          })
        );
        linkedExistingNodeIds.push(anchor);
      }
    }

    const unresolvedQuestionNodeIds = [
      ...createdNodes
        .filter((node) => normalizeCategory(node?.data?.category) === "OpenQuestion")
        .map((node) => node.id),
      ...result.units
        .filter((unit) => normalizeCategory(unit.category) === "OpenQuestion" && unit.existing_node_id)
        .map((unit) => unit.existing_node_id),
    ];
    const recentDecisionNodeIds = [
      ...createdNodes
        .filter((node) => normalizeCategory(node?.data?.category) === "Decision")
        .map((node) => node.id),
      ...result.units
        .filter((unit) => normalizeCategory(unit.category) === "Decision" && unit.existing_node_id)
        .map((unit) => unit.existing_node_id),
    ];
    const activeIssueNodeIds = [
      ...createdNodes
        .filter((node) => ["Problem", "Constraint", "Risk", "Conflict", "Decision"].includes(normalizeCategory(node?.data?.category)))
        .map((node) => node.id),
      ...linkedExistingNodeIds,
      ...strengthenedNodeIds,
    ];
    const linkedNodeIds = Array.from(
      new Set([...createdNodeIds, ...strengthenedNodeIds, ...linkedExistingNodeIds].filter(Boolean))
    );

    return {
      graphPatch: {
        nodes: createdNodes,
        edges,
      },
      memoryPatch: {
        rawChunksAppend: [
          {
            id: randomUUID(),
            meetingSessionId: meetingSessionId || "session-current",
            chunkType: chunkType || "speaker_turn",
            speakerName: speakerName || "",
            text: safeChunkText,
            summary: result.chunk_summary,
            createdAt: new Date().toISOString(),
            linkedNodeIds,
          },
        ],
        working: {
          activeIssueNodeIds,
          unresolvedQuestionNodeIds,
          recentDecisionNodeIds,
          repeatedIssueKeys: result.working_memory.repeated_issue_keys,
          activeIssueTitles: result.working_memory.active_issue_titles,
          unresolvedQuestions: result.working_memory.unresolved_questions,
          decisionCandidates: result.working_memory.decision_candidates,
        },
        executive: {
          currentDirection: result.executive_memory.current_direction,
          unresolvedAreas: result.executive_memory.unresolved_areas,
          nextStepImplications: result.executive_memory.next_step_implications,
        },
      },
      meetingSummary: {
        chunkSummary: result.chunk_summary,
        createdNodeIds,
        strengthenedNodeIds: Array.from(new Set(strengthenedNodeIds)),
        linkedNodeIds,
        unresolvedQuestions: result.working_memory.unresolved_questions,
        decisionCandidates: result.working_memory.decision_candidates,
        repeatedIssueKeys: result.working_memory.repeated_issue_keys,
        currentDirection: result.executive_memory.current_direction,
      },
    };
  }

  async function summarizeTeamContext({
    projectTitle,
    memberName,
    memberRole,
    activityEvents,
    relatedNodes,
    stage,
  }) {
    const { stage: stageId, mode, flow } = normalizeStage(stage);
    const activityContext = buildActivityContext(activityEvents);
    const nodeContext = buildRelatedNodesContext(relatedNodes);
    const { strictPrompt, schemaHint } = buildTeamContextPrompt({
      mode,
      flow,
      stageId,
      projectTitle,
      memberName,
      memberRole,
      activityContext,
      nodeContext,
    });

    let content = await createJsonCompletion({
      client,
      model: "gpt-4o-mini",
      systemPrompt: strictPrompt,
      userPrompt: "Summarize the teammate context.",
    });

    let raw = safeJsonParse(content);
    let normalized = normalizeTeamContextSummary(raw);
    try {
      return TeamContextSummarySchema.parse(normalized);
    } catch (e) {
      if (e?.name !== "ZodError") throw e;
      const repaired = await repairToSchema({
        client,
        model: "gpt-4o-mini",
        schemaName: "TeamContextSummary",
        schemaHint,
        badJsonText: JSON.stringify(raw, null, 2),
      });
      content = repaired;
      raw = safeJsonParse(content);
      normalized = normalizeTeamContextSummary(raw);
      return TeamContextSummarySchema.parse(normalized);
    }
  }

  async function explainConflict({
    projectTitle,
    stage,
    selectedNode,
    conflictingNodes,
    surroundingNodes,
    activityEvents,
  }) {
    const { stage: stageId } = normalizeStage(stage);
    const selectedNodeContext = buildRelatedNodesContext(selectedNode ? [selectedNode] : []);
    const conflictingNodeContext = buildRelatedNodesContext(conflictingNodes || []);
    const surroundingNodeContext = buildRelatedNodesContext(surroundingNodes || []);
    const activityContext = buildActivityContext(activityEvents || []);
    const { strictPrompt, schemaHint } = buildConflictExplainPrompt({
      projectTitle,
      stageId,
      selectedNodeContext,
      conflictingNodeContext,
      surroundingNodeContext,
      activityContext,
    });

    let content = await createJsonCompletion({
      client,
      model: "gpt-4o-mini",
      systemPrompt: strictPrompt,
      userPrompt: "Explain the conflict between these nodes.",
    });

    let raw = safeJsonParse(content);
    let normalized = normalizeConflictExplainSummary(raw);
    try {
      return ConflictExplainSummarySchema.parse(normalized);
    } catch (e) {
      if (e?.name !== "ZodError") throw e;
      const repaired = await repairToSchema({
        client,
        model: "gpt-4o-mini",
        schemaName: "ConflictExplainSummary",
        schemaHint,
        badJsonText: JSON.stringify(raw, null, 2),
      });
      content = repaired;
      raw = safeJsonParse(content);
      normalized = normalizeConflictExplainSummary(raw);
      return ConflictExplainSummarySchema.parse(normalized);
    }
  }

  return {
    processIdea,
    chatWithSuggestion,
    chatToNodes,
    ingestMeetingChunk,
    summarizeTeamContext,
    explainConflict,
  };
}
