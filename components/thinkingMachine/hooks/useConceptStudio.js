"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { developConcept, toChatErrorMessage } from "@/lib/thinkingMachine/apiClient";

function serializeConceptHistory(messages) {
  return messages.map((message) => {
    if (message.role !== "assistant" || !message.conceptResult) {
      return { role: message.role, content: message.content };
    }
    const directionSummary = message.conceptResult.directions
      .map((direction) => `${direction.name}: ${direction.promise}`)
      .join(" | ");
    return {
      role: "assistant",
      content: `${message.content}\nDirections: ${directionSummary}\nQuestion: ${message.conceptResult.question}`,
    };
  });
}

function serializeCanvasNodes(nodes) {
  return (Array.isArray(nodes) ? nodes : [])
    .filter((node) => node?.type === "thinkingNode" && node?.id)
    .slice(-24)
    .map((node) => ({
      id: node.id,
      data: {
        title: node.data?.title || "",
        content: node.data?.content || "",
        category: node.data?.category,
        phase: node.data?.phase,
        confidence: node.data?.confidence,
      },
      position: node.position,
    }));
}

export function useConceptStudio({
  projectTitle,
  nodes,
  selectedNodeId,
  uiLanguage = "en",
  modelProfile = "auto",
  onPreviewGraph,
} = {}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  const latestResult = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.conceptResult) return messages[index].conceptResult;
    }
    return null;
  }, [messages]);

  const submit = useCallback(async (promptOverride) => {
    const prompt = String(promptOverride ?? input).trim();
    if (!prompt || isLoading) return;

    const historyForApi = serializeConceptHistory(messages);
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setMessages((current) => [...current, { role: "user", content: prompt }]);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const result = await developConcept({
        projectTitle,
        userMessage: prompt,
        messages: historyForApi,
        existing_nodes: serializeCanvasNodes(nodes),
        anchor_node_ids: selectedNodeId ? [selectedNodeId] : [],
        conceptStage: latestResult?.stage || "explore",
        uiLanguage,
        modelProfile,
        webSearchEnabled: true,
      });
      if (requestIdRef.current !== requestId) return;
      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.responseSummary, conceptResult: result },
      ]);
      onPreviewGraph?.({
        ...result.canvasGraph,
        kind: "concept",
        meta: {
          stage: result.stage,
          directionNames: result.directions.map((direction) => direction.name),
        },
      });
    } catch (requestError) {
      if (requestIdRef.current !== requestId) return;
      setError(toChatErrorMessage(requestError));
    } finally {
      if (requestIdRef.current === requestId) setIsLoading(false);
    }
  }, [input, isLoading, latestResult, messages, modelProfile, nodes, onPreviewGraph, projectTitle, selectedNodeId, uiLanguage]);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setMessages([]);
    setInput("");
    setError("");
    setIsLoading(false);
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading,
    error,
    latestResult,
    submit,
    reset,
  };
}
