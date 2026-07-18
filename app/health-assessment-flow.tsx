"use client";

import { useMemo, useState } from "react";
import { HEALTH_CHECK_QUESTIONS, LIFESTYLE_QUESTIONS, ASSESSMENT_QUESTIONS } from "../features/health-assessment/questions.ts";
import {
  calculateAssessmentResult,
  isAssessmentComplete,
} from "../features/health-assessment/scoring.ts";
import type {
  AssessmentAnswers,
  HealthAssessmentResult,
} from "../features/health-assessment/types.ts";

const STORAGE_KEY = "wellset-health-assessment-v1";

type AssessmentScreen = "intro" | "questions" | "lifestyle-intro" | "result";

export function HealthAssessmentFlow({
  onComplete,
  goPassport,
}: {
  onComplete: (result: HealthAssessmentResult) => void;
  goPassport: () => void;
}) {
  const [answers, setAnswers] = useState<AssessmentAnswers>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as AssessmentAnswers) : {};
    } catch {
      return {};
    }
  });
  const [index, setIndex] = useState(() => {
    if (typeof window === "undefined") return 0;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return 0;
      const parsed = JSON.parse(saved) as AssessmentAnswers;
      const firstMissing = ASSESSMENT_QUESTIONS.findIndex(
        (question) => parsed[question.id] === undefined,
      );
      return firstMissing < 0 ? 0 : firstMissing;
    } catch {
      return 0;
    }
  });
  const [screen, setScreen] = useState<AssessmentScreen>("intro");
  const [result, setResult] = useState<HealthAssessmentResult | null>(null);

  const current = ASSESSMENT_QUESTIONS[index];
  const answeredCount = Object.keys(answers).filter((id) =>
    ASSESSMENT_QUESTIONS.some((question) => question.id === id),
  ).length;
  const sectionLabel =
    current?.section === "health-check" ? "건강체크" : "생활습관 진단";
  const sectionNumber =
    current?.section === "health-check"
      ? index + 1
      : index - HEALTH_CHECK_QUESTIONS.length + 1;
  const sectionTotal =
    current?.section === "health-check"
      ? HEALTH_CHECK_QUESTIONS.length
      : LIFESTYLE_QUESTIONS.length;

  const progress = useMemo(
    () => Math.round((answeredCount / ASSESSMENT_QUESTIONS.length) * 100),
    [answeredCount],
  );

  function start() {
    if (isAssessmentComplete(answers)) {
      const completed = calculateAssessmentResult(answers);
      setResult(completed);
      setScreen("result");
      onComplete(completed);
      return;
    }
    setScreen(
      index === HEALTH_CHECK_QUESTIONS.length ? "lifestyle-intro" : "questions",
    );
  }

  function selectAnswer(value: number) {
    const nextAnswers = { ...answers, [current.id]: value };
    setAnswers(nextAnswers);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAnswers));

    const nextIndex = index + 1;
    if (nextIndex === HEALTH_CHECK_QUESTIONS.length) {
      setIndex(nextIndex);
      setScreen("lifestyle-intro");
      return;
    }
    if (nextIndex < ASSESSMENT_QUESTIONS.length) {
      setIndex(nextIndex);
      return;
    }

    const completed = calculateAssessmentResult(nextAnswers);
    setResult(completed);
    setScreen("result");
    onComplete(completed);
  }

  function goBack() {
    if (index === 0) {
      setScreen("intro");
      return;
    }
    const previous = index - 1;
    setIndex(previous);
    setScreen("questions");
  }

  function restart() {
    window.localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
    setIndex(0);
    setResult(null);
    setScreen("intro");
  }

  if (screen === "intro") {
    return (
      <main className="assessment-page assessment-intro">
        <div className="assessment-kicker">WELLSET HEALTH ASSESSMENT</div>
        <h1>나의 건강자산을<br />두 단계로 확인해보세요.</h1>
        <p>최근 몸의 신호와 생활습관을 함께 살펴 12대 건강자산과 오늘의 우선 행동을 안내합니다.</p>
        <div className="assessment-stage-grid">
          <article>
            <b>1</b><span>STEP 1</span><h2>건강체크</h2>
            <p>최근 2주 동안 느낀 몸의 신호를 확인합니다.</p>
            <strong>{HEALTH_CHECK_QUESTIONS.length}문항 · 약 3분</strong>
          </article>
          <article>
            <b>2</b><span>STEP 2</span><h2>생활습관 진단</h2>
            <p>식사, 수분, 운동, 수면과 관리 습관을 확인합니다.</p>
            <strong>{LIFESTYLE_QUESTIONS.length}문항 · 약 2분</strong>
          </article>
        </div>
        <div className="assessment-output">
          <span>완료하면 확인할 수 있어요</span>
          <div><b>건강자산 총점</b><b>12대 영역 점수</b><b>데이터 신뢰도</b><b>우선 행동 3개</b></div>
        </div>
        <button className="assessment-primary" onClick={start}>
          {answeredCount > 0 ? `이어서 진단하기 · ${progress}%` : "건강진단 시작하기"} <span>→</span>
        </button>
        <p className="assessment-disclaimer">WELLSET 건강자산 점수는 생활 관리를 위한 웰니스 지표이며 의료 진단이나 치료 효과를 의미하지 않습니다.</p>
      </main>
    );
  }

  if (screen === "lifestyle-intro") {
    const healthPreview = calculateAssessmentResult(answers);
    return (
      <main className="assessment-page assessment-transition">
        <div className="transition-check">✓</div>
        <div className="assessment-kicker">STEP 1 COMPLETE</div>
        <h1>건강체크를 완료했어요.</h1>
        <p>현재 응답만으로 본 임시 건강체크 점수는 <b>{healthPreview.symptomScore}점</b>이에요. 생활습관을 더하면 원인과 실천 방향을 구체적으로 볼 수 있습니다.</p>
        <div className="transition-confidence">
          <span>현재 데이터 신뢰도</span>
          <strong>{healthPreview.dataConfidence}%</strong>
          <i><b style={{ width: `${healthPreview.dataConfidence}%` }} /></i>
          <small>생활습관 진단 완료 시 최대 65%</small>
        </div>
        <button className="assessment-primary" onClick={() => setScreen("questions")}>생활습관 진단 계속하기 <span>→</span></button>
        <button className="assessment-back-link" onClick={goBack}>이전 답변 확인</button>
      </main>
    );
  }

  if (screen === "result" && result) {
    return (
      <AssessmentResult
        result={result}
        restart={restart}
        goPassport={goPassport}
      />
    );
  }

  return (
    <main className="assessment-page question-flow">
      <div className="assessment-topline">
        <button onClick={goBack} aria-label="이전 질문">←</button>
        <div>
          <span>{sectionLabel}</span>
          <b>{sectionNumber} / {sectionTotal}</b>
        </div>
        <em>자동 저장</em>
      </div>
      <div className="assessment-progress" aria-label={`전체 진행률 ${progress}%`}>
        <i style={{ width: `${progress}%` }} />
      </div>
      <div className="assessment-phase-tabs">
        <span className="active"><b>1</b>건강체크</span>
        <span className={current.section === "lifestyle" ? "active" : ""}><b>2</b>생활습관</span>
        <em>전체 {index + 1} / {ASSESSMENT_QUESTIONS.length}</em>
      </div>
      <section className="assessment-question-card">
        <div className="question-domain">{sectionLabel}</div>
        <h1>{current.prompt}</h1>
        <p>{current.helper}</p>
        <div className="assessment-options">
          {current.options.map((option) => (
            <button
              key={option.label}
              className={answers[current.id] === option.value ? "selected" : ""}
              onClick={() => selectAnswer(option.value)}
            >
              <i>{answers[current.id] === option.value ? "✓" : ""}</i>
              <span>{option.label}</span>
              <b>→</b>
            </button>
          ))}
        </div>
      </section>
      <p className="assessment-help">정답은 없습니다. 최근 2주의 평균적인 상태에 가장 가까운 답을 골라주세요.</p>
    </main>
  );
}

