"use client";

import { useState } from "react";
import type { HealthAssessmentResult } from "../features/health-assessment/types.ts";
import { HealthAssessmentFlow } from "./health-assessment-flow";
import { HealthCoachingApp } from "./health-coaching-app";
import {
  aggregateHealthLedger,
  type HealthLedgerEntry,
  type HealthLedgerPeriod,
} from "../features/health-account/aggregation.ts";

type ConsumerView = "home" | "check" | "passport" | "missions" | "community";

const journey = [
  ["01", "무료 건강체크", "5분이면 충분해요"],
  ["02", "AI 결과 리포트", "지금의 우선순위 확인"],
  ["03", "7일 코칭", "작은 실천부터 시작"],
  ["04", "건강통장", "변화를 한곳에 기록"],
  ["05", "30일 미션", "포인트로 습관 만들기"],
  ["06", "VIP 대면 코칭", "인바디 측정과 설계"],
  ["07", "함께 관리", "친구·커뮤니티와 지속"],
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
  { date: "2026-07-07", points: 120, completedMissions: 6, exerciseMinutes: 116, assetScore: 72 },
  { date: "2026-07-12", points: 100, completedMissions: 5, exerciseMinutes: 98, assetScore: 73 },
  { date: "2026-07-14", points: 70, completedMissions: 3, exerciseMinutes: 54, assetScore: 73 },
  { date: "2026-07-16", points: 100, completedMissions: 4, exerciseMinutes: 48, assetScore: 74 },
  { date: "2026-07-18", points: 130, completedMissions: 5, exerciseMinutes: 40, assetScore: 75 },
];

export function PlatformApp() {
  const [coachMode, setCoachMode] = useState(false);

  if (coachMode) {
    return (
      <div className="coach-mode-wrap">
        <button className="coach-exit" onClick={() => setCoachMode(false)}>← 고객용 화면</button>
        <HealthCoachingApp />
      </div>
    );
  }

  return <ConsumerPlatform openCoach={() => setCoachMode(true)} />;
}

function ConsumerPlatform({ openCoach }: { openCoach: () => void }) {
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
        <button className="asset-logo" onClick={() => navigate("home")}><span>H+</span>건강자산</button>
        <nav aria-label="건강자산 메뉴">
          <button className={view === "passport" ? "active" : ""} onClick={() => navigate("passport")}>건강통장</button>
          <button className={view === "missions" ? "active" : ""} onClick={() => navigate("missions")}>오늘의 미션</button>
          <button className={view === "community" ? "active" : ""} onClick={() => navigate("community")}>커뮤니티</button>
        </nav>
        <div className="asset-head-actions">
          <button className="asset-coach-link" onClick={openCoach}>코치 운영</button>
          <button className="asset-solid small" onClick={() => navigate("check")}>무료 건강체크</button>
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
        <div className="asset-logo inverse"><span>H+</span>건강자산</div>
        <p>건강을 기록하고, 건강을 쌓다.</p>
        <button onClick={openCoach}>코치·파트너 운영 화면 →</button>
      </footer>
      {toast && <div className="asset-toast">{toast}</div>}
    </div>
  );
}

