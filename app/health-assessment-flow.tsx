"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HEALTH_CHECK_QUESTIONS, LIFESTYLE_QUESTIONS } from "../features/health-assessment/questions.ts";
import {
  ASSESSMENT_MODES,
  getQuestionsForMode,
  type AssessmentMode,
} from "../features/health-assessment/modes.ts";
import {
  calculateAssessmentResult,
  isAssessmentComplete,
} from "../features/health-assessment/scoring.ts";
import type {
  AssessmentAnswers,
  HealthAssessmentResult,
} from "../features/health-assessment/types.ts";
import {
  applyObjectiveData,
  assessBodyCompositionData,
  assessCheckupData,
  type MetricAssessment,
  type ObjectiveDataAssessment,
} from "../features/clinical-rules/index.ts";
import {
  extractCheckupValuesFromText,
  type CheckupPdfExtraction,
} from "../features/clinical-rules/pdf-extraction.ts";
import { getPdfPasswordErrorKind } from "../features/clinical-rules/pdf-password.ts";
import { localizeQuestion } from "../features/health-assessment/i18n.ts";
import { recommendJournalContent } from "../lib/journal-content.ts";
import {
  recordJourneyEvent,
  type JourneyContext,
} from "../lib/journey-tracking.ts";
import { useI18n } from "./i18n-provider";

const STORAGE_KEY = "wellset-health-assessment-v1";

type AssessmentScreen = "intro" | "questions" | "lifestyle-intro" | "result";

