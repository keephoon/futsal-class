# 풋살 트레이닝 컴패니언 — V2 프로젝트 가이드

이 문서는 Claude Code에서 작업할 때 참고하는 단일 컨텍스트 파일입니다.

---

## 1. 프로젝트 개요

### 앱 정체성
- **V1 (현재)**: 여성 풋살 원데이클래스 "신청 랜딩 + 리포트 조회"
- **V2 (목표)**: 수강생의 개인 트레이닝 컴패니언 — 수업 복습, 셀프 기록, 성장 추적

### 기술 스택
- React 19 + Vite + Firebase Firestore + PWA
- 프로덕션: Vercel (futsal-class.vercel.app)
- 디자인: 다크테마 (글래스모피즘, `--orange:#FF5C00` 기반 토큰 시스템)

### Firestore 컬렉션 (현재)
- `schedules` — 클래스 일정
- `applications` — 수강 신청
- `participants` — 수강생 정보
- `reports` — 코치 작성 개인 리포트

---

## 2. 파일 구조

```
src/
  App.jsx            — 탭 라우팅, 이중네비, 상태관리
  App.css            — 전체 디자인 시스템 (~2000줄)
  firebase.js        — Firestore exports (getDoc 포함)
  components/
    HomeTab.jsx      — 랜딩/소개 탭
    ScheduleTab.jsx  — 일정 탭
    ReportLookup.jsx — 이름+전화 조회, 아코디언 리포트 목록
    ReportCard.jsx   — 개별 리포트 (Recharts, html2canvas 인스타 공유)
    AdminReport.jsx  — /admin 경로, 리포트/일정 관리
    ApplyModal.jsx   — 신청 모달 시트
    PWAInstallPrompt.jsx
```

### 기존 완료 작업 (건드리지 말 것)
1. YouTube URL 파서 (모든 포맷 지원)
2. 리포트 → Firestore schedules 실시간 조회
3. 다크테마 전면 리디자인 (디자인 토큰, 글래스모피즘)
4. 이중 네비게이션 (리포트 탭 카테고리 pill 바)
5. 탭바 SVG 아이콘 + 중앙 신청 버튼

### 주의사항
- `activeCategory` prop 체인: `App.jsx` → `ReportLookup` → `ReportCard`
- `CATEGORY_SECTIONS` 객체: `ReportCard.jsx` 내부
- 어드민 경로: `/admin` (비번 소스 하드코딩 — 추후 환경변수화 필요)

---

## 3. V2 탭 구조

**기존**: 홈 → 일정 → [신청] → 리포트
**변경**: MY → 리캡 → [신청] → 기록 → 일정

| 탭 | 설명 | 아이콘 |
|---|---|---|
| MY | 대시보드 + 리포트 | 사람 아이콘 |
| 리캡 | 수업 복습 + 기본기 라이브러리 | 재생/책 아이콘 |
| [신청] | 중앙 오렌지 볼 (기존 유지) | 기존 유지 |
| 기록 | 셀프 트레이닝 로그 | 연필/노트 아이콘 |
| 일정 | 스케줄 + 신청 (기존 유지) | 캘린더 아이콘 |

---

## 4. 핵심 신규 기능 설계

### 4-A. 세션 기반 자동 로그인
1. 최초 리포트 조회 시 이름+전화번호 입력
2. 조회 성공하면 sessionStorage에 저장
   `sessionStorage.setItem('user', JSON.stringify({ name, phone }))`
3. 앱 로드 시 sessionStorage에서 읽어 전역 상태로
4. 모든 탭에서 user 정보 활용 (리포트, 기록, 리캡 등)
5. 브라우저 탭 닫으면 자동 소멸 (보안)

구현 위치: `App.jsx`에서 `useState`로 `currentUser` 관리, 하위 컴포넌트에 prop 전달

### 4-B. 리캡 시스템

**(1) 기본기 라이브러리 (상시 존재)**
- 코치가 미리 등록해두는 기본기 "사전"
- 카테고리별 3~5개씩 체계적 구성
- 각 항목: 이름, 카테고리, YouTube 영상 URL, 핵심 포인트, 흔한 실수, 난이도