function AssessmentResult({
  result,
  restart,
  goPassport,
}: {
  result: HealthAssessmentResult;
  restart: () => void;
  goPassport: () => void;
}) {
  const [showMethod, setShowMethod] = useState(false);
  return (
    <main className="assessment-result-page">
      <section className="result-hero-new">
        <div>
          <div className="assessment-kicker">YOUR HEALTH ASSET RESULT</div>
          <h1>지금의 건강자산은<br /><em>{result.totalScore}점</em>입니다.</h1>
          <p>점수보다 중요한 것은 앞으로의 변화입니다. 우선순위가 높은 세 영역부터 작은 행동을 시작해보세요.</p>
          <div className="result-source-scores">
            <span>건강체크 <b>{result.symptomScore}</b></span>
            <span>생활습관 <b>{result.lifestyleScore}</b></span>
            <span>완료율 <b>{result.completionRate}%</b></span>
          </div>
        </div>
        <div className="result-main-ring" style={{ "--score": `${result.totalScore}%` } as React.CSSProperties}>
          <div><strong>{result.totalScore}</strong><span>건강자산</span></div>
        </div>
      </section>

      <section className="confidence-panel">
        <div>
          <span>데이터 신뢰도</span>
          <strong>{result.dataConfidence}%</strong>
          <i><b style={{ width: `${result.dataConfidence}%` }} /></i>
        </div>
        <p><b>현재 문진 데이터는 충분히 입력됐어요.</b> 건강검진을 추가하면 +20%, 인바디를 추가하면 +15%만큼 분석 근거가 보완됩니다.</p>
        <button onClick={() => setShowMethod(!showMethod)}>{showMethod ? "계산 방식 닫기" : "계산 방식 보기"}</button>
      </section>
      {showMethod && (
        <section className="method-panel">
          <div><b>증상 문진</b><span>35%</span><i className="filled" /></div>
          <div><b>생활습관</b><span>30%</span><i className="filled" /></div>
          <div><b>건강검진</b><span>20%</span><i /></div>
          <div><b>인바디</b><span>15%</span><i /></div>
          <p>없는 자료는 0점 처리하지 않고, 현재 입력된 자료의 가중치를 다시 합산해 점수를 계산합니다. 점수 버전: {result.scoreVersion}</p>
        </section>
      )}

      <section className="priority-result">
        <div className="result-section-head"><div><span>TOP PRIORITIES</span><h2>먼저 돌볼 건강자산 3가지</h2></div><p>낮은 점수는 질병을 의미하지 않으며, 생활 관리의 우선순위를 찾기 위한 참고 정보입니다.</p></div>
        <div className="priority-card-grid">
          {result.priorities.map((domain, index) => (
            <article key={domain.code}>
              <span>PRIORITY {index + 1}</span>
              <strong>{domain.score}</strong>
              <h3>{domain.name}</h3>
              <p>{domain.description}</p>
              <div><b>첫 번째 행동</b>{domain.recommendation}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="domain-result-section">
        <div className="result-section-head"><div><span>12 HEALTH ASSETS</span><h2>12대 건강자산 상세</h2></div><p>차트와 함께 영역명·점수·상태를 텍스트로 제공합니다.</p></div>
        <div className="domain-score-list">
          {result.domains.map((domain) => (
            <article key={domain.code}>
              <div><h3>{domain.name}</h3><p>{domain.description}</p></div>
              <i><b style={{ width: `${domain.score}%` }} /></i>
              <strong>{domain.score}</strong>
              <span className={domain.score < 60 ? "focus" : ""}>{domain.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="result-action-panel">
        <div><span>NEXT STEP</span><h2>결과를 건강통장에 저장하고<br />오늘의 첫 행동을 시작하세요.</h2><p>현재 데모에서는 이 브라우저에 안전하게 임시 저장됩니다.</p></div>
        <button className="assessment-primary" onClick={goPassport}>건강통장으로 이동 <span>→</span></button>
      </section>
      <div className="result-footer-actions">
        <button onClick={restart}>진단 다시 하기</button>
        <p>심한 흉통, 갑작스러운 호흡곤란, 마비나 의식 저하 같은 증상이 있다면 일반 코칭보다 즉시 의료기관 또는 응급서비스 확인이 우선입니다.</p>
      </div>
    </main>
  );
}
