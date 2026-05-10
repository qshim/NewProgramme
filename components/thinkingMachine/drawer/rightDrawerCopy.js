export function getRightDrawerCopy(uiLanguage = "en") {
  if (uiLanguage === "ko") {
    return {
      emptyChat: "노드를 선택해 오른쪽으로 드래그한 뒤 놓으면 채팅 컨텍스트로 첨부됩니다.",
      emptySuggestions: "제안 카드를 선택해 에이전트와 reasoning 흐름을 확장하세요.",
      emptyWorkspace: "노드 컨텍스트를 첨부해 워크스페이스 대화를 시작하세요.",
      emptySuggestionState: "제안을 선택해 구조를 검토하거나 확장하세요.",
      meetingTab: "Meeting",
      workspaceInputTab: "Workspace",
      suggestionsTab: "Suggestions",
      workspaceTab: "Workspace",
      note: "Note",
      image: "Image",
      voice: "Voice",
    };
  }

  return {
    emptyChat: "Select a node, drag it to the right, and drop it to attach it as chat context.",
    emptySuggestions: "Select a suggestion card to expand the reasoning flow with the agent.",
    emptyWorkspace: "Attach node context to begin the workspace conversation.",
    emptySuggestionState: "Select a suggestion to inspect, challenge, or extend the reasoning.",
    meetingTab: "Meeting",
    workspaceInputTab: "Workspace",
    suggestionsTab: "Suggestions",
    workspaceTab: "Workspace",
    note: "Note",
    image: "Image",
    voice: "Voice",
  };
}
