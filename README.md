# WELLSET

> 오늘의 건강을, 내일의 자산으로.

WELLSET은 건강 상태를 확인하고 매일의 건강 행동을 기록해 `STACK`으로 쌓는 AI 건강자산 관리 플랫폼입니다. 현재 저장소는 공개 체험용 프론트엔드와 운영 MVP를 위한 Phase 0 기반 코드를 함께 포함합니다.

WELLSET 점수와 AI 안내는 질병의 진단, 치료 효과 또는 임상적 위험도를 의미하지 않습니다.

## 현재 구현 상태

- 반응형 서비스 랜딩과 5분 건강체크
- 건강체크 12문항과 생활습관 10문항의 2단계 진단
- 12대 건강자산 점수, 데이터 신뢰도, 우선관리 3개 결과
- 진단 중간 답변 자동저장과 이어하기
- 건강여권, 30일 미션, 커뮤니티 체험 화면
- 기존 코치 운영·고객관리 화면
- 12대 건강자산 메타데이터
- 누락 자료를 재정규화하는 건강자산 점수 엔진
- 점수와 분리된 STACK 계산 및 연속 기록일 계산
- 교체 가능한 AI Provider와 Mock AI 응답
- Supabase 브라우저 클라이언트 기반
- 핵심 테이블, 인덱스, RLS를 포함한 최초 migration

회원가입, 실제 서버 건강 기록 저장, 파일 업로드, 운영 AI 연결은 아직 구현 전입니다. Supabase 환경 변수가 없을 때 공개 데모는 Mock 데이터와 브라우저 임시 저장으로 동작합니다.

## 기술 구성

- Next.js 16 App Router
- React 19, TypeScript strict, Tailwind CSS
- Supabase JS/SSR, PostgreSQL/RLS migration
- Zod 기반 AI 응답 검증
- GitHub Pages 공개 데모

운영 버전은 서버 기능과 비공개 건강 파일 처리를 위해 Vercel + Supabase 배포로 전환할 예정입니다. GitHub Pages는 정적 데모용입니다.

## 로컬 실행

Node.js 22.13 이상이 필요합니다.

```bash
npm ci
copy .env.example .env.local
npm run dev
```

Supabase를 연결하려면 `.env.local`에 다음 공개 환경 변수를 설정합니다.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY`와 `AI_API_KEY`는 서버에서만 사용하며 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다.

## 검증

```bash
npm run lint
npm run typecheck
npm test
npm run build:pages
```

테스트 범위는 가중평균, 누락 자료 재정규화, 점수 구간, 데이터 신뢰도, STACK, 연속 기록일, Mock AI 응답 검증을 포함합니다.

## Supabase

최초 연결 전 Supabase CLI 또는 Dashboard에서 다음 파일 순서로 적용합니다.

1. `supabase/migrations/202607180001_wellset_core.sql`
2. 개발 환경에서만 `supabase/seed.sql`

migration은 추가 방식이며 기존 테이블을 삭제하지 않습니다. `stack_events`와 `daily_stack_summaries`는 사용자가 직접 수정할 수 없고 향후 신뢰된 서버 함수가 계산하도록 RLS 정책을 제한했습니다.

## 주요 폴더

```text
app/                  현재 공개 UI와 코치 운영 화면
config/               건강자산 영역과 STACK 규칙
lib/scoring.ts        건강자산 점수 엔진
lib/stack.ts          STACK 및 연속 기록 계산
lib/ai/               AI Provider, Mock, 스키마, 안전 분류
lib/supabase/         Supabase 환경과 브라우저 클라이언트
supabase/migrations/  추가형 PostgreSQL migration
tests/                핵심 도메인 단위 테스트
```

## 다음 단계

Phase 1에서 WELLSET 브랜드 적용, 로그인·회원가입, 모바일 앱 셸, 기본 프로필, 동의 화면과 온보딩 라우트를 구현합니다. 인증과 건강정보 저장을 실제로 활성화하기 전 Supabase 프로젝트 URL과 키가 필요합니다.

## 공개 데모

https://della2809-gif.github.io/test03/
