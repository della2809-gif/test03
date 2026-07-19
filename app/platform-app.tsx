"use client";

import { useState } from "react";
import Image from "next/image";
import type { HealthAssessmentResult } from "../features/health-assessment/types.ts";
import { HealthAssessmentFlow } from "./health-assessment-flow";
import { HealthCoachingApp } from "./health-coaching-app";
import { I18nProvider, LanguageSwitcher, useI18n } from "./i18n-provider";
import {
  aggregateHealthLedger,
  aggregateHealthMeasurements,
  type HealthLedgerEntry,
  type HealthLedgerPeriod,
  type HealthMeasurementEntry,
} from "../features/health-account/aggregation.ts";

type ConsumerView = "home" | "check" | "passport" | "missions" | "community";

const journey = [
  ["01", "건강자산 진단", "5분 건강체크"],
  ["02", "AI 건강리포트", "12개 건강능력 분석"],
  ["03", "건강실천플랜", "나만의 7일 시작"],
  ["04", "건강통장", "매일 건강자산 기록"],
  ["05", "건강챌린지", "28일 습관 만들기"],
  ["06", "전문가 코칭", "AI + 전문가 피드백"],
  ["07", "건강 허브", "가족과 함께 성장"],
];

const missionsSeed = [
  { id: 1, title: "식후 10분 가볍게 걷기", meta: "혈당 리듬 · 10분", point: 30 },
  { id: 2, title: "물 6잔 나눠 마시기", meta: "회복 · 하루", point: 20 },
  { id: 3, title: "취침 30분 전 화면 끄기", meta: "수면 · 오늘 밤", point: 30 },
];

const healthLedger: HealthLedgerEntry[] = [
  { date: "2026-06-03", points: 80, completedMissions: 4, exerciseMinutes: 85, assetScore: 66 },
  { date: "2026-06-10", points: 110, completedMissions: 6, exerciseMinutes: 118, assetScore: 68 },
  { date: "2026-06-18", points: 130, completedMissions: 7, exerciseMinutes: 126, assetScore: 69 },
  { date: "2026-06-26", points: 150, completedMissions: 8, exerciseMinutes: 135, assetScore: 70 },
  { date: "2026-07-02", points: 90, completedMissions: 5, exerciseMinutes: 92, assetScore: 71 },
  { date: "2026-07-07", points: 120, completedMissions: 6, exerciseMinutes: 55, assetScore: 72 },
  { date: "2026-07-12", points: 100, completedMissions: 5, exerciseMinutes: 55, assetScore: 73 },
  { date: "2026-07-14", points: 70, completedMissions: 3, exerciseMinutes: 54, assetScore: 73 },
  { date: "2026-07-16", points: 100, completedMissions: 4, exerciseMinutes: 48, assetScore: 74 },
  { date: "2026-07-18", points: 130, completedMissions: 5, exerciseMinutes: 40, assetScore: 75 },
];

const healthMeasurements: HealthMeasurementEntry[] = [
  { date: "2026-03-28", weight: 63.5, skeletalMuscle: 22.7, systolic: 126, diastolic: 82 },
  { date: "2026-04-25", weight: 63.1, skeletalMuscle: 22.9, systolic: 124, diastolic: 80 },
  { date: "2026-05-30", weight: 62.8, skeletalMuscle: 23.0, systolic: 122, diastolic: 79 },
  { date: "2026-06-27", weight: 62.5, skeletalMuscle: 23.0, systolic: 121, diastolic: 78 },
  { date: "2026-07-05", weight: 62.2, skeletalMuscle: 23.1, systolic: 120, diastolic: 78 },
  { date: "2026-07-12", weight: 62.0, skeletalMuscle: 23.2, systolic: 119, diastolic: 77 },
  { date: "2026-07-18", weight: 61.8, skeletalMuscle: 23.4, systolic: 118, diastolic: 76 },
];

type HealthMetric = "weight" | "skeletalMuscle" | "bloodPressure" | "exercise";