function Home({ navigate, openCoach }: { navigate: (view: ConsumerView) => void; openCoach: () => void }) {
  return (
    <main>
      <section className="asset-hero">
        <div className="asset-hero-copy">
          <div className="asset-eyebrow">AI HEALTH ASSET PLATFORM</div>
          <h1>건강도 관리하면<br /><em>복리가 됩니다.</em></h1>
          <p>혈당대사부터 회복력까지 12대 건강영역을 5분 만에 체크하고, 매일 작은 실천으로 나만의 건강자산을 쌓아보세요.</p>
          <div className="asset-hero-actions">
            <button className="asset-solid" onClick={() => navigate("check")}>5분 무료 건강체크 <span>→</span></button>
            <button className="asset-ghost" onClick={() => navigate("passport")}>내 건강통장 미리보기</button>
          </div>
          <div className="asset-proof">
            <span>✓ 회원가입 없이 시작</span><span>✓ 결과 즉시 확인</span><span>✓ 의료 진단 아님</span>
          </div>
        </div>
        <div className="asset-hero-visual" aria-label="건강자산 리포트 미리보기">
          <div className="asset-report-top"><span>나의 건강자산</span><b>이번 주 +4</b></div>
          <div className="asset-score-ring"><div><strong>74</strong><span>양호</span></div></div>
          <div className="asset-mini-bars">
            {[["회복력", 68], ["혈당대사", 72], ["에너지", 81]].map(([label, value]) => (
              <div key={label}><span>{label}</span><i><b style={{ width: `${value}%` }} /></i><strong>{value}</strong></div>
            ))}
          </div>
          <div className="asset-ai-note"><span>AI</span><p><b>오늘의 한 가지</b>저녁 식사 후 10분만 걸어보세요.</p></div>
        </div>
        <div className="asset-float float-one">30일 연속 기록 <b>12일째</b></div>
        <div className="asset-float float-two">건강 포인트 <b>+30P</b></div>
      </section>

      <section className="asset-section journey-section">
        <div className="asset-section-head"><div><span>THE HEALTH ASSET JOURNEY</span><h2>한 번의 체크가<br />평생의 건강 습관이 되도록</h2></div><p>검사에서 끝나지 않습니다. AI가 매일의 실천을 돕고, 중요한 순간에는 전문 코치가 함께합니다.</p></div>
        <div className="journey-grid">
          {journey.map(([no, title, text], index) => <div className={index === 0 ? "featured" : ""} key={no}><b>{no}</b><span>{title}</span><small>{text}</small></div>)}
        </div>
      </section>

      <section className="asset-section asset-two-col">
        <div className="weekly-card">
          <div className="asset-eyebrow">WEEKLY AI COACH</div>
          <h2>매주 나를 더 잘 아는<br />건강 코치</h2>
          <p>기록이 쌓일수록 조언은 더 구체적으로 바뀝니다.</p>
          <div className="coach-chat">
            <div className="chat-ai"><b>AI 코치</b><p>이번 주 수면 점수가 6점 올랐어요. 다만 늦은 저녁 식사 다음 날 피로도가 높았습니다.</p></div>
            <div className="chat-action"><span>이번 주 작은 실천</span><strong>저녁 식사를 평소보다 30분 일찍</strong><button onClick={() => navigate("missions")}>미션에 담기 +</button></div>
          </div>
        </div>
        <div className="passport-promo">
          <div className="passport-cover"><span>HEALTH ASSET ACCOUNT</span><b>건강<br />통장</b><small>나의 변화가 자산이 되는 기록</small><i>H+</i></div>
          <div><div className="asset-eyebrow">MY HEALTH ACCOUNT</div><h2>흩어진 건강 기록을<br />한곳에 차곡차곡</h2><p>체중, 인바디, 혈압, 혈당, 운동과 영양 기록을 주·월별로 확인하세요.</p><button className="asset-text-link" onClick={() => navigate("passport")}>건강통장 둘러보기 →</button></div>
        </div>
      </section>

      <section className="asset-vip">
        <div><span>PREMIUM FACE-TO-FACE COACHING</span><h2>더 정확한 변화가 필요할 때,<br />전문 코치와 직접 만나요.</h2><p>현장에서 인바디를 측정하고 생활 패턴을 함께 확인한 뒤, 바로 실천할 수 있는 개인 플랜을 설계합니다.</p>
          <div className="vip-points"><b>01 인바디 측정</b><b>02 심층 생활 인터뷰</b><b>03 맞춤 4주 플랜</b></div>
          <button className="asset-light" onClick={() => navigate("check")}>무료 체크부터 시작하기</button>
        </div>
        <div className="vip-ticket"><span>VIP HEALTH SESSION</span><strong>90</strong><em>MINUTES</em><hr /><p>BODY COMPOSITION<br />+ PERSONAL COACHING</p><small>사전 예약제로 운영됩니다</small></div>
      </section>

      <section className="asset-section reward-community">
        <div className="reward-copy"><div className="asset-eyebrow">HEALTH REWARD</div><h2>건강 행동이<br />혜택으로 돌아오게</h2><p>출석, 미션, 측정, 친구 초대 활동으로 포인트를 모아 코칭과 제휴 혜택에 사용할 수 있어요.</p><button className="asset-text-link" onClick={() => navigate("missions")}>오늘의 미션 보기 →</button></div>
        <div className="reward-stack">
          <div><span>오늘의 미션 완료</span><b>+30 P</b></div><div><span>7일 연속 체크인</span><b>+100 P</b></div><div><span>친구와 함께 시작</span><b>+200 P</b></div>
        </div>
        <div className="community-card"><span>TOGETHER</span><h3>혼자보다 오래 가는<br />건강 커뮤니티</h3><div><b># 혈당관리</b><b># 갱년기</b><b># 근육증가</b><b># 장건강</b></div><button onClick={() => navigate("community")}>내 그룹 찾기 →</button></div>
      </section>

      <section className="asset-final-cta"><span>MY HEALTH, MY ASSET</span><h2>오늘의 5분이<br />내일의 건강자산이 됩니다.</h2><button className="asset-solid light-solid" onClick={() => navigate("check")}>무료 건강체크 시작하기 →</button><button className="operator-link" onClick={openCoach}>코치이신가요? 운영 화면 보기</button></section>
    </main>
  );
}