export function HealthAssessmentFlow({
  onComplete,
  goPassport,
  mode = ASSESSMENT_MODES.full,
  journeyContext = {},
}: {
  onComplete: (result: HealthAssessmentResult) => void;
  goPassport: () => void;
  mode?: AssessmentMode;
  journeyContext?: JourneyContext;
}) {
  const { locale } = useI18n();
  const assessmentQuestions = useMemo(
    () => getQuestionsForMode(mode),
    [mode],
  );
  const storageKey = `${STORAGE_KEY}-${mode.id}`;
  const isFullAssessment = mode.id === "full";
  const [answers, setAnswers] = useState<AssessmentAnswers>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = window.localStorage.getItem(storageKey);
      return saved ? (JSON.parse(saved) as AssessmentAnswers) : {};
    } catch {
      return {};
    }
  });
  const [index, setIndex] = useState(() => {
    if (typeof window === "undefined") return 0;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return 0;
      const parsed = JSON.parse(saved) as AssessmentAnswers;
      const firstMissing = assessmentQuestions.findIndex(
        (question) => parsed[question.id] === undefined,
      );
      return firstMissing < 0 ? 0 : firstMissing;
    } catch {
      return 0;
    }
  });
  const [screen, setScreen] = useState<AssessmentScreen>("intro");
  const [result, setResult] = useState<HealthAssessmentResult | null>(null);

  const current = assessmentQuestions[index];
  const localizedCurrent = current ? localizeQuestion(current, locale) : current;
  const answeredCount = Object.keys(answers).filter((id) =>
    assessmentQuestions.some((question) => question.id === id),
  ).length;
  const currentSectionQuestions = assessmentQuestions.filter(
    (question) => question.section === current?.section,
  );
  const sectionLabel = locale === "en"
    ? current?.section === "health-check" ? "Health Check" : "Lifestyle"
    : current?.section === "health-check" ? "건강체크" : "생활습관 진단";
  const sectionNumber =
    currentSectionQuestions.findIndex((question) => question.id === current?.id) +
    1;
  const sectionTotal = currentSectionQuestions.length;

  const progress = useMemo(
    () => Math.round((answeredCount / assessmentQuestions.length) * 100),
    [answeredCount, assessmentQuestions.length],
  );

  function start() {
    const modeComplete = assessmentQuestions.every(
      (question) => answers[question.id] !== undefined,
    );
    if (
      (isFullAssessment && isAssessmentComplete(answers)) ||
      (!isFullAssessment && modeComplete)
    ) {
      const completed = calculateAssessmentResult(answers);
      setResult(completed);
      setScreen("result");
      onComplete(completed);
      return;
    }
    setScreen("questions");
  }

  function selectAnswer(value: number) {
    const nextAnswers = { ...answers, [current.id]: value };
    setAnswers(nextAnswers);
    window.localStorage.setItem(storageKey, JSON.stringify(nextAnswers));

    const nextIndex = index + 1;
    const nextQuestion = assessmentQuestions[nextIndex];
    if (
      isFullAssessment &&
      current.section === "health-check" &&
      nextQuestion?.section === "lifestyle"
    ) {
      setIndex(nextIndex);
      setScreen("lifestyle-intro");
      return;
    }
    if (nextIndex < assessmentQuestions.length) {
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
    window.localStorage.removeItem(storageKey);
    setAnswers({});
    setIndex(0);
    setResult(null);
    setScreen("intro");
  }

  if (screen === "intro") {
    return (
      <main className="assessment-page assessment-intro">
        <div className="assessment-kicker">
          {isFullAssessment
            ? "WELLSET HEALTH ASSESSMENT"
            : "WELLSET QUICK ASSET CHECK"}
        </div>
        <h1>
          {isFullAssessment ? (
            locale === "en" ? (
              <>Discover your health assets<br />in two simple steps.</>
            ) : (
              <>나의 건강자산을<br />두 단계로 확인해보세요.</>
            )
          ) : (
            <>{mode.title}<br />지금 간편하게 확인해보세요.</>
          )}
        </h1>
        <p>{isFullAssessment ? (locale === "en" ? "Review recent body signals and lifestyle habits to identify 12 health assets and your next priority action." : mode.description) : mode.description}</p>
        {isFullAssessment ? <div className="assessment-stage-grid">
          <article>
            <b>1</b><span>STEP 1</span><h2>{locale === "en" ? "Health Check" : "건강체크"}</h2>
            <p>{locale === "en" ? "Review body signals from the past two weeks." : "최근 2주 동안 느낀 몸의 신호를 확인합니다."}</p>
            <strong>{HEALTH_CHECK_QUESTIONS.length} {locale === "en" ? "questions · about 3 min" : "문항 · 약 3분"}</strong>
          </article>
          <article>
            <b>2</b><span>STEP 2</span><h2>{locale === "en" ? "Lifestyle" : "생활습관 진단"}</h2>
            <p>{locale === "en" ? "Review nutrition, hydration, activity, sleep and self-care." : "식사, 수분, 운동, 수면과 관리 습관을 확인합니다."}</p>
            <strong>{LIFESTYLE_QUESTIONS.length} {locale === "en" ? "questions · about 2 min" : "문항 · 약 2분"}</strong>
          </article>
        </div> : (
          <div className="mini-assessment-summary">
            <span>{assessmentQuestions.length}개 문항</span>
            <strong>{mode.duration}</strong>
            <p>선택한 건강영역만 살펴보는 부분 점검이며, 전체 12대 건강자산 진단을 대신하지 않습니다.</p>
          </div>
        )}
        {isFullAssessment && <div className="assessment-output">
          <span>완료하면 확인할 수 있어요</span>
          <div><b>건강자산 총점</b><b>12대 영역 점수</b><b>데이터 신뢰도</b><b>우선 행동 3개</b></div>
        </div>}
        <button className="assessment-primary" onClick={start}>
          {answeredCount > 0 ? (locale === "en" ? `Continue · ${progress}%` : `이어서 확인하기 · ${progress}%`) : (locale === "en" ? "Start assessment" : isFullAssessment ? "건강진단 시작하기" : "간편 체크 시작하기")} <span>→</span>
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
        mode={mode}
        journeyContext={journeyContext}
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
        {isFullAssessment ? (
          <>
            <span className="active"><b>1</b>건강체크</span>
            <span className={current.section === "lifestyle" ? "active" : ""}><b>2</b>생활습관</span>
          </>
        ) : (
          <span className="active"><b>✓</b>{mode.title}</span>
        )}
        <em>전체 {index + 1} / {assessmentQuestions.length}</em>
      </div>
      <section className="assessment-question-card">
        <div className="question-domain">{sectionLabel}</div>
        <h1>{localizedCurrent.prompt}</h1>
        <p>{localizedCurrent.helper}</p>
        <div className="assessment-options">
          {localizedCurrent.options.map((option) => (
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
      <p className="assessment-help">{locale === "en" ? "There are no right answers. Choose what best reflects your average over the past two weeks." : "정답은 없습니다. 최근 2주의 평균적인 상태에 가장 가까운 답을 골라주세요."}</p>
    </main>
  );
}

function AssessmentResult({
  result,
  restart,
  goPassport,
  mode,
  journeyContext,
}: {
  result: HealthAssessmentResult;
  restart: () => void;
  goPassport: () => void;
  mode: AssessmentMode;
  journeyContext: JourneyContext;
}) {
  const [showMethod, setShowMethod] = useState(false);
  const [inputPanel, setInputPanel] = useState<"checkup" | "inbody" | null>(
    null,
  );
  const [checkupSaved, setCheckupSaved] = useState(false);
  const [inbodySaved, setInbodySaved] = useState(false);
  const [checkupUpload, setCheckupUpload] = useState("");
  const [inbodyUpload, setInbodyUpload] = useState("");
  const [checkupUploadStatus, setCheckupUploadStatus] = useState<
    | "idle"
    | "processing"
    | "ocr"
    | "password-required"
    | "review-required"
    | "applied"
    | "partial"
    | "failed"
  >("idle");
  const [checkupUploadMessage, setCheckupUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [protectedPdf, setProtectedPdf] = useState<File | null>(null);
  const [pdfPassword, setPdfPassword] = useState("");
  const [checkupValues, setCheckupValues] = useState<Record<string, string>>(
    {},
  );
  const [inbodyValues, setInbodyValues] = useState<Record<string, string>>({});
  const checkupAssessment = useMemo(
    () => (checkupSaved ? assessCheckupData(checkupValues) : undefined),
    [checkupSaved, checkupValues],
  );
  const bodyAssessment = useMemo(
    () =>
      inbodySaved ? assessBodyCompositionData(inbodyValues) : undefined,
    [inbodySaved, inbodyValues],
  );
  const displayResult = useMemo(
    () =>
      applyObjectiveData(result, {
        checkup: checkupAssessment,
        bodyComposition: bodyAssessment,
      }),
    [result, checkupAssessment, bodyAssessment],
  );
  const enhancedConfidence = displayResult.dataConfidence;
  const isFullAssessment = mode.id === "full";
  const modeDomains = useMemo(
    () =>
      isFullAssessment
        ? displayResult.domains
        : displayResult.domains.filter((domain) =>
            mode.domainCodes.includes(domain.code),
          ),
    [displayResult.domains, isFullAssessment, mode.domainCodes],
  );
  const visiblePriorities = useMemo(
    () => [...modeDomains].sort((a, b) => a.score - b.score).slice(0, 3),
    [modeDomains],
  );
  const displayedScore = isFullAssessment
    ? displayResult.totalScore
    : Math.round(
        modeDomains.reduce((sum, domain) => sum + domain.score, 0) /
          Math.max(modeDomains.length, 1),
      );
  const recommendations = useMemo(
    () =>
      recommendJournalContent(
        visiblePriorities.map((domain) => domain.code),
      ),
    [visiblePriorities],
  );
  const objectiveAssessments = [checkupAssessment, bodyAssessment].filter(
    (item): item is ObjectiveDataAssessment => item !== undefined,
  );
  const objectiveMetricsByDomain = useMemo(() => {
    const mapped: Record<string, MetricAssessment[]> = {};
    for (const assessment of [checkupAssessment, bodyAssessment]) {
      for (const item of assessment?.metrics ?? []) {
        for (const domainCode of item.domains) {
          mapped[domainCode] = [...(mapped[domainCode] ?? []), item];
        }
      }
    }
    return mapped;
  }, [checkupAssessment, bodyAssessment]);

  function openInput(type: "checkup" | "inbody") {
    setInputPanel(type);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearProtectedPdf() {
    setProtectedPdf(null);
    setPdfPassword("");
  }

  function applyOcrResult(
    parsed: CheckupPdfExtraction,
    options: { pagesProcessed?: number; totalPages?: number } = {},
  ) {
    if (parsed.foundFields.length === 0) {
      clearProtectedPdf();
      setCheckupUploadStatus("failed");
      setCheckupUploadMessage(
        "OCR로 문자를 읽었지만 건강검진 수치를 찾지 못했습니다. 선명한 원본을 다시 촬영하거나 수치를 직접 입력해주세요.",
      );
      return false;
    }

    setCheckupValues((current) => ({
      ...current,
      ...parsed.values,
      bpContext: current.bpContext ?? "office",
    }));
    setCheckupSaved(false);
    clearProtectedPdf();
    setCheckupUploadStatus("review-required");
    const pageNotice = options.pagesProcessed
      ? ` ${options.pagesProcessed}쪽을 확인했습니다.`
      : "";
    setCheckupUploadMessage(
      `12건강축에 필요한 수치 ${parsed.foundFields.length}개를 찾았습니다.${pageNotice} 원본과 대조해 확인한 뒤에만 반영됩니다.`,
    );
    setInputPanel("checkup");
    window.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  }

  async function analyzeCheckupImage(file: File) {
    setCheckupUploadStatus("ocr");
    setOcrProgress(0);
    setCheckupUploadMessage(
      "이미지에서 한국어·영문 검사항목과 수치를 인식하고 있습니다.",
    );
    try {
      const { recognizeHealthDocumentImage } = await import(
        "../features/clinical-rules/client-ocr.ts"
      );
      const result = await recognizeHealthDocumentImage(file, (progress) => {
        setOcrProgress(progress.percent);
        setCheckupUploadMessage(progress.message);
      });
      applyOcrResult(result, result);
    } catch {
      setCheckupUploadStatus("failed");
      setCheckupUploadMessage(
        "OCR를 실행하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도하거나 수치를 직접 입력해주세요.",
      );
    }
  }

  async function analyzeScannedPdf(
    pdf: Awaited<ReturnType<(typeof import("unpdf"))["getDocumentProxy"]>>,
  ) {
    setCheckupUploadStatus("ocr");
    setOcrProgress(0);
    setCheckupUploadMessage(
      "스캔 PDF를 이미지로 변환해 OCR로 읽고 있습니다. 잠시 기다려주세요.",
    );
    const { recognizeHealthDocumentPdf } = await import(
      "../features/clinical-rules/client-ocr.ts"
    );
    const result = await recognizeHealthDocumentPdf(pdf, (progress) => {
      setOcrProgress(progress.percent);
      setCheckupUploadMessage(progress.message);
    });
    return applyOcrResult(result, result);
  }

  async function analyzeCheckupPdf(file: File, password?: string) {
    setCheckupUploadStatus("processing");
    setCheckupUploadMessage(
      password
        ? "입력한 암호로 PDF를 열어 건강검진 수치를 읽고 있습니다."
        : "PDF에서 건강검진 수치를 읽고 있습니다.",
    );
    try {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(
        new Uint8Array(await file.arrayBuffer()),
        password ? { password } : undefined,
      );
      try {
        const extracted = await extractText(pdf, { mergePages: true });
        const parsed = extractCheckupValuesFromText(extracted.text);

        if (parsed.foundFields.length === 0) {
          await analyzeScannedPdf(pdf);
          return;
        }

        applyOcrResult(parsed, {
          pagesProcessed: pdf.numPages,
          totalPages: pdf.numPages,
        });
      } finally {
        await pdf.destroy();
      }
    } catch (error) {
      const passwordError = getPdfPasswordErrorKind(error);
      if (passwordError) {
        setProtectedPdf(file);
        setPdfPassword("");
        setCheckupUploadStatus("password-required");
        setCheckupUploadMessage(
          passwordError === "incorrect"
            ? "암호가 맞지 않습니다. PDF 암호를 다시 입력해주세요."
            : "암호로 보호된 PDF입니다. 아래에 PDF 암호를 입력해주세요.",
        );
        return;
      }
      clearProtectedPdf();
      setCheckupUploadStatus("failed");
      setCheckupUploadMessage(
        "PDF 또는 OCR 처리를 완료하지 못했습니다. 인터넷 연결과 파일 상태를 확인한 뒤 다시 시도해주세요.",
      );
    }
  }

  async function selectUpload(type: "checkup" | "inbody", file?: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("파일 크기는 10MB 이하만 선택할 수 있습니다.");
      return;
    }
    setUploadError("");
    if (type === "checkup") {
      clearProtectedPdf();
      setCheckupUpload(file.name);
      if (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
      ) {
        await analyzeCheckupPdf(file);
        return;
      }
      await analyzeCheckupImage(file);
      return;
    } else {
      setInbodyUpload(file.name);
    }
    openInput(type);
  }

  if (inputPanel) {
    const isCheckup = inputPanel === "checkup";
    return (
      <main className="assessment-objective-page">
        <button
          className="objective-page-back"
          onClick={() => setInputPanel(null)}
        >
          ← 건강자산 결과로 돌아가기
        </button>
        <div className="objective-page-progress">
          <span>건강진단 완료</span><i>→</i>
          <b>{isCheckup ? "건강검진 입력" : "인바디 입력"}</b><i>→</i>
          <span>신뢰도 반영</span>
        </div>
        <ObjectiveDataForm
          type={inputPanel}
          selectedFileName={isCheckup ? checkupUpload : inbodyUpload}
          initialValues={isCheckup ? checkupValues : inbodyValues}
          onCancel={() => setInputPanel(null)}
          onSave={(values) => {
            if (isCheckup) {
              setCheckupValues(values);
              setCheckupSaved(true);
              if (checkupUploadStatus === "review-required") {
                setCheckupUploadStatus("applied");
                setCheckupUploadMessage(
                  "OCR로 인식한 수치를 확인해 건강자산 점수와 데이터 신뢰도에 반영했습니다.",
                );
              }
            } else {
              setInbodyValues(values);
              setInbodySaved(true);
            }
            setInputPanel(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </main>
    );
  }

  return (
    <main className="assessment-result-page">
      <section className="result-hero-new">
        <div>
          <div className="assessment-kicker">
            {isFullAssessment
              ? "YOUR HEALTH ASSET RESULT"
              : "YOUR QUICK ASSET CHECK"}
          </div>
          <h1>{isFullAssessment ? "지금의 건강자산은" : `${mode.title} 결과는`}<br /><em>{displayedScore}점</em>입니다.</h1>
          <p>{isFullAssessment ? "점수보다 중요한 것은 앞으로의 변화입니다. 우선순위가 높은 세 영역부터 작은 행동을 시작해보세요." : "선택한 건강영역을 간편하게 살펴본 부분 점검 결과입니다. 작은 행동을 시작하고 필요하면 전체 건강진단을 이어가세요."}</p>
          <div className="result-source-scores">
            {isFullAssessment ? (
              <>
                <span>건강체크 <b>{result.symptomScore}</b></span>
                <span>생활습관 <b>{result.lifestyleScore}</b></span>
              </>
            ) : (
              <span>간편 체크 <b>{mode.questionIds.length}문항</b></span>
            )}
            {checkupAssessment?.sourceScore !== null &&
              checkupAssessment?.sourceScore !== undefined && (
                <span>검진 기준 환산 <b>{checkupAssessment.sourceScore}</b></span>
              )}
            {bodyAssessment?.sourceScore !== null &&
              bodyAssessment?.sourceScore !== undefined && (
                <span>BMI 기준 환산 <b>{bodyAssessment.sourceScore}</b></span>
              )}
            <span>체크 완료 <b>100%</b></span>
          </div>
        </div>
        <div className="result-main-ring" style={{ "--score": `${displayedScore}%` } as React.CSSProperties}>
          <div><strong>{displayedScore}</strong><span>{isFullAssessment ? "건강자산" : "부분 점검"}</span></div>
        </div>
      </section>

      {isFullAssessment ? <section className="confidence-panel">
        <div>
          <span>데이터 신뢰도</span>
          <strong>{enhancedConfidence}%</strong>
          <i><b style={{ width: `${enhancedConfidence}%` }} /></i>
        </div>
        <p><b>{enhancedConfidence === 100 ? "문진과 객관적 자료가 모두 입력됐어요." : "현재 문진 데이터는 충분히 입력됐어요."}</b> 유효한 건강검진 수치는 +20%, BMI는 +15%만큼 분석 근거가 보완됩니다.</p>
        <button onClick={() => setShowMethod(!showMethod)}>{showMethod ? "계산 방식 닫기" : "계산 방식 보기"}</button>
      </section> : (
        <section className="confidence-panel mini-result-notice">
          <div>
            <span>간편 체크 완료</span>
            <strong>100%</strong>
            <i><b style={{ width: "100%" }} /></i>
          </div>
          <p><b>{mode.domainCodes.length}개 관련 건강축을 확인했어요.</b> 이 결과는 전체 12대 건강자산 진단이나 의료 진단을 대신하지 않습니다.</p>
          <Link href="/?view=check&mode=full">전체 건강진단</Link>
        </section>
      )}
      {objectiveAssessments.length > 0 && (
        <section className="clinical-reference-panel">
          <div className="clinical-reference-head">
            <div>
              <span>GUIDELINE-INFORMED INTERPRETATION</span>
              <h2>검진 수치 기준 해석</h2>
            </div>
            <b>진단 아님</b>
          </div>
          <p className="clinical-reference-notice">
            공식 진료지침의 경계값으로 범위를 분류했습니다. 한 번의 수치만으로
            질병을 확정하지 않으며, WELLSET 점수 환산은 코칭 우선순위를 위한
            내부 규칙입니다.
          </p>
          <div className="clinical-metric-grid">
            {objectiveAssessments.flatMap((assessment) =>
              assessment.metrics.map((item) => (
                <article key={`${assessment.kind}-${item.id}`}>
                  <div>
                    <h3>{item.label}</h3>
                    <strong>{item.value}</strong>
                  </div>
                  <span className={`clinical-band ${item.band}`}>
                    {item.bandLabel}
                  </span>
                  <p>{item.interpretation}</p>
                  <div className="clinical-domain-links">
                    <b>{item.wellnessScore === null ? "관련 항목 참고" : "건강자산 점수 반영"}</b>
                    {item.domains.map((code) => (
                      <span key={code}>
                        {displayResult.domains.find((domain) => domain.code === code)?.name ?? code}
                      </span>
                    ))}
                  </div>
                </article>
              )),
            )}
          </div>
          {objectiveAssessments.flatMap((item) => item.excludedMetrics).map((notice) => (
            <p className="clinical-exclusion" key={notice}>※ {notice}</p>
          ))}
          <div className="clinical-source-links">
            <a href="https://law.go.kr/LSW/flDownload.do?bylClsCd=200203&flNm=%5B%EB%B3%84%EC%A7%80+6%5D+%EC%9D%BC%EB%B0%98%EA%B1%B4%EA%B0%95%EA%B2%80%EC%A7%84+%EA%B2%B0%EA%B3%BC%ED%86%B5%EB%B3%B4%EC%84%9C&flSeq=160922671" target="_blank" rel="noreferrer">2026 국가건강검진 기준</a>
            <a href="https://www.e-dmj.org/upload/pdf/dmj-2024-0249.pdf" target="_blank" rel="noreferrer">대한당뇨병학회</a>
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9930285/" target="_blank" rel="noreferrer">대한고혈압학회</a>
            <a href="https://www.lipid.or.kr/dtp/diagnosis.php" target="_blank" rel="noreferrer">한국지질·동맥경화학회</a>
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10088549/" target="_blank" rel="noreferrer">대한비만학회</a>
            <a href="https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf" target="_blank" rel="noreferrer">KDIGO 신장 기준</a>
            <a href="https://www.who.int/publications/i/item/9789240088542" target="_blank" rel="noreferrer">WHO 혈색소 기준</a>
            <a href="https://medlineplus.gov/lab-tests/complete-blood-count-cbc/" target="_blank" rel="noreferrer">NIH 혈구검사 해설</a>
            <a href="https://medlineplus.gov/lab-tests/c-reactive-protein-crp-test/" target="_blank" rel="noreferrer">NIH CRP 해설</a>
            <a href="https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/" target="_blank" rel="noreferrer">NIH 비타민 D 기준</a>
            <a href="https://www.thyroid.org/wp-content/uploads/2026/01/thyroid-stimulating-hormone-and-thyroid-hormones-triiodothyronine-and-thyroxine-an-american-thyroid-association.pdf" target="_blank" rel="noreferrer">미국갑상선학회 TSH 해설</a>
          </div>
        </section>
      )}
      <section className="objective-entry-panel">
        <div className="objective-entry-head">
          <div>
            <span>ADD OBJECTIVE DATA</span>
            <h2>객관적 자료를 추가해 분석 근거를 높이세요.</h2>
            <p>수치를 직접 입력하거나 결과지 이미지·PDF를 선택할 수 있습니다.</p>
          </div>
          <b>최대 신뢰도 100%</b>
        </div>
        <div className="objective-entry-grid">
          <article className={checkupSaved ? "complete" : ""}>
            <div className="objective-entry-title">
              <i>{checkupSaved ? "✓" : "01"}</i>
              <div><h3>건강검진</h3><p>복부·혈액·혈당·지질·간·신장 수치</p></div>
              <strong>+20%</strong>
            </div>
            {checkupUpload && (
              <div className="selected-upload">
                📄 {checkupUpload}
                <span className={checkupUploadStatus}>
                  {checkupUploadStatus === "processing"
                    ? "분석 중"
                    : checkupUploadStatus === "ocr"
                      ? `OCR ${ocrProgress}%`
                    : checkupUploadStatus === "applied"
                      ? "자동 반영 완료"
                      : checkupUploadStatus === "partial"
                        ? "확인 수치 반영"
                        : checkupUploadStatus === "password-required"
                          ? "암호 입력 필요"
                        : checkupUploadStatus === "review-required"
                          ? "수치 확인 필요"
                        : checkupUploadStatus === "failed"
                          ? "자동 인식 실패"
                          : "수치 확인 필요"}
                </span>
              </div>
            )}
            {checkupUploadMessage && (
              <p
                className={`upload-analysis-message ${checkupUploadStatus}`}
                role={checkupUploadStatus === "failed" ? "alert" : "status"}
              >
                {checkupUploadMessage}
              </p>
            )}
            {checkupUploadStatus === "ocr" && (
              <div
                className="ocr-progress"
                role="progressbar"
                aria-label="건강검진 OCR 진행률"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={ocrProgress}
              >
                <i><b style={{ width: `${ocrProgress}%` }} /></i>
                <span>{ocrProgress}%</span>
              </div>
            )}
            {checkupUploadStatus === "password-required" && protectedPdf && (
              <form
                className="pdf-password-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!pdfPassword) return;
                  void analyzeCheckupPdf(protectedPdf, pdfPassword);
                }}
              >
                <label htmlFor="checkup-pdf-password">PDF 암호</label>
                <div>
                  <input
                    id="checkup-pdf-password"
                    type="password"
                    value={pdfPassword}
                    onChange={(event) => setPdfPassword(event.target.value)}
                    placeholder="PDF를 열 때 사용하는 암호"
                    autoComplete="off"
                    autoFocus
                    required
                  />
                  <button type="submit">암호로 열기</button>
                </div>
                <small>
                  암호는 이 기기에서 PDF를 여는 데만 사용되며 저장되거나
                  전송되지 않습니다.
                </small>
                <button
                  type="button"
                  className="pdf-password-cancel"
                  onClick={() => {
                    clearProtectedPdf();
                    setCheckupUploadStatus("failed");
                    setCheckupUploadMessage(
                      "암호 입력을 취소했습니다. 다른 결과지를 업로드하거나 수치를 직접 입력할 수 있습니다.",
                    );
                  }}
                >
                  취소
                </button>
              </form>
            )}
            <div className="objective-entry-buttons">
              <button onClick={() => openInput("checkup")}>
                {checkupSaved ? "입력 수치 수정" : "수치 직접 입력"}
              </button>
              <label>
                결과지 업로드
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    void selectUpload("checkup", file);
                  }}
                />
              </label>
            </div>
          </article>
          <article className={inbodySaved ? "complete" : ""}>
            <div className="objective-entry-title">
              <i>{inbodySaved ? "✓" : "02"}</i>
              <div><h3>인바디</h3><p>체중·체지방·골격근·내장지방</p></div>
              <strong>+15%</strong>
            </div>
            {inbodyUpload && <div className="selected-upload">📄 {inbodyUpload}<span>수치 확인 필요</span></div>}
            <div className="objective-entry-buttons">
              <button onClick={() => openInput("inbody")}>
                {inbodySaved ? "입력 수치 수정" : "수치 직접 입력"}
              </button>
              <label>
                결과지 업로드
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    void selectUpload("inbody", file);
                  }}
                />
              </label>
            </div>
          </article>
        </div>
        {uploadError && <p className="upload-error" role="alert">{uploadError}</p>}
        <p className="upload-privacy">🔒 건강검진 이미지·PDF와 입력한 PDF 암호는 이 기기에서만 분석에 사용하며 서버로 전송하거나 저장하지 않습니다. OCR 인식 수치는 확인 후 관련 건강자산 항목과 데이터 신뢰도에 반영됩니다.</p>
      </section>
      {showMethod && (
        <section className="method-panel">
          <div><b>증상 문진</b><span>35%</span><i className="filled" /></div>
          <div><b>생활습관</b><span>30%</span><i className="filled" /></div>
          <div><b>건강검진</b><span>20%</span><i className={checkupSaved ? "filled" : ""} /></div>
          <div><b>인바디</b><span>15%</span><i className={inbodySaved ? "filled" : ""} /></div>
          <p>없는 자료는 0점 처리하지 않고, 현재 입력된 자료의 가중치를 다시 합산합니다. 임상 경계값과 0–100점 환산은 서로 다른 규칙입니다. 점수 버전: {displayResult.scoreVersion}</p>
        </section>
      )}

      <section className="priority-result">
        <div className="result-section-head"><div><span>TOP PRIORITIES</span><h2>먼저 돌볼 건강자산 3가지</h2></div><p>낮은 점수는 질병을 의미하지 않으며, 생활 관리의 우선순위를 찾기 위한 참고 정보입니다.</p></div>
        <div className="priority-card-grid">
          {visiblePriorities.map((domain, index) => (
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

      {isFullAssessment && <section className="domain-result-section">
        <div className="result-section-head"><div><span>12 HEALTH ASSETS</span><h2>12대 건강자산 상세</h2></div><p>차트와 함께 영역명·점수·상태를 텍스트로 제공합니다.</p></div>
        <div className="domain-score-list">
          {displayResult.domains.map((domain) => (
            <article key={domain.code}>
              <div>
                <h3>{domain.name}</h3>
                <p>{domain.description}</p>
                {(objectiveMetricsByDomain[domain.code]?.length ?? 0) > 0 && (
                  <div className="domain-objective-values">
                    <b>검진 반영</b>
                    {objectiveMetricsByDomain[domain.code].map((item) => (
                      <span key={`${domain.code}-${item.id}`}>
                        <strong>{item.label}</strong>
                        {item.value}
                        <em>{item.wellnessScore === null ? "참고" : "점수 반영"}</em>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <i><b style={{ width: `${domain.score}%` }} /></i>
              <strong>{domain.score}</strong>
              <span className={domain.score < 60 ? "focus" : ""}>{domain.status}</span>
            </article>
          ))}
        </div>
      </section>}

      <section className="journal-recommendation-section">
        <div className="result-section-head">
          <div><span>WELLSET JOURNAL</span><h2>지금 결과에 맞는 읽을거리</h2></div>
          <p>점수가 낮게 나온 건강축과 바로 실천하기 좋은 주제를 기준으로 추천합니다.</p>
        </div>
        <div className="journal-recommendation-grid">
          {recommendations.map((item) => (
            <a
              key={item.id}
              href={item.href.replace(
                "/#",
                "/?utm_source=wellset_health_account&utm_medium=result_recommendation#",
              )}
              onClick={() =>
                recordJourneyEvent("recommended_content_clicked", {
                  ...journeyContext,
                  contentId: item.id,
                })
              }
            >
              <span>{item.category}</span>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <b>WELLSET Journal에서 읽기 →</b>
            </a>
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

const CHECKUP_FIELDS = [
  { group: "기본·혈압", id: "waist", label: "허리둘레", unit: "cm", min: 30, max: 250, step: 0.1 },
  { group: "기본·혈압", id: "systolic", label: "수축기 혈압", unit: "mmHg", min: 50, max: 260, step: 1 },
  { group: "기본·혈압", id: "diastolic", label: "이완기 혈압", unit: "mmHg", min: 30, max: 180, step: 1 },
  { group: "혈당·지질", id: "fastingGlucose", label: "공복혈당", unit: "mg/dL", min: 30, max: 600, step: 1 },
  { group: "혈당·지질", id: "hba1c", label: "당화혈색소", unit: "%", min: 2, max: 20, step: 0.1 },
  { group: "혈당·지질", id: "totalCholesterol", label: "총콜레스테롤", unit: "mg/dL", min: 30, max: 800, step: 1 },
  { group: "혈당·지질", id: "ldl", label: "LDL 콜레스테롤", unit: "mg/dL", min: 10, max: 500, step: 1 },
  { group: "혈당·지질", id: "hdl", label: "HDL 콜레스테롤", unit: "mg/dL", min: 5, max: 200, step: 1 },
  { group: "혈당·지질", id: "triglycerides", label: "중성지방", unit: "mg/dL", min: 10, max: 1500, step: 1 },
  { group: "혈액·영양", id: "hemoglobin", label: "혈색소", unit: "g/dL", min: 3, max: 25, step: 0.1 },
  { group: "혈액·영양", id: "wbc", label: "백혈구(WBC)", unit: "10³/µL", min: 0.1, max: 100, step: 0.01 },
  { group: "혈액·영양", id: "platelets", label: "혈소판", unit: "10³/µL", min: 1, max: 1500, step: 1 },
  { group: "혈액·영양", id: "ferritin", label: "페리틴", unit: "ng/mL", min: 0.1, max: 5000, step: 0.1 },
  { group: "혈액·영양", id: "vitaminB12", label: "비타민 B12", unit: "pg/mL", min: 10, max: 5000, step: 1 },
  { group: "혈액·영양", id: "albumin", label: "알부민", unit: "g/dL", min: 0.5, max: 8, step: 0.1 },
  { group: "염증·면역", id: "crp", label: "CRP", unit: "mg/L", min: 0, max: 500, step: 0.01 },
  { group: "염증·면역", id: "hsCrp", label: "고감도 CRP", unit: "mg/L", min: 0, max: 100, step: 0.01 },
  { group: "염증·면역", id: "esr", label: "적혈구침강속도(ESR)", unit: "mm/hr", min: 0, max: 200, step: 1 },
  { group: "호르몬·회복", id: "tsh", label: "갑상선자극호르몬(TSH)", unit: "mIU/L", min: 0.001, max: 200, step: 0.001 },
  { group: "호르몬·회복", id: "freeT4", label: "유리 T4", unit: "ng/dL", min: 0.01, max: 20, step: 0.01 },
  { group: "호르몬·회복", id: "vitaminD", label: "25-OH 비타민 D", unit: "ng/mL", min: 1, max: 300, step: 0.1 },
  { group: "호르몬·회복", id: "calcium", label: "칼슘", unit: "mg/dL", min: 1, max: 20, step: 0.1 },
  { group: "호르몬·회복", id: "ck", label: "크레아틴키나아제(CK)", unit: "U/L", min: 1, max: 20000, step: 1 },
  { group: "간·신장", id: "ast", label: "AST", unit: "U/L", min: 1, max: 2000, step: 1 },
  { group: "간·신장", id: "alt", label: "ALT", unit: "U/L", min: 1, max: 2000, step: 1 },
  { group: "간·신장", id: "ggt", label: "감마지티피(γ-GTP)", unit: "U/L", min: 1, max: 2000, step: 1 },
  { group: "간·신장", id: "totalBilirubin", label: "총 빌리루빈", unit: "mg/dL", min: 0, max: 50, step: 0.01 },
  { group: "간·신장", id: "alp", label: "알칼리성 인산분해효소(ALP)", unit: "U/L", min: 1, max: 3000, step: 1 },
  { group: "간·신장", id: "creatinine", label: "혈청 크레아티닌", unit: "mg/dL", min: 0.1, max: 30, step: 0.01 },
  { group: "간·신장", id: "egfr", label: "사구체여과율(eGFR)", unit: "mL/min/1.73㎡", min: 1, max: 250, step: 1 },
  { group: "간·신장", id: "bun", label: "혈액요소질소(BUN)", unit: "mg/dL", min: 1, max: 300, step: 0.1 },
] as const;

const INBODY_FIELDS = [
  { id: "height", label: "신장", unit: "cm", min: 100, max: 230, step: 0.1 },
  { id: "weight", label: "체중", unit: "kg", min: 20, max: 300, step: 0.1 },
  { id: "bmi", label: "BMI", unit: "kg/㎡", min: 10, max: 70, step: 0.1 },
  { id: "bodyFat", label: "체지방률", unit: "%", min: 1, max: 70, step: 0.1 },
  { id: "skeletalMuscle", label: "골격근량", unit: "kg", min: 5, max: 100, step: 0.1 },
  { id: "visceralFat", label: "내장지방 레벨", unit: "레벨", min: 1, max: 30, step: 1 },
] as const;

function ObjectiveDataForm({
  type,
  selectedFileName,
  initialValues,
  onCancel,
  onSave,
}: {
  type: "checkup" | "inbody";
  selectedFileName?: string;
  initialValues: Record<string, string>;
  onCancel: () => void;
  onSave: (values: Record<string, string>) => void;
}) {
  const fields = type === "checkup" ? CHECKUP_FIELDS : INBODY_FIELDS;
  const title = type === "checkup" ? "건강검진 수치 입력" : "인바디 수치 입력";
  const [values, setValues] = useState<Record<string, string>>(
    type === "checkup" && !initialValues.bpContext
      ? { ...initialValues, bpContext: "office" }
      : initialValues,
  );
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const requiresReview = type === "checkup" && Boolean(selectedFileName);
  const fieldGroups = type === "checkup"
    ? Array.from(new Set(CHECKUP_FIELDS.map((field) => field.group))).map((group) => ({
        group,
        fields: CHECKUP_FIELDS.filter((field) => field.group === group),
      }))
    : [{ group: "인바디 측정값", fields: INBODY_FIELDS }];
  const filledCount = fields.filter((field) => values[field.id]?.trim()).length;

  return (
    <form
      className="objective-data-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (requiresReview && !reviewConfirmed) return;
        onSave(values);
      }}
    >
      <div className="objective-form-head">
        <div>
          <span>{type === "checkup" ? "HEALTH CHECKUP" : "BODY COMPOSITION"}</span>
          <h2>{title}</h2>
          <p>{selectedFileName ? `${selectedFileName}에서 자동 인식된 수치를 확인하거나 수정할 수 있습니다.` : "결과지에 표시된 수치를 입력해주세요. 확인 가능한 항목만 입력해도 반영됩니다."}</p>
        </div>
        <button type="button" onClick={onCancel} aria-label="입력 닫기">×</button>
      </div>
      {selectedFileName && (
        <div className="objective-upload-receipt">
          <i>✓</i>
          <div>
            <b>결과지 파일을 불러왔어요.</b>
            <span>{selectedFileName}</span>
          </div>
          <em>수치 확인 단계</em>
        </div>
      )}
      {type === "checkup" && (
        <div className="objective-found-summary">
          <b>확인할 수치 {filledCount}개</b>
          <span>점수 직접 반영 항목과 12건강축 참고 항목을 함께 표시합니다.</span>
        </div>
      )}
      {type === "checkup" && (
        <div className="objective-context-grid">
          <label className="objective-context-field">
            <span>검진 기준 성별</span>
            <select
              value={values.sex ?? ""}
              onChange={(event) =>
                setValues({ ...values, sex: event.target.value })
              }
            >
              <option value="">선택 안 함</option>
              <option value="male">남성 기준</option>
              <option value="female">여성 기준</option>
            </select>
            <small>허리둘레·혈색소·감마지티피처럼 성별 참고치가 다른 항목에만 사용합니다.</small>
          </label>
          <label className="objective-context-field">
            <span>혈압 측정 환경</span>
            <select
              value={values.bpContext ?? "office"}
              onChange={(event) =>
                setValues({ ...values, bpContext: event.target.value })
              }
            >
              <option value="office">의료기관(진료실) 측정</option>
              <option value="home">가정에서 측정한 평균</option>
            </select>
            <small>고혈압 확인 기준은 진료실 140/90, 가정 평균 135/85 mmHg로 다릅니다.</small>
          </label>
        </div>
      )}
      <div className="objective-field-sections">
        {fieldGroups.map(({ group, fields: groupFields }) => (
          <fieldset key={group}>
            <legend>{group}</legend>
            <div className="objective-field-grid">
              {groupFields.map((field) => (
                <label key={field.id} className={values[field.id] ? "has-value" : ""}>
                  <span>{field.label}</span>
                  <div>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={values[field.id] ?? ""}
                      onChange={(event) => setValues({ ...values, [field.id]: event.target.value })}
                      aria-describedby={`${field.id}-unit`}
                    />
                    <b id={`${field.id}-unit`}>{field.unit}</b>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      {requiresReview && (
        <label className="objective-review-confirmation">
          <input
            type="checkbox"
            checked={reviewConfirmed}
            onChange={(event) => setReviewConfirmed(event.target.checked)}
            required
          />
          <span><b>원본 결과지와 자동 인식 수치를 대조했습니다.</b> OCR 오인식이나 단위 차이를 수정한 뒤 체크해주세요.</span>
        </label>
      )}
      <div className="objective-form-notice">
        <b>개인정보 안내</b>
        공개 데모에서는 입력값을 서버 또는 브라우저 저장소에 보관하지 않고 현재 화면의 신뢰도 표시만 갱신합니다.
      </div>
      <div className="objective-form-actions">
        <button type="button" onClick={onCancel}>취소</button>
        <button type="submit" disabled={requiresReview && !reviewConfirmed}>확인 완료 · 점수와 신뢰도 반영</button>
      </div>
    </form>
  );
}