export function PlatformApp() {
  return <I18nProvider><PlatformRoot /></I18nProvider>;
}

function PlatformRoot() {
  const [coachMode, setCoachMode] = useState(false);
  const { t } = useI18n();

  if (coachMode) {
    return (
      <div className="coach-mode-wrap">
        <button className="coach-exit" onClick={() => setCoachMode(false)}>← {t("customerView")}</button>
        <HealthCoachingApp />
      </div>
    );
  }

  return <ConsumerPlatform openCoach={() => setCoachMode(true)} />;
}

function ConsumerPlatform({ openCoach }: { openCoach: () => void }) {
  const { locale, t } = useI18n();
  const [view, setView] = useState<ConsumerView>("home");
  const [assessmentResult, setAssessmentResult] =
    useState<HealthAssessmentResult | null>(null);
  const [missions, setMissions] = useState<number[]>([2]);
  const [toast, setToast] = useState("");

  const points = 240 + missions.reduce((sum, id) => sum + (missionsSeed.find((item) => item.id === id)?.point ?? 0), 0);

  function navigate(next: ConsumerView) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  return (
    <div className="asset-app">
      <header className="asset-header">
        <button className="asset-logo" onClick={() => navigate("home")}>
          <span>H+</span>
          <strong>{t("brand")}<small>AI HEALTH ASSET PLATFORM</small></strong>
        </button>
        <nav aria-label="건강자산 메뉴">
          <button className={view === "home" ? "active" : ""} onClick={() => navigate("home")}>{locale === "en" ? "Home" : "건강홈"}</button>
          <button className={view === "passport" ? "active" : ""} onClick={() => navigate("passport")}>{t("healthAccount")}</button>
          <button className={view === "missions" ? "active" : ""} onClick={() => navigate("missions")}>{t("todayMission")}</button>
          <button className={view === "community" ? "active" : ""} onClick={() => navigate("community")}>{t("community")}</button>
        </nav>
        <div className="asset-head-actions">
          <LanguageSwitcher />
          <button className="asset-coach-link" onClick={openCoach}>{t("coachOperations")}</button>
          <button className="asset-solid small" onClick={() => navigate("check")}>{t("freeCheck")}</button>
        </div>
      </header>

      {view === "home" && <Home navigate={navigate} openCoach={openCoach} />}
      {view === "check" && (
        <HealthAssessmentFlow
          onComplete={setAssessmentResult}
          goPassport={() => navigate("passport")}
        />
      )}
      {view === "passport" && <Passport score={assessmentResult?.totalScore ?? 74} goCheck={() => navigate("check")} goMission={() => navigate("missions")} />}
      {view === "missions" && <Missions missions={missions} setMissions={setMissions} points={points} showToast={showToast} />}
      {view === "community" && <Community showToast={showToast} />}

      <footer className="asset-footer">
        <div className="asset-logo inverse"><span>H+</span>{t("brand")}</div>
        <p>{t("footerCopy")}</p>
        <button onClick={openCoach}>코치·파트너 운영 화면 →</button>
      </footer>
      {toast && <div className="asset-toast">{toast}</div>}
    </div>
  );
}

