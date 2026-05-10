## 모듈러 구조 가이드 (프로젝트 공통)

### 1. 레이어 분리 원칙

- **UI 레이어**
  - Next.js 페이지/레이아웃, 컨테이너 컴포넌트, 프레젠테이션 컴포넌트.
  - 가능한 한 **상태 최소화**, props를 통해 데이터와 콜백만 주입.
  - 한 파일이 300~400줄을 넘기면 서브컴포넌트 추출을 우선 고려.

- **상태/도메인 로직 레이어**
  - 커스텀 훅, context, 상태 관리(store 등)는 UI에서 분리해 `hooks/`, `components/.../hooks/`에 위치.
  - UI와 무관한 훅(예: `useAdminMode`)은 **프로젝트 공용 위치(`hooks/`)**로 올려 재사용성을 높인다.

- **유틸/도메인 메타 레이어**
  - 포맷터, 변환 함수, 메타 정보(`nodeMeta` 등)는 `lib/**` 아래에 위치.
  - UI 컴포넌트는 가능한 한 `lib/**`에 직접 의존하고, 도메인 규칙을 컴포넌트 내부에 중복 정의하지 않는다.

### 2. 폴더 구조 권장 패턴

- **Thinking Machine 예시**
  - `components/thinkingMachine/layout` : 상단 바(`TopBar`), 레이아웃/프레임 컴포넌트.
  - `components/thinkingMachine/drawer` : 우측 드로어 관련 컨테이너/섹션 컴포넌트.
  - `components/thinkingMachine/cards` : `NodeDetailCard`, `CandidateGraphCard`, `ActivityLogCard`, `ContextMiniCard` 등 카드형 UI.
  - `components/thinkingMachine/ui` : `MetaPill` 같은 공용 UI 조각.
  - `components/thinkingMachine/hooks` : 이 도메인에 특화된 상태 훅.
  - `hooks/` : 도메인과 무관하게 프로젝트 전반에서 재사용 가능한 훅 (`useAdminMode` 등).
  - `lib/thinkingMachine` : 그래프/노드 메타 정보, 변환 유틸, API 클라이언트.

- **다른 도메인에도 동일하게 적용**
  - 각 주요 기능 모듈(예: 대시보드, 설정, 리포트 등)마다 위 패턴을 변형해서 적용.
  - \"도메인 루트(예: `components/dashboard`) + layout/drawer/cards/ui/hooks\" 구조를 기본 템플릿으로 삼는다.

### 3. 컴포넌트 분리 기준

- **언제 분리할까?**
  - 파일이 **300~400줄 이상**이거나, 스크롤 없이 전체를 이해하기 어려운 경우.
  - 하나의 컴포넌트 안에 **시각적으로 뚜렷한 섹션**(예: 헤더, 탭, 메인 패널, 입력 영역)이 2~3개 이상인 경우.
  - 같은 패턴의 UI가 2번 이상 반복될 때(버튼 그룹, 카드, 리스트 아이템 등).

- **어떻게 분리할까?**
  - 1단계: 같은 파일 안에서 먼저 **서브컴포넌트**로 추출.
    - 예: `ProjectBreadcrumb`, `AiModeToggle`, `CanvasModeToggle`, `DrawerContextPanel`, `DrawerMainPanel`, `DrawerChatInput` 등.
  - 2단계: 재사용 가능성이 생기면 **전용 파일로 이동** (`components/.../cards/**`, `components/.../ui/**` 등).
  - 상위 컨테이너는 **데이터 흐름과 이벤트 핸들링**에 집중시키고, 시각/도메인 표현은 하위 컴포넌트로 내려보낸다.

### 4. 훅/상태 로직 정리

- **커스텀 훅 사용 원칙**
  - 복잡한 `useEffect`/스크롤 관리/이벤트 리스너 로직은 가능한 한 훅으로 분리.
  - 예: 우측 드로어의 스크롤/로딩 오버레이/키보드 핸들링 로직을 `useDrawerScroll`, `useDrawerLoadingOverlay` 등으로 추상화 가능.

- **스토리지/단축키 로직**
  - `useAdminMode`처럼 localStorage/sessionStorage, 전역 키보드 단축키를 다루는 로직은 **UI와 분리된 훅**으로 관리.
  - 훅의 **API는 stable**하게 유지하고, 내부 구현만 개선하는 방향으로 리팩터링한다.

### 5. 점진적 리팩터링 규칙 (Boy-Scout Rule)

- 기존 코드를 수정할 때마다 다음을 체크리스트처럼 적용:
  - 이 파일이 너무 크지 않은가? (300~400줄 이상인지 확인)
  - 역할이 다른 섹션(레이아웃/카드/입력창/패널 등)이 한 파일에 섞여 있지 않은가?
  - 도메인 로직이 UI 컴포넌트 안에 과도하게 들어가 있지 않은가?
  - 공용으로 쓸 수 있는 훅/유틸이 하위 폴더 깊숙이 묻혀 있지 않은가?
- 한 번에 전체를 바꾸기보다, **기능 추가/버그픽스와 함께 해당 파일만 조금씩 정리**하는 것을 기본 규칙으로 한다.

### 6. 테스트/QA와 함께 가기

- 자동 테스트가 부족한 구간은 **수동 QA 체크리스트**를 먼저 만들고, 모듈러 리팩터를 수행한다.
  - 예: `docs/thinkingMachine-qa.md`처럼 주요 인터랙션을 나열.
- 리팩터 이후에는 체크리스트를 기준으로 핵심 플로우를 다시 확인해 **동일 기능 보장**을 우선한다.

