function buildSuggestionKey(item) {
  return `${String(item?.category || "").toLowerCase()}::${String(item?.title || "")
    .trim()
    .toLowerCase()}::${String(item?.content || "").trim().toLowerCase()}`;
}

export function mergeSuggestionUnique(prev = [], nextSuggestion) {
  if (!nextSuggestion) return prev;
  const nextKey = buildSuggestionKey(nextSuggestion);
  const existingIndex = prev.findIndex((item) => buildSuggestionKey(item) === nextKey);
  if (existingIndex === -1) return [nextSuggestion, ...prev];

  const clone = [...prev];
  clone.splice(existingIndex, 1);
  return [nextSuggestion, ...clone];
}