function Home({ navigate, openCoach }: { navigate: (view: ConsumerView) => void; openCoach: () => void }) {
  const { locale, t } = useI18n();
  const localizedJourney = locale === "en"
    ? [
        ["01", "Health Asset Check", "Five-minute check"],
        ["02", "AI Health Report", "Analyze 12 health abilities"],
        ["03", "Health Action Plan", "Start your own 7-day plan"],
        ["04", "Health Account", "Record health assets daily"],
        ["05", "Health Challenge", "Build a habit in 28 days"],
        ["06", "Expert Coaching", "AI + expert feedback"],
        ["07", "Health Hub", "Grow together with family"],
      ]
    : journey;
  const journeyIcons = ["▣", "◉", "◎", "▤", "♡", "♙", "◫"];
  const proofItems = locale === "en"
    ? ["12 health abilities", "AI personalized report", "Coach & community", "Lifelong care"]
    : ["12개 건강능력 진단", "AI 맞춤 리포트", "코치 & 커뮤니티", "평생 건강관리"];
  const featureItems = locale === "en"
    ? [
        ["✥", "Structured AI analysis", "Analyze 12 health abilities"],
        ["♧", "Personal plans & missions", "A practical guide made for me"],
        ["▣", "Smarter with every record", "AI provides increasingly precise feedback"],
        ["♙", "Care together with family", "Share health assets with loved ones"],
        ["◌", "Connected health products", "Guides to the right products and information"],
      ]
    : [
        ["✥", "체계적인 AI 분석", "12개 건강능력 기반 분석"],
        ["♧", "맞춤 플랜 & 미션", "나에게 꼭 맞는 실천 가이드"],
        ["▣", "기록할수록 더 스마트하게", "AI가 더 정확한 피드백 제공"],
        ["♙", "가족과 함께 관리", "소중한 사람과 건강 자산을 공유"],
        ["◌", "건강한 소비 연결", "필요한 제품 정보와 가이드 제공"],
      ];
  return (
    <main className="home-redesign">
      <section className="asset-hero">
        <div className="asset-hero-copy">
          <div className="asset-eyebrow">{t("heroEyebrow")}</div>
          <h1>{t("heroTitle1")}<br /><em>{t("heroTitle2")}</em></h1>
          <p>{t("heroBody")}</p>
          <div className="asset-hero-actions">
            <button className="asset-solid" onClick={() => navigate("check")}>{t("startCheck")} <span>→</span></button>
            <button className="asset-ghost" onClick={() => navigate("passport")}>{t("previewAccount")}</button>
          </div>
          <div className="asset-proof">
            {proofItems.map((item, index) => <span key={item}><i>{["✥", "▣", "♙", "◫"][index]}</i><b>{item}</b></span>)}
          </div>
        </div>
        <div className="asset-hero-visual" aria-label="건강자산 리포트 미리보기">
          <div className="asset-report-top"><span>{locale === "en" ? "My health assets" : "나의 건강자산"}</span><b>{locale === "en" ? "This week +6" : "이번 주 +6"}</b></div>
          <div className="asset-report-body">
            <div className="asset-score-summary">
              <div className="asset-score-ring"><div><strong>74</strong><span>/100</span></div></div>
              <b>{locale === "en" ? "Health asset score" : "건강자산 점수"}</b>
              <em>{locale === "en" ? "Average ↑ 6" : "보통 ↑ 6점"}</em>
            </div>
            <div className="asset-mini-bars">
              {[
                [locale === "en" ? "Immunity" : "면역방어", 82],
                [locale === "en" ? "Glucose" : "혈당균형", 72],
                [locale === "en" ? "Energy" : "에너지", 68],
                [locale === "en" ? "Recovery" : "수면회복", 78],
                [locale === "en" ? "Metabolism" : "근육·대사", 65],
              ].map(([label, value]) => (
                <div key={label}><span>{label}</span><i><b style={{ width: `${value}%` }} /></i><strong>{value}</strong></div>
              ))}
              <button onClick={() => navigate("passport")}>{locale === "en" ? "View all ›" : "전체 보기 ›"}</button>
            </div>
          </div>
          <div className="asset-ai-note"><span>↗</span><p><b>{locale === "en" ? "Today's one thing" : "오늘의 한 가지"}</b>{locale === "en" ? "Take a 10-minute walk after lunch." : "점심 식후 10분 걷기 실천해보세요."}</p><strong>+30P</strong></div>
        </div>
        <div className="asset-float float-one">30일 연속 기록 <b>12일째</b></div>
        <div className="hero-botanical" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      </section>

      <section className="asset-section journey-section">
        <button className="journey-arrow" aria-label={locale === "en" ? "Previous journey step" : "이전 건강 여정 단계"}>‹</button>
        <div className="journey-heading"><h2>{t("journeyTitle")}</h2></div>
        <div className="journey-grid">
          {localizedJourney.map(([no, title, text], index) => <div className={index === 0 ? "featured" : ""} key={no}><i aria-hidden="true">{journeyIcons[index]}</i><b>{no}</b><span>{title}</span><small>{text}</small></div>)}
        </div>
        <button className="journey-arrow" aria-label={locale === "en" ? "Next journey step" : "다음 건강 여정 단계"}>›</button>
      </section>

      <section className="asset-section home-showcase">
        <article className="weekly-card home-showcase-card">
          <Image src="/wellness-interior.jpg" alt="" width={1200} height={900} sizes="(max-width: 640px) 100vw, 145px" />
          <div>
          <div className="asset-eyebrow">WEEKLY AI COACH</div>
          <h2>{t("weeklyCoach")}</h2>
          <p>{t("weeklyCoachBody")}</p>
          <div className="coach-chat">
            <div className="chat-ai"><b>AI 코치</b><p>이번 주 수면 점수가 향상됐어요! 이 좋은 흐름을 계속 유지해보세요.</p></div>
            <div className="chat-action"><span>이번 주 목표 실천</span><strong>저녁 11시 스마트폰 30분 줄이기</strong><b>+100P</b></div>
          </div>
          </div>
        </article>
        <article className="passport-promo home-showcase-card">
          <div>
            <div className="asset-eyebrow">MY HEALTH ACCOUNT</div>
            <h2>{locale === "en" ? <>See every change<br />in your Health Account</> : <>건강통장으로<br />나의 변화를 한눈에</>}</h2>
            <p>{locale === "en" ? "Collect weight, body composition and lifestyle records in one place." : "체중, 인바디, 생활습관, 미션까지 모든 기록을 한 곳에."}</p>
            <button className="asset-text-link" onClick={() => navigate("passport")}>{locale === "en" ? "Open Health Account →" : "건강통장 바로가기 →"}</button>
          </div>
          <div className="passport-cover"><span>HEALTH ACCOUNT</span><b>{locale === "en" ? "Health Account" : "건강통장"}</b><small>{locale === "en" ? "This month's change" : "이번 달 변화"}</small><strong>+ 8점</strong><i>＋</i></div>
        </article>
        <article className="community-card home-showcase-card">
          <div className="community-copy">
            <span>TOGETHER</span><h3>{locale === "en" ? <>A health community<br />that lasts longer together</> : <>혼자보다 오래 가는<br />건강 커뮤니티</>}</h3>
            <p>{locale === "en" ? "Build supportive health habits and grow together." : "서로 응원하고, 함께 성장하는 건강 습관을 만들어보세요."}</p>
            <div><b>#챌린지</b><b>#미션</b><b>#기록공유</b><b>#코치피드백</b></div>
            <button onClick={() => navigate("community")}>{locale === "en" ? "Explore community →" : "커뮤니티 둘러보기 →"}</button>
          </div>
          <figure><Image src="/wellness-community.jpg" alt={locale === "en" ? "Friends enjoying time together" : "함께 즐거운 시간을 보내는 친구들"} width={1200} height={900} sizes="(max-width: 640px) 100vw, 220px" /><figcaption>{locale === "en" ? "Better together!" : "함께라서 더 즐거워요!"}<span>♥ 128</span></figcaption></figure>
        </article>
      </section>

      <section className="home-feature-strip" aria-label={locale === "en" ? "Platform benefits" : "플랫폼 주요 특징"}>
        {featureItems.map(([icon, title, text]) => <div key={title}><i>{icon}</i><p><b>{title}</b><span>{text}</span></p></div>)}
      </section>

      <section className="asset-vip">
        <div><span>PREMIUM FACE-TO-FACE COACHING</span><h2>{t("premiumTitle")}</h2><p>{t("premiumBody")}</p>
          <div className="vip-points"><b>01 인바디 측정</b><b>02 심층 생활 인터뷰</b><b>03 맞춤 4주 플랜</b></div>
          <button className="asset-light" onClick={() => navigate("check")}>{t("startFree")}</button>
        </div>
        <div className="vip-ticket"><span>VIP HEALTH SESSION</span><strong>90</strong><em>MINUTES</em><hr /><p>BODY COMPOSITION<br />+ PERSONAL COACHING</p><small>사전 예약제로 운영됩니다</small></div>
      </section>

      <section className="asset-final-cta"><span>MY HEALTH, MY ASSET</span><h2>오늘의 5분이<br />내일의 건강자산이 됩니다.</h2><button className="asset-solid light-solid" onClick={() => navigate("check")}>무료 건강체크 시작하기 →</button><button className="operator-link" onClick={openCoach}>코치이신가요? 운영 화면 보기</button></section>
    </main>
  );
}

