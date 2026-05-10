const MAX_RAW_CHUNKS = 120;
const MAX_TRACKED_IDS = 8;
const MAX_REPEATED_KEYS = 12;
const MAX_EXECUTIVE_ITEMS = 5;

function nowIso() {
  return new Date().toISOString();
}

function cleanString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function cleanStringList(values = [], maxItems = MAX_TRACKED_IDS) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => cleanString(value))
        .filter(Boolean)
    )
  ).slice(0, maxItems);
}

function cleanNodeIdList(values = [], maxItems = MAX_TRACKED_IDS) {
  return cleanStringList(values, maxItems);
}

function sanitizeRawChunk(chunk = {}) {
  return {
    id: cleanString(chunk.id, ""),
    meetingSessionId: cleanString(chunk.meetingSessionId, ""),
    chunkType: cleanString(chunk.chunkType, "speaker_turn"),
    speakerName: cleanString(chunk.speakerName, ""),
    text: cleanString(chunk.text, ""),
    summary: cleanString(chunk.summary, ""),
    createdAt: cleanString(chunk.createdAt, nowIso()),
    linkedNodeIds: cleanNodeIdList(chunk.linkedNodeIds),
  };
}

export function getDefaultMeetingMemory() {
  return {
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
  };
}

export function sanitizeMeetingMemory(memory = {}) {
  const base = getDefaultMeetingMemory();
  return {
    rawChunks: (Array.isArray(memory?.rawChunks) ? memory.rawChunks : [])
      .map(sanitizeRawChunk)
      .filter((chunk) => chunk.text)
      .slice(0, MAX_RAW_CHUNKS),
    working: {
      activeIssueNodeIds: cleanNodeIdList(memory?.working?.activeIssueNodeIds),
      unresolvedQuestionNodeIds: cleanNodeIdList(memory?.working?.unresolvedQuestionNodeIds),
      recentDecisionNodeIds: cleanNodeIdList(memory?.working?.recentDecisionNodeIds),
      repeatedIssueKeys: cleanStringList(memory?.working?.repeatedIssueKeys, MAX_REPEATED_KEYS),
      lastUpdatedAt: cleanString(memory?.working?.lastUpdatedAt, base.working.lastUpdatedAt),
    },
    executive: {
      currentDirection: cleanString(memory?.executive?.currentDirection, base.executive.currentDirection),
      unresolvedAreas: cleanStringList(memory?.executive?.unresolvedAreas, MAX_EXECUTIVE_ITEMS),
      nextStepImplications: cleanStringList(memory?.executive?.nextStepImplications, MAX_EXECUTIVE_ITEMS),
      lastUpdatedAt: cleanString(memory?.executive?.lastUpdatedAt, base.executive.lastUpdatedAt),
    },
  };
}

export function mergeMeetingMemory(baseMemory = {}, patch = {}) {
  const base = sanitizeMeetingMemory(baseMemory);
  const rawChunksAppend = (Array.isArray(patch?.rawChunksAppend) ? patch.rawChunksAppend : [])
    .map(sanitizeRawChunk)
    .filter((chunk) => chunk.text);
  const rawChunks = [...rawChunksAppend, ...base.rawChunks].slice(0, MAX_RAW_CHUNKS);
  const hasWorkingPatch = Boolean(patch?.working);
  const hasExecutivePatch = Boolean(patch?.executive);
  const timestamp = nowIso();

  return sanitizeMeetingMemory({
    rawChunks,
    working: {
      activeIssueNodeIds: cleanNodeIdList([
        ...(patch?.working?.activeIssueNodeIds || []),
        ...base.working.activeIssueNodeIds,
      ]),
      unresolvedQuestionNodeIds: cleanNodeIdList([
        ...(patch?.working?.unresolvedQuestionNodeIds || []),
        ...base.working.unresolvedQuestionNodeIds,
      ]),
      recentDecisionNodeIds: cleanNodeIdList([
        ...(patch?.working?.recentDecisionNodeIds || []),
        ...base.working.recentDecisionNodeIds,
      ]),
      repeatedIssueKeys: cleanStringList([
        ...(patch?.working?.repeatedIssueKeys || []),
        ...base.working.repeatedIssueKeys,
      ], MAX_REPEATED_KEYS),
      lastUpdatedAt: hasWorkingPatch ? timestamp : base.working.lastUpdatedAt,
    },
    executive: {
      currentDirection: cleanString(
        patch?.executive?.currentDirection,
        base.executive.currentDirection
      ),
      unresolvedAreas:
        Array.isArray(patch?.executive?.unresolvedAreas) && patch.executive.unresolvedAreas.length
          ? cleanStringList(patch.executive.unresolvedAreas, MAX_EXECUTIVE_ITEMS)
          : base.executive.unresolvedAreas,
      nextStepImplications:
        Array.isArray(patch?.executive?.nextStepImplications) && patch.executive.nextStepImplications.length
          ? cleanStringList(patch.executive.nextStepImplications, MAX_EXECUTIVE_ITEMS)
          : base.executive.nextStepImplications,
      lastUpdatedAt: hasExecutivePatch ? timestamp : base.executive.lastUpdatedAt,
    },
  });
}

export function buildMeetingMemoryReadout(memory = {}, nodes = []) {
  const safeMemory = sanitizeMeetingMemory(memory);
  const nodeMap = new Map(
    (Array.isArray(nodes) ? nodes : [])
      .filter((node) => node?.id)
      .map((node) => [node.id, node])
  );

  const nodeIdsToItems = (nodeIds = []) =>
    nodeIds
      .map((nodeId) => {
        const node = nodeMap.get(nodeId);
        if (!node) return null;
        return {
          id: node.id,
          title: cleanString(node?.data?.title, "Untitled node"),
          category: cleanString(node?.data?.category, "Idea"),
        };
      })
      .filter(Boolean);

  return {
    rawChunkCount: safeMemory.rawChunks.length,
    latestChunk: safeMemory.rawChunks[0] || null,
    currentDirection: safeMemory.executive.currentDirection,
    unresolvedAreas: safeMemory.executive.unresolvedAreas,
    nextStepImplications: safeMemory.executive.nextStepImplications,
    activeIssues: nodeIdsToItems(safeMemory.working.activeIssueNodeIds),
    unresolvedQuestions: nodeIdsToItems(safeMemory.working.unresolvedQuestionNodeIds),
    decisionCandidates: nodeIdsToItems(safeMemory.working.recentDecisionNodeIds),
    repeatedIssues: safeMemory.working.repeatedIssueKeys,
  };
}