function Passport({ score, goCheck, goMission }: { score: number; goCheck: () => void; goMission: () => void }) {
  const [period, setPeriod] = useState<HealthLedgerPeriod>("week");
  const summaries = aggregateHealthLedger(healthLedger, period);
  const current = summaries[0];
  const maxPoints = Math.max(...summaries.map((item) => item.points), 1);

  return <main className="inner-page passport-page">
    <div className="inner-head"><div><div className="asset-eyebrow">MY HEALTH ACCOUNT</div><h1>김서연님의 건강통장</h1><p>작은 변화도 빠짐없이 건강자산으로 기록하고 있어요.</p></div><button className="asset-ghost" onClick={goCheck}>건강체크 다시 하기</button></div>
    <div className="passport-dashboard">
      <section className="passport-score"><span>2026년 7월 건강자산</span><strong>{score}</strong><b>지난달보다 +4</b><div className="spark">{[30, 35, 42, 39, 52, 57, 68, 74].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div></section>
      <section className="passport-records">
        {[["체중", "61.8", "kg", "-0.7"], ["골격근량", "23.4", "kg", "+0.4"], ["혈압", "118/76", "mmHg", "안정"], ["주간 운동", "142", "분", "+32"]].map(([label, value, unit, change]) => <div key={label}><span>{label}</span><strong>{value}<small>{unit}</small></strong><b>{change}</b></div>)}
      </section>
    </div>
    <section className="account-accumulation">
      <div className="account-period-head">
        <div><span>ACCUMULATED REPORT</span><h2>주·월 누적 건강자산</h2><p>기록된 행동과 측정 결과를 기간별로 합산했어요.</p></div>
        <div className="account-period-tabs" role="group" aria-label="누적 결과 기간">
          <button className={period === "week" ? "active" : ""} onClick={() => setPeriod("week")}>주간</button>
          <button className={period === "month" ? "active" : ""} onClick={() => setPeriod("month")}>월간</button>
        </div>
      </div>
      <div className="account-total-grid">
        <article><span>{current.label} 누적 포인트</span><strong>{current.points.toLocaleString()}<small>P</small></strong><b>건강 행동으로 적립</b></article>
        <article><span>완료 미션</span><strong>{current.completedMissions}<small>개</small></strong><b>실천 기록 누적</b></article>
        <article><span>운동 시간</span><strong>{current.exerciseMinutes}<small>분</small></strong><b>활동 기록 합계</b></article>
        <article><span>평균 건강자산</span><strong>{current.averageAssetScore ?? "-"}<small>점</small></strong><b>기간 내 측정 평균</b></article>
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
    <section className="passport-timeline"><div className="asset-section-head compact"><div><span>ASSET HISTORY</span><h2>건강자산이 쌓인 기록</h2></div><button className="asset-solid small" onClick={goMission}>오늘의 미션</button></div>
      {[["7월 16일", "수면 미션 7일 연속 달성", "+100P", "habit"], ["7월 12일", "인바디 재측정", "근육량 +0.4kg", "body"], ["7월 1일", "7월 AI 월간 리포트 생성", "점수 +4", "report"]].map(([date, title, value, type]) => <div className="timeline-row" key={date}><i className={type}>{type === "habit" ? "✓" : type === "body" ? "◇" : "AI"}</i><span>{date}</span><strong>{title}</strong><b>{value}</b></div>)}
    </section>
  </main>;
}

function Missions({ missions, setMissions, points, showToast }: { missions: number[]; setMissions: (ids: number[]) => void; points: number; showToast: (message: string) => void }) {
  function toggle(id: number) {
    const complete = missions.includes(id);
    setMissions(complete ? missions.filter((item) => item !== id) : [...missions, id]);
    if (!complete) showToast(`미션 완료! +${missionsSeed.find((item) => item.id === id)?.point}P`);
  }
  return <main className="inner-page mission-page">
    <div className="inner-head"><div><div className="asset-eyebrow">30 DAY HEALTH MISSION</div><h1>오늘도 건강자산을 쌓아볼까요?</h1><p>거창하지 않아도 괜찮아요. 오늘의 작은 행동이면 충분합니다.</p></div><div className="point-pill"><span>나의 포인트</span><b>{points.toLocaleString()} P</b></div></div>
    <div className="mission-summary"><div><span>연속 실천</span><strong>12<small>일</small></strong></div><div><span>이번 주 달성률</span><strong>76<small>%</small></strong></div><div><span>모은 건강자산</span><strong>1,840<small>P</small></strong></div><div className="week-dots">{["월", "화", "수", "목", "금", "토", "일"].map((day, i) => <span key={day} className={i < 5 ? "done" : ""}><i>{i < 5 ? "✓" : ""}</i><b>{day}</b></span>)}</div></div>
    <section className="mission-list"><div className="asset-section-head compact"><div><span>TODAY</span><h2>AI가 고른 맞춤 미션 3개</h2></div><b>{missions.length} / 3 완료</b></div>
      {missionsSeed.map((mission) => <button className={missions.includes(mission.id) ? "mission done" : "mission"} key={mission.id} onClick={() => toggle(mission.id)}><i>{missions.includes(mission.id) ? "✓" : ""}</i><span><strong>{mission.title}</strong><small>{mission.meta}</small></span><b>+{mission.point}P</b></button>)}
    </section>
    <section className="reward-wallet"><div><span>HEALTH WALLET</span><h2>모은 포인트를 건강에 다시 투자하세요.</h2><p>코칭 할인, 제휴 운동 프로그램, 건강 콘텐츠 이용권으로 전환할 수 있어요.</p></div><button onClick={() => showToast("리워드 스토어는 준비 중입니다.")}>리워드 둘러보기 →</button></section>
  </main>;
}

function Community({ showToast }: { showToast: (message: string) => void }) {
  const groups = [
    ["혈당 리듬 연구소", "식후 습관을 함께 기록해요", "1,284명", "#dfeee5"],
    ["40+ 갱년기 밸런스", "수면·기분·활력을 나눠요", "836명", "#f2e7dd"],
    ["근육 저축 클럽", "주 3회 근력 미션에 도전해요", "2,106명", "#e6e9f0"],
    ["편안한 장 프로젝트", "식사와 장 리듬을 기록해요", "678명", "#edf0d8"],
  ];
  return <main className="inner-page community-page">
    <div className="inner-head"><div><div className="asset-eyebrow">HEALTH TOGETHER</div><h1>나와 비슷한 사람들과<br />함께하면 더 오래 갑니다.</h1><p>AI가 질문과 기록을 정리하고, 전문 코치가 꼭 필요한 순간에 답합니다.</p></div><button className="asset-solid" onClick={() => showToast("초대 링크가 복사되었습니다.")}>친구에게 건강체크 보내기</button></div>
    <div className="group-grid">{groups.map(([title, text, members, color]) => <article key={title} style={{ "--group": color } as React.CSSProperties}><div><span>AI MANAGED GROUP</span><b>+</b></div><h2>{title}</h2><p>{text}</p><footer><span>{members} 참여 중</span><button onClick={() => showToast(`${title} 참여 신청 완료`)}>참여하기 →</button></footer></article>)}</div>
    <section className="friend-invite"><div className="invite-icon">H+</div><div><span>INVITE A FRIEND</span><h2>“건강검사 한번 받아봐.”</h2><p>친구가 무료 체크를 완료하면 두 사람 모두 200P를 받아요.</p></div><button onClick={() => showToast("친구 초대 링크가 복사되었습니다.")}>초대 링크 복사</button></section>
  </main>;
}