카테고리: `['드리블', '볼터치', '체력', '포지셔닝', '팀플레이']`

**(2) 수업별 리캡 (매 클래스 후 생성)**
- 코치가 수업 끝나고 어드민에서 생성
- 라이브러리에서 오늘 가르친 기본기 2~3개 선택 (참조)
- 코치 코멘트 추가
- 수강생 영상 URL 첨부 가능 (YouTube 비공개)

**수강생 측 리캡 탭 화면 구성:**
```
[리캡 탭]
├── 상단: 최근 수업 리캡 카드 (가장 최근 1개 펼쳐진 상태)
│   ├── 수업 날짜 + 제목
│   ├── 오늘 배운 기본기 목록 (라이브러리 참조 카드)
│   │   ├── 기본기 이름 + YouTube 영상
│   │   └── 핵심 포인트 + 흔한 실수
│   ├── 코치 코멘트
│   └── 연습 체크리스트 (체크박스, 로컬 상태)
├── 중단: 이전 리캡 목록 (아코디언)
└── 하단: "기본기 전체보기" 링크 → 라이브러리 뷰
    ├── 카테고리 pill 필터
    └── 기본기 카드 그리드
```

### 4-C. 셀프 트레이닝 기록
핵심 원칙: **3초 안에 기록 완료**

**기록 입력 UI:**
```
[+] 기록하기 버튼 (FAB 스타일)
  └── 바텀시트 or 모달
      ├── 날짜 (기본값: 오늘, 변경 가능)
      ├── 시간 (분 단위 슬라이더 or 숫자 입력, 10분 단위)
      └── 메모 (한 줄 텍스트, placeholder: "인사이드 터치 연습")
```

**기록 탭 화면 구성:**
```
[기록 탭]
├── 상단: 이번 달 요약 카드
│   ├── 총 셀프 트레이닝 시간
│   ├── 트레이닝 횟수
│   └── 연속 기록 일수 (스트릭)
├── 중단: 캘린더 히트맵 (월간, 기록 있는 날 하이라이트)
├── 하단: 최근 기록 리스트 (날짜 + 시간 + 메모)
└── FAB: [+] 기록하기
```

### 4-D. MY 탭 (대시보드)
기존 ReportLookup + 리포트 기능을 여기로 이동, 대시보드 요소 추가

```
[MY 탭]
├── (로그인 전) 이름+전화번호 입력 → 세션 저장
├── (로그인 후)
│   ├── 다음 클래스 D-day 카드
│   ├── 이번 주 활동 요약 (수업 n회, 셀프 n시간)
│   ├── 최근 코치 리포트 1개 미리보기
│   ├── 누적 통계 그래프 (Recharts)
│   └── 전체 리포트 보기 → 기존 아코디언 목록
```

---

## 5. Firestore 스키마 (신규 컬렉션)

