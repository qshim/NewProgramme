## Thinking Machine 수동 QA 체크리스트

### TopBar

- **프로젝트 타이틀 인라인 편집**
  - 프로젝트 타이틀 영역을 클릭하면 인풋으로 전환되는지 확인.
  - 인풋에서 텍스트를 수정한 뒤 Enter 키를 누르면 편집이 종료되고, 최종 값이 반영되는지 확인.
  - 인풋 포커스 상태에서 ESC 키를 누르면 기존 타이틀로 되돌아가며 편집 모드가 종료되는지 확인.
  - 타이틀을 비운 상태에서 Enter를 누르면 `"Untitled Project"`로 설정되는지 확인.
  - 타이틀 변경 시 `onProjectTitleChange` 콜백이 한 번만 호출되는지 (불필요한 중복 호출이 없는지) 확인.

- **Project breadcrumb 링크**
  - 좌측 상단 `projectMetaLabel` 텍스트를 클릭하면 `projectMetaHref`로 정상 이동하는지 확인.
  - hover 시 텍스트 컬러가 의도한 색상으로 변경되는지 확인.

- **AI Mode 토글 (Research / Design)**
  - Research/Design 버튼을 각각 클릭할 때마다 시각적으로 선택 상태가 올바르게 변경되는지 확인.
  - 현재 `flow` 값이 유지된 상태에서 `mode`만 바뀐 조합 문자열(`research-diverge` 등)이 `onStageChange`로 전달되는지 확인.
  - 이미 선택된 모드를 다시 클릭해도 예기치 않은 상태 변경이 발생하지 않는지 확인.

- **Flow 토글 (Diverge / Converge)**
  - Diverge/Converge 버튼 클릭 시 시각적 선택 상태가 올바르게 변경되는지 확인.
  - 현재 `mode` 값이 유지된 상태에서 `flow`만 바뀐 조합 문자열이 `onStageChange`로 전달되는지 확인.
  - 기본값(`research-diverge`)에서 시작했을 때 모든 조합 전환이 정상 동작하는지 확인.

- **Canvas Mode 토글 (Personal / Team)**
  - Personal/Team 버튼 클릭 시 각각 배경색/텍스트 색이 올바르게 바뀌는지 확인.
  - 각 버튼 클릭 시 `onCanvasModeChange("personal" | "team")` 콜백이 정확히 한 번 호출되는지 확인.
  - 외부에서 `canvasMode` prop을 변경했을 때 UI 선택 상태가 동기화되는지 확인.

### RightAgentDrawer

- **드로어 표시/숨김**
  - `isOpen`이 true일 때 드로어가 오른쪽에서 자연스럽게 슬라이드 인 되는지, false일 때 슬라이드 아웃 되는지 확인.
  - 드로어가 열려 있을 때 페이지 내 다른 UI와 포인터 이벤트 충돌이 없는지 확인.

- **상단 힌트 배너**
  - 노드를 선택하지 않은 상태에서만 상단 힌트 배너(스파클 아이콘과 안내 문구)가 보이는지 확인.
  - 노드를 선택하면 힌트 배너가 사라지고, 선택을 해제하면 다시 나타나는지 확인.

- **탭 전환 (Suggestions / Workspace)**
  - 탭 버튼 클릭 시 `onToggleMode("tip" | "chat")`이 호출되며, 현재 탭에 맞춰 스타일이 변경되는지 확인.
  - Suggestions 탭에서 추천 카드가 그리드로 표시되는지, Workspace 탭에서는 채팅 컨텍스트 안내 문구가 표시되는지 확인.
  - 한국어(`uiLanguage="ko"`) / 영어(`uiLanguage="en"`) 모두에서 탭 라벨 및 안내 문구가 올바른 언어로 표시되는지 확인.

- **Suggestion 카드 및 컨텍스트 선택**
  - Suggestions 탭에서 각 카드 클릭 시 `onChatContextSelect`가 해당 아이템으로 호출되는지 확인.
  - 선택된 카드가 시각적으로 강조 표시되고, 해당 내용이 메인 패널 상단의 active suggestion 영역에 반영되는지 확인.

- **Node 상세 카드**
  - 노드를 선택했을 때 `NodeDetailCard`에 카테고리, 소스 타입, 가시성, confidence, 현재 사용자 역할 등의 메타 정보가 올바르게 표시되는지 확인.
  - 연결된 노드가 있을 경우 `Linked nodes` 영역에 방향(Outgoing/Incoming)과 relation 정보가 올바른 텍스트로 표시되는지 확인.
  - `currentUserRole`이 owner/editor일 때만 Promote/Demote/Share 버튼이 활성화되는지, 그렇지 않을 때는 비활성화되는지 확인.
  - Promote/Demote 버튼 클릭 시 가시성이 올바르게 변경되고, 더 이상 변경할 수 없을 때 버튼이 비활성화되는지 확인.
  - Share 버튼 클릭 시 `onSetNodeVisibility(id, "shared")`가 호출되고, 이미 공유/검토/합의된 상태에서는 버튼이 비활성화되는지 확인.

- **Candidate nodes 카드**
  - candidate graph가 있을 때만 Candidate 카드가 보이는지, 노드/엣지 수가 올바르게 표시되는지 확인.
  - 각 노드의 카테고리, Candidate 라벨, confidence 메타가 정상적으로 표시되는지 확인.
  - `Keep private`, `Add as candidate`, `Discard` 버튼이 각각 대응하는 콜백(onCommitAsPrivate/onCommit/onDiscard)을 정확히 한 번씩 호출하는지 확인.

- **Activity 로그 카드**
  - 프로젝트 업데이트 시간과 마지막 새로고침 시간이 사람이 읽기 좋은 형태(월/일/시/분)로 표시되는지 확인.
  - 지원하는 타입(`node_shared`, `conflict_created`, `node_reviewed`, `node_agreed`, `decision_created`)만 리스트에 보이는지 확인.
  - 각 항목에 타입 라벨, 노드 타이틀, 노드 타입, 사용자 정보, 타임스탬프가 올바르게 표시되는지 확인.
  - `Refresh` 버튼 클릭 시 `onRefresh`가 호출되고, 필요한 경우 외부에서 activityLog가 갱신되는지 확인.

- **채팅 메시지 흐름**
  - 채팅 인풋에 텍스트 입력 후 Enter 또는 전송 버튼 클릭 시 `onChatSubmit`이 호출되며, 사용자가 입력한 텍스트가 로딩 오버레이와 메시지 리스트에 순서대로 나타나는지 확인.
  - `isChatLoading`이 true일 때 전송 버튼이 비활성화되고, 로딩 인디케이터가 표시되는지 확인.
  - 메시지 리스트가 길어질 경우 자동으로 하단(`chatBottomRef`)으로 스크롤되는지 확인.
  - `isChatConverting`이 true일 때 \"Convert to node candidates\" 버튼이 비활성화되고 로딩 상태 텍스트가 표시되는지 확인.
  - `chatMessages.length >= 2`이고 active suggestion이 있을 때만 \"Convert to node candidates\" 버튼이 나타나는지 확인.

- **드롭존 및 드래그 인터랙션**
  - 컨텍스트 노드를 오른쪽으로 드래그하여 드롭존에 가져가면 드로어 테두리가 강조(ring)되는지 확인.
  - 드롭 시 해당 노드가 채팅 컨텍스트로 정상 첨부되고, 이후 대화 흐름에서 참고되는지 확인(있다면).