function Passport({ score, goCheck, goMission }: { score: number; goCheck: () => void; goMission: () => void }) {
  const { locale, t } = useI18n();
  const [period, setPeriod] = useState<HealthLedgerPeriod>("week");
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric>("weight");
  const [metricHistoryOpen, setMetricHistoryOpen] = useState(false);
  const summaries = aggregateHealthLedger(healthLedger, period, locale);
  const measurements = aggregateHealthMeasurements(healthMeasurements, period, locale);
  const current = summaries[0];
  const maxPoints = Math.max(...summaries.map((item) => item.points), 1);
  const latestMeasurement = measurements[0];
  const metricSeries = summaries
    .map((summary) => {
      const measurement = measurements.find((item) => item.key === summary.key);
      const numericValue =
        selectedMetric === "weight"
          ? measurement?.weight
          : selectedMetric === "skeletalMuscle"
            ? measurement?.skeletalMuscle
            : selectedMetric === "bloodPressure"
              ? measurement?.systolic
              : summary.exerciseMinutes;
      const displayValue =
        selectedMetric === "bloodPressure"
          ? `${measurement?.systolic ?? "-"}/${measurement?.diastolic ?? "-"}`
          : numericValue?.toString() ?? "-";
      return { ...summary, numericValue, displayValue, measurement };
    })
    .filter((item) => item.numericValue !== null && item.numericValue !== undefined);
  const metricValues = metricSeries.map((item) => item.numericValue as number);
  const metricMin = Math.min(...metricValues);
  const metricMax = Math.max(...metricValues);
  const metricRange = Math.max(metricMax - metricMin, 1);
  const metricInfo: Record<HealthMetric, { label: string; unit: string; note: string }> = {
    weight: { label: t("weight"), unit: "kg", note: locale === "en" ? "Last measurement in each period" : "기간별 마지막 측정값" },
    skeletalMuscle: { label: t("skeletalMuscle"), unit: "kg", note: locale === "en" ? "Last body-composition measurement" : "기간별 마지막 인바디 측정값" },
    bloodPressure: { label: t("bloodPressure"), unit: "mmHg", note: locale === "en" ? "Last measurement in each period" : "기간별 마지막 측정값" },
    exercise: { label: locale === "en" ? "Exercise" : "운동", unit: locale === "en" ? "min" : "분", note: locale === "en" ? "Total exercise time in each period" : "기간 내 운동시간 합계" },
  };
  const previousMeasurement = measurements[1];
  const weightChange = latestMeasurement.weight !== null && previousMeasurement?.weight !== null
    ? latestMeasurement.weight - previousMeasurement.weight
    : null;
  const muscleChange = latestMeasurement.skeletalMuscle !== null && previousMeasurement?.skeletalMuscle !== null
    ? latestMeasurement.skeletalMuscle - previousMeasurement.skeletalMuscle
    : null;
  const exerciseChange = summaries[1]
    ? current.exerciseMinutes - summaries[1].exerciseMinutes
    : null;
  const formatSigned = (value: number | null, digits = 0) =>
    value === null ? "-" : `${value > 0 ? "+" : ""}${value.toFixed(digits)}`;
  const metricCards: Array<{ id: HealthMetric; label: string; value: string; unit: string; change: string }> = [
    { id: "weight", label: t("weight"), value: latestMeasurement.weight?.toFixed(1) ?? "-", unit: "kg", change: formatSigned(weightChange, 1) },
    { id: "skeletalMuscle", label: t("skeletalMuscle"), value: latestMeasurement.skeletalMuscle?.toFixed(1) ?? "-", unit: "kg", change: formatSigned(muscleChange, 1) },
    { id: "bloodPressure", label: t("bloodPressure"), value: `${latestMeasurement.systolic ?? "-"}/${latestMeasurement.diastolic ?? "-"}`, unit: "mmHg", change: t("stable") },
    { id: "exercise", label: period === "week" ? t("weeklyExercise") : t("monthlyExercise"), value: current.exerciseMinutes.toString(), unit: locale === "en" ? "min" : "분", change: formatSigned(exerciseChange) },
  ];

  return <main className="inner-page passport-page">
    <div className="inner-head"><div><div className="asset-eyebrow">MY HEALTH ACCOUNT</div><h1>{t("accountHeading")}</h1><p>{t("accountIntro")}</p></div><button className="asset-ghost" onClick={goCheck}>{t("checkAgain")}</button></div>
    <div className="passport-dashboard">
      <section className="passport-score"><span>{t("monthlyAsset")}</span><strong>{score}</strong><b>{t("versusLastMonth")}</b><div className="spark">{[30, 35, 42, 39, 52, 57, 68, 74].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div></section>
      <section className="passport-records">
        {metricCards.map((item) => (
          <button
            type="button"
            className={metricHistoryOpen && selectedMetric === item.id ? "active" : ""}
            aria-expanded={metricHistoryOpen && selectedMetric === item.id}
            aria-controls="health-metric-history"
            onClick={() => {
              if (selectedMetric === item.id) {
                setMetricHistoryOpen(!metricHistoryOpen);
              } else {
                setSelectedMetric(item.id);
                setMetricHistoryOpen(true);
              }
            }}
            key={item.id}
          >
            <span>{item.label}</span>
            <strong>{item.value}<small>{item.unit}</small></strong>
            <b>{item.change}</b>
            <em>{metricHistoryOpen && selectedMetric === item.id ? t("closeTrend") : t("viewTrend")}</em>
          </button>
        ))}
      </section>
    </div>
    {metricHistoryOpen && <section className="health-metric-history" id="health-metric-history">
      <div className="health-metric-head">
        <div><span>HEALTH METRIC HISTORY</span><h2>{metricInfo[selectedMetric].label} {t("cumulativeTrend")}</h2><p>{metricInfo[selectedMetric].note}</p></div>
        <div className="health-metric-actions">
          <div className="account-period-tabs" role="group" aria-label="건강수치 조회 기간">
            <button className={period === "week" ? "active" : ""} onClick={() => setPeriod("week")}>{t("weekly")}</button>
            <button className={period === "month" ? "active" : ""} onClick={() => setPeriod("month")}>{t("monthly")}</button>
          </div>
          <button className="health-metric-close" onClick={() => setMetricHistoryOpen(false)}>{t("close")}</button>
        </div>
      </div>
      <div className="health-metric-chart">
        {metricSeries.slice(0, 6).reverse().map((item) => (
          <div key={item.key}>
            <strong>{item.displayValue}<small>{metricInfo[selectedMetric].unit}</small></strong>
            <span><i style={{ height: `${28 + (((item.numericValue as number) - metricMin) / metricRange) * 72}%` }} /></span>
            <b>{item.label}</b>
          </div>
        ))}
      </div>
      <p className="health-metric-footnote">{t("metricNote")}</p>
    </section>}
    <section className="account-accumulation">
      <div className="account-period-head">
        <div><span>ACCUMULATED REPORT</span><h2>{t("accumulatedTitle")}</h2><p>{t("accumulatedBody")}</p></div>
        <div className="account-period-tabs" role="group" aria-label="누적 결과 기간">
          <button className={period === "week" ? "active" : ""} onClick={() => setPeriod("week")}>{t("weekly")}</button>
          <button className={period === "month" ? "active" : ""} onClick={() => setPeriod("month")}>{t("monthly")}</button>
        </div>
      </div>
      <div className="account-total-grid">
        <article><span>{current.label} {t("accumulatedPoints")}</span><strong>{current.points.toLocaleString()}<small>P</small></strong><b>{t("pointsEarned")}</b></article>
        <article><span>{t("completedMissions")}</span><strong>{current.completedMissions}<small>{locale === "en" ? "" : "개"}</small></strong><b>{t("actionTotal")}</b></article>
        <article><span>{t("exerciseTime")}</span><strong>{current.exerciseMinutes}<small>{locale === "en" ? "min" : "분"}</small></strong><b>{t("activityTotal")}</b></article>
        <article><span>{t("averageAsset")}</span><strong>{current.averageAssetScore ?? "-"}<small>{locale === "en" ? "pts" : "점"}</small></strong><b>{t("periodAverage")}</b></article>
      </div>
      <div className="account-trend" aria-label={`${period === "week" ? "주간" : "월간"} 누적 포인트 추이`}>
        {summaries.slice(0, 6).reverse().map((item) => (
          <div key={item.key}>
            <span><i style={{ height: `${Math.max(12, (item.points / maxPoints) * 100)}%` }} /></span>
            <b>{item.points}P</b>
            <small>{item.label}</small>
          </div>
        ))}
      </div>
    </section>
    <section className="passport-timeline"><div className="asset-section-head compact"><div><span>ASSET HISTORY</span><h2>{t("assetHistory")}</h2></div><button className="asset-solid small" onClick={goMission}>{t("todayMission")}</button></div>
      {[["7월 16일", "수면 미션 7일 연속 달성", "+100P", "habit"], ["7월 12일", "인바디 재측정", "근육량 +0.4kg", "body"], ["7월 1일", "7월 AI 월간 리포트 생성", "점수 +4", "report"]].map(([date, title, value, type]) => <div className="timeline-row" key={date}><i className={type}>{type === "habit" ? "✓" : type === "body" ? "◇" : "AI"}</i><span>{date}</span><strong>{title}</strong><b>{value}</b></div>)}
    </section>
  </main>;
}

function Missions({ missions, setMissions, points, showToast }: { missions: number[]; setMissions: (ids: number[]) => void; points: number; showToast: (message: string) => void }) {
  const { locale } = useI18n();
  function toggle(id: number) {
    const complete = missions.includes(id);
    setMissions(complete ? missions.filter((item) => item !== id) : [...missions, id]);
    if (!complete) showToast(`미션 완료! +${missionsSeed.find((item) => item.id === id)?.point}P`);
  }
  return <main className="inner-page mission-page">
    <div className="inner-head"><div><div className="asset-eyebrow">30 DAY HEALTH MISSION</div><h1>{locale === "en" ? "Ready to build your health assets today?" : "오늘도 건강자산을 쌓아볼까요?"}</h1><p>{locale === "en" ? "Small actions are enough. Consistency matters more than perfection." : "거창하지 않아도 괜찮아요. 오늘의 작은 행동이면 충분합니다."}</p></div><div className="point-pill"><span>{locale === "en" ? "My points" : "나의 포인트"}</span><b>{points.toLocaleString()} P</b></div></div>
    <div className="mission-summary"><div><span>연속 실천</span><strong>12<small>일</small></strong></div><div><span>이번 주 달성률</span><strong>76<small>%</small></strong></div><div><span>모은 건강자산</span><strong>1,840<small>P</small></strong></div><div className="week-dots">{["월", "화", "수", "목", "금", "토", "일"].map((day, i) => <span key={day} className={i < 5 ? "done" : ""}><i>{i < 5 ? "✓" : ""}</i><b>{day}</b></span>)}</div></div>
    <section className="mission-list"><div className="asset-section-head compact"><div><span>TODAY</span><h2>{locale === "en" ? "3 personalized missions from AI" : "AI가 고른 맞춤 미션 3개"}</h2></div><b>{missions.length} / 3 {locale === "en" ? "done" : "완료"}</b></div>
      {missionsSeed.map((mission) => <button className={missions.includes(mission.id) ? "mission done" : "mission"} key={mission.id} onClick={() => toggle(mission.id)}><i>{missions.includes(mission.id) ? "✓" : ""}</i><span><strong>{mission.title}</strong><small>{mission.meta}</small></span><b>+{mission.point}P</b></button>)}
    </section>
    <section className="reward-wallet"><div><span>HEALTH WALLET</span><h2>모은 포인트를 건강에 다시 투자하세요.</h2><p>코칭 할인, 제휴 운동 프로그램, 건강 콘텐츠 이용권으로 전환할 수 있어요.</p></div><button onClick={() => showToast("리워드 스토어는 준비 중입니다.")}>리워드 둘러보기 →</button></section>
  </main>;
}

function Community({ showToast }: { showToast: (message: string) => void }) {
  const { locale } = useI18n();
  const groups = locale === "en" ? [
    ["Glucose Rhythm Lab", "Track post-meal habits together", "1,284 members", "#dfeee5"],
    ["40+ Balance", "Share sleep, mood, and vitality", "836 members", "#f2e7dd"],
    ["Muscle Savings Club", "Try three strength missions a week", "2,106 members", "#e6e9f0"],
    ["Comfortable Gut Project", "Track meals and gut rhythm", "678 members", "#edf0d8"],
  ] : [
    ["혈당 리듬 연구소", "식후 습관을 함께 기록해요", "1,284명", "#dfeee5"],
    ["40+ 갱년기 밸런스", "수면·기분·활력을 나눠요", "836명", "#f2e7dd"],
    ["근육 저축 클럽", "주 3회 근력 미션에 도전해요", "2,106명", "#e6e9f0"],
    ["편안한 장 프로젝트", "식사와 장 리듬을 기록해요", "678명", "#edf0d8"],
  ];
  return <main className="inner-page community-page">
    <div className="inner-head"><div><div className="asset-eyebrow">HEALTH TOGETHER</div><h1>{locale === "en" ? "Healthy habits last longer together." : <>나와 비슷한 사람들과<br />함께하면 더 오래 갑니다.</>}</h1><p>{locale === "en" ? "AI organizes questions and records, while a professional coach joins when needed." : "AI가 질문과 기록을 정리하고, 전문 코치가 꼭 필요한 순간에 답합니다."}</p></div><button className="asset-solid" onClick={() => showToast(locale === "en" ? "Invite link copied." : "초대 링크가 복사되었습니다.")}>{locale === "en" ? "Share health check" : "친구에게 건강체크 보내기"}</button></div>
    <div className="group-grid">{groups.map(([title, text, members, color]) => <article key={title} style={{ "--group": color } as React.CSSProperties}><div><span>AI MANAGED GROUP</span><b>+</b></div><h2>{title}</h2><p>{text}</p><footer><span>{members} 참여 중</span><button onClick={() => showToast(`${title} 참여 신청 완료`)}>참여하기 →</button></footer></article>)}</div>
    <section className="friend-invite"><div className="invite-icon">H+</div><div><span>INVITE A FRIEND</span><h2>“건강검사 한번 받아봐.”</h2><p>친구가 무료 체크를 완료하면 두 사람 모두 200P를 받아요.</p></div><button onClick={() => showToast("친구 초대 링크가 복사되었습니다.")}>초대 링크 복사</button></section>
  </main>;
}