### `skill_library` (기본기 라이브러리)
```js
{
  id: "auto",
  name: "인사이드 터치",
  category: "볼터치",
  videoUrl: "https://youtu.be/...",
  keyPoints: ["발 안쪽 중앙으로 터치", "무릎을 살짝 굽힌 상태 유지"],
  commonMistakes: ["발끝으로 터치하면 방향 제어가 안됨"],
  difficulty: "beginner",  // beginner | intermediate | advanced
  order: 1,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `class_recaps` (수업별 리캡)
```js
{
  id: "auto",
  scheduleId: "ref_to_schedules",
  date: Timestamp,
  title: "약한 발 인사이드 집중 훈련",
  skillRefs: ["skill_id_1", "skill_id_2"],
  coachComment: "오늘은 특히...",
  studentVideoUrls: ["https://youtu.be/..."],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `training_logs` (셀프 트레이닝 기록)
```js
{
  id: "auto",
  userName: "홍길동",
  userPhone: "01012345678",
  date: Timestamp,
  durationMin: 30,
  memo: "인사이드 터치 연습",
  createdAt: Timestamp
}
```

---

## 6. 구현 순서

### Phase 1: V1.0 — 기반 전환
- **Step 1**: 세션 로그인 (`App.jsx` `currentUser` 상태 + sessionStorage)
- **Step 2**: 탭 구조 변경 (MY → 리캡 → [신청] → 기록 → 일정)
- **Step 3**: 기본기 라이브러리 어드민 CRUD (`skill_library` 컬렉션)
- **Step 4**: 리캡 탭 수강생 뷰어 (`RecapTab.jsx`, 라이브러리 브라우징)

### Phase 2: V1.1 — 핵심 기능
- **Step 5**: 수업별 리캡 어드민 (리캡 생성 UI, `class_recaps` 저장)
- **Step 6**: 수업별 리캡 수강생 뷰 (skillRefs 연결, 체크리스트)
- **Step 7**: 셀프 트레이닝 기록 (`TrainingLogTab.jsx`, `training_logs` 저장)

### Phase 3: V1.2 — 대시보드 통합
- **Step 8**: MY 탭 대시보드 (D-day, 주간 요약, 리포트 미리보기, Recharts)

---

## 7. firebase.js 업데이트 필요사항

```js
// 추가 필요한 import
import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, deleteDoc, query, where, orderBy,
  limit, Timestamp, serverTimestamp
} from 'firebase/firestore';

// 이미 있는 것: db, getDoc
// 추가 확인: addDoc, updateDoc, deleteDoc, serverTimestamp
```

---

## 8. 디자인 가이드라인

### 기존 디자인 토큰 (App.css에 정의됨)
```css
--orange: #FF5C00;
--surface-1: /* 가장 어두운 배경 */
--surface-2: /* 카드 배경 */
--surface-3: /* 카드 내부 요소 */
--text-1:    /* 가장 밝은 텍스트 */
--text-2:    /* 보조 텍스트 */
--text-3:    /* 약한 텍스트 */
--text-4:    /* 가장 약한 텍스트 */
```

### 신규 컴포넌트 스타일 규칙
- 모든 카드: `backdrop-filter: blur()` + rgba 배경 (글래스모피즘)
- 버튼: `--orange` 기반, hover/active 상태 포함
- 입력 필드: `--surface-3` 배경, `--text-2` placeholder
- 카테고리 pill: 기존 이중 네비게이션 pill 스타일 재활용
- FAB (기록하기 버튼): 중앙 신청 버튼과 유사한 오렌지 원형
- YouTube 임베드: 16:9 비율 컨테이너, 라운드 코너

---

## 9. 어드민 확장

### 기존 구조 (AdminReport.jsx)
- 리포트 작성/수정
- 일정 관리

### 추가할 섹션
1. **기본기 라이브러리 관리** — CRUD, 카테고리 필터, YouTube 미리보기
2. **수업 리캡 관리** — 리캡 생성(일정 선택 → 기본기 선택 → 코멘트), 목록/수정/삭제

### 어드민 탭 구성
```
[어드민 상단 탭]
리포트 | 일정 | 라이브러리 | 리캡
```

---

## 10. 작업 시 체크리스트

### 매 Step 완료 후 확인
- [ ] `npm run dev`로 로컬 실행 확인
- [ ] 새 컬렉션이 있으면 Firebase 콘솔에서 인덱스 필요 여부 확인
- [ ] 기존 기능 (리포트 조회, 일정, 신청) 깨지지 않았는지 확인
- [ ] 모바일 뷰 (375px)에서 레이아웃 깨짐 없는지 확인
- [ ] 다크테마 토큰 사용 (하드코딩 색상 금지)

### 절대 하지 말 것
- `App.css`의 디자인 토큰 변수명 변경
- 기존 `CATEGORY_SECTIONS` 매핑 구조 변경
- `ReportCard`의 인스타 공유 기능 제거
- YouTube URL 파서 로직 수정 (이미 완성됨)
- 어드민 비번을 소스에 직접 노출 (현재 이슈이지만 이번에 해결할 것은 아님)
