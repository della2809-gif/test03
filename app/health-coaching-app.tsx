"use client";

import { useMemo, useState } from "react";
import { AXES, calculateConfidence, calculateOverallAsset } from "../lib/scoring";

type View = "dashboard" | "clients" | "session" | "settings";
type Period = "today" | "week" | "month";

const nav: Array<[View, string, string]> = [
  ["dashboard", "⌂", "운영 홈"],
  ["clients", "◉", "고객 관리"],
  ["session", "⌁", "현장 코칭"],
  ["settings", "⚙", "링크·운영 설정"],
];

const customers = [
  { name: "김서연", age: 38, status: "4주 관리 중", score: 72, change: "+5", next: "오늘 14:00", coach: "윤서진", color: "peach" },
  { name: "박지현", age: 45, status: "정밀 문진 대기", score: 68, change: "첫 평가", next: "오늘 16:30", coach: "윤서진", color: "mint" },
  { name: "이민호", age: 41, status: "후속 체크인", score: 76, change: "+3", next: "7월 18일", coach: "윤서진", color: "blue" },
  { name: "정유진", age: 34, status: "리포트 검토", score: 64, change: "-2", next: "7월 19일", coach: "윤서진", color: "lilac" },
  { name: "최수빈", age: 52, status: "재측정 예정", score: 70, change: "+7", next: "7월 22일", coach: "윤서진", color: "sand" },
];

const links = [
  { id: "intake", icon: "＋", title: "신규 고객 건강 체크", text: "고객이 기본정보와 사전 문진을 직접 시작하는 링크", url: "health-asset-coaching.chatgpt.site/start/yoon" },
  { id: "premium", icon: "◇", title: "프리미엄 대면 코칭 안내", text: "인바디 측정과 현장 코칭 예약을 소개하는 링크", url: "health-asset-coaching.chatgpt.site/premium/yoon" },
  { id: "followup", icon: "↗", title: "4주 후속 체크인", text: "기존 고객이 실천 결과와 변화를 기록하는 링크", url: "health-asset-coaching.chatgpt.site/checkin/yoon" },
];

export function HealthCoachingApp() {
  const [view, setView] = useState<View>("dashboard");
  const [period, setPeriod] = useState<Period>("today");
  const [copied, setCopied] = useState("");
  const [query, setQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]);
  const [shareOpen, setShareOpen] = useState(false);
  const [followupDone, setFollowupDone] = useState<string[]>([]);

  const filteredCustomers = customers.filter((customer) => customer.name.includes(query) || customer.status.includes(query));
  const confidence = calculateConfidence({ questionnaire: true, lifestyle: true, bodyComposition: true, biomarkers: false, healthHistory: true });
  const axes = useMemo(() => AXES.map((axis, index) => ({ ...axis, assetScore: [67, 71, 76, 72, 80, 78, 74, 69, 73, 66, 75, 64][index], confidenceScore: confidence })), [confidence]);
  const overall = calculateOverallAsset(axes);

  async function copyLink(id: string, url: string) {
    try {
      await navigator.clipboard.writeText(`https://${url}`);
    } catch {
      // Clipboard may be unavailable in embedded previews; visual feedback is still useful.
    }
    setCopied(id);
    window.setTimeout(() => setCopied(""), 1600);
  }

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><span className="mark">H+</span>건강자산</div>
        <div className="workspace-label">MY COACHING BUSINESS</div>
        <nav className="nav" aria-label="주요 메뉴">
          {nav.map(([id, icon, label]) => (
            <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}><i>{icon}</i>{label}</button>
          ))}
        </nav>
        <div className="profile">
          <button className="side-share" onClick={() => { setView("settings"); setCopied(""); }}>＋ 고객 초대 링크</button>
          <div className="privacy">고객 리포트는 본인 동의 후 지정된 팀 또는 멘토에게만 공유합니다.</div>
          <div className="coach"><div className="avatar">윤</div><div><strong>윤서진 코치</strong><span>프리미엄 코칭센터</span></div></div>
        </div>
      </aside>

      <main className="main">
        <header className="top">
          <div><div className="overline">Health coaching operation</div><strong>윤서진 코치의 운영 워크스페이스</strong></div>
          <div className="top-actions"><button className="top-search" onClick={() => setView("clients")}>⌕ 고객 찾기</button><span className="notification">3</span></div>
        </header>

        {view === "dashboard" && <Dashboard period={period} setPeriod={setPeriod} setView={setView} followupDone={followupDone} setFollowupDone={setFollowupDone} />}
        {view === "clients" && <Clients query={query} setQuery={setQuery} customers={filteredCustomers} select={(customer) => { setSelectedCustomer(customer); setShareOpen(false); }} selected={selectedCustomer} shareOpen={shareOpen} setShareOpen={setShareOpen} copied={copied} copyLink={copyLink} />}
        {view === "session" && <Session overall={overall} confidence={confidence} axes={axes} />}
        {view === "settings" && <Settings copied={copied} copyLink={copyLink} />}
      </main>

      <nav className="mobile">
        {nav.map(([id, icon, label]) => <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}><b>{icon}</b>{label}</button>)}
      </nav>
    </div>
  );
}

function Dashboard({ period, setPeriod, setView, followupDone, setFollowupDone }: {
  period: Period; setPeriod: (period: Period) => void; setView: (view: View) => void;
  followupDone: string[]; setFollowupDone: (items: string[]) => void;
}) {
  const values = {
    today: { clients: 4, reports: 2, followups: 3, rate: 86 },
    week: { clients: 17, reports: 11, followups: 8, rate: 79 },
    month: { clients: 42, reports: 31, followups: 14, rate: 82 },
  }[period];
  const tasks = [
    ["김서연", "4주 목표 체크인", "오늘 오전 11:00", "전화"],
    ["정유진", "리포트 코치 승인", "오늘 오후 3:00", "검토"],
    ["이민호", "수면·회복 미션 확인", "내일", "메시지"],
  ];
  return <>
    <section className="head dashboard-head">
      <div><div className="overline">2026년 7월 16일 목요일</div><h1>좋은 아침이에요, 윤서진 코치님</h1><p>오늘의 상담과 놓치면 안 되는 후속관리를 먼저 확인하세요.</p></div>
      <button className="btn primary" onClick={() => setView("settings")}>＋ 고객 초대하기</button>
    </section>

    <div className="period-tabs" aria-label="리포트 기간">
      {([["today", "오늘"], ["week", "이번 주"], ["month", "이번 달"]] as const).map(([id, label]) => <button key={id} className={period === id ? "active" : ""} onClick={() => setPeriod(id)}>{label}</button>)}
    </div>

    <section className="metric-grid">
      <Metric label="관리 고객" value={values.clients} suffix="명" note={period === "today" ? "오늘 상담 2명" : "활성 고객 기준"} tone="green" />
      <Metric label="완성 리포트" value={values.reports} suffix="건" note="코치 승인 완료" tone="lime" />
      <Metric label="후속관리 필요" value={values.followups} suffix="건" note="오늘 우선 확인" tone="coral" />
      <Metric label="체크인 응답률" value={values.rate} suffix="%" note="+6% 이전 기간 대비" tone="cream" />
    </section>

    <div className="operation-grid">
      <section className="card pad">
        <div className="title"><div><h2>오늘의 일정</h2><p>상담과 측정 일정을 시간순으로 확인합니다.</p></div><button className="text-btn">전체 일정 →</button></div>
        <div className="schedule">
          <div className="schedule-row"><time>10:30</time><span className="schedule-line" /><div className="schedule-main"><strong>박지현 · 첫 방문 상담</strong><p>사전 문진 완료 · 인바디 측정 예정</p></div><span className="tag">대면</span></div>
          <div className="schedule-row active"><time>14:00</time><span className="schedule-line" /><div className="schedule-main"><strong>김서연 · 4주 후속 코칭</strong><p>재측정 · 건강자산 변화 리포트</p></div><button className="mini" onClick={() => setView("session")}>세션 열기</button></div>
          <div className="schedule-row"><time>16:30</time><span className="schedule-line" /><div className="schedule-main"><strong>한지우 · 온라인 결과 상담</strong><p>리포트 설명 · 다음 목표 설정</p></div><span className="tag neutral">온라인</span></div>
        </div>
      </section>

      <section className="card pad">
        <div className="title"><div><h2>후속관리 큐</h2><p>고객 경험이 끊기지 않도록 바로 실행하세요.</p></div><span className="tag warn">{3 - followupDone.length}건 남음</span></div>
        <div className="task-list">
          {tasks.map(([name, task, date, action]) => {
            const done = followupDone.includes(name);
            return <div className={`task ${done ? "done" : ""}`} key={name}>
              <button className="check" aria-label={`${name} 완료 처리`} onClick={() => setFollowupDone(done ? followupDone.filter((item) => item !== name) : [...followupDone, name])}>{done ? "✓" : ""}</button>
              <div><strong>{name} · {task}</strong><p>{date}</p></div><button className="mini">{done ? "완료" : action}</button>
            </div>;
          })}
        </div>
      </section>
    </div>

    <section className="card pad monthly-insight">
      <div><div className="overline">이번 달 운영 인사이트</div><h2>고객 10명 중 8명이 첫 리포트 이후 후속관리를 이어가고 있어요.</h2><p>수면·회복력과 혈당대사 영역의 4주 체크인 응답률이 가장 높습니다.</p></div>
      <div className="mini-chart" aria-label="월간 고객 증가 추이">{[30, 42, 38, 55, 62, 58, 76, 82].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
    </section>
  </>;
}

function Metric({ label, value, suffix, note, tone }: { label: string; value: number; suffix: string; note: string; tone: string }) {
  return <div className={`metric ${tone}`}><span>{label}</span><div><strong>{value}</strong><em>{suffix}</em></div><p>{note}</p></div>;
}

function Clients({ query, setQuery, customers, select, selected, shareOpen, setShareOpen, copied, copyLink }: {
  query: string; setQuery: (value: string) => void; customers: typeof customers;
  select: (customer: typeof customers[number]) => void; selected: typeof customers[number];
  shareOpen: boolean; setShareOpen: (value: boolean) => void; copied: string; copyLink: (id: string, url: string) => void;
}) {
  return <>
    <section className="head"><div><div className="overline">All connected clients</div><h1>고객 관리</h1><p>내 링크로 건강관리를 시작한 모든 고객과 진행 상태를 관리합니다.</p></div><button className="btn primary" onClick={() => copyLink("quick-invite", links[0].url)}>{copied === "quick-invite" ? "✓ 링크 복사됨" : "＋ 고객 초대 링크 복사"}</button></section>
    <div className="client-layout">
      <section className="card customer-table-card">
        <div className="customer-toolbar"><label className="search-box">⌕<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름 또는 상태 검색" /></label><div className="filter-chips"><button className="active">전체 {customers.length}</button><button>후속관리</button><button>리포트 대기</button></div></div>
        <div className="customer-table">
          <div className="customer-row customer-row-head"><span>고객</span><span>진행 상태</span><span>건강자산</span><span>다음 일정</span><span /></div>
          {customers.map((customer) => <button key={customer.name} className={`customer-row ${selected.name === customer.name ? "selected" : ""}`} onClick={() => select(customer)}>
            <span className="customer-identity"><b className={`customer-avatar ${customer.color}`}>{customer.name[0]}</b><span><strong>{customer.name}</strong><small>{customer.age}세 · {customer.coach}</small></span></span>
            <span><i className="status-dot" />{customer.status}</span><span><strong>{customer.score}</strong><small className={customer.change.startsWith("-") ? "negative" : "positive"}>{customer.change}</small></span><span>{customer.next}</span><span>›</span>
          </button>)}
        </div>
      </section>

      <aside className="card client-detail">
        <div className="detail-head"><b className={`customer-avatar large ${selected.color}`}>{selected.name[0]}</b><div><h2>{selected.name}</h2><p>{selected.age}세 · {selected.status}</p></div></div>
        <div className="detail-score"><div><span>최근 건강자산</span><strong>{selected.score}</strong></div><div><span>이전 대비</span><strong className="positive">{selected.change}</strong></div></div>
        <div className="detail-block"><span>관리 우선순위</span><div className="priority-pills"><b>수면·회복력</b><b>혈당대사력</b><b>근골격 활력</b></div></div>
        <button className="btn primary wide">고객 리포트 열기</button>
        <button className="btn wide share-report" onClick={() => setShareOpen(!shareOpen)}>↗ 상위 팀·멘토에게 공유</button>
        {shareOpen && <div className="share-panel">
          <strong>리포트 공유 범위</strong><label><input type="checkbox" defaultChecked /> 박소영 멘토</label><label><input type="checkbox" /> 프리미엄 코칭 1팀</label><label><input type="checkbox" /> 센터 운영 책임자</label>
          <p>고객 동의 상태와 공유 만료일을 함께 기록합니다.</p>
          <button className="mini" onClick={() => copyLink(`report-${selected.name}`, `health-asset-coaching.chatgpt.site/report/${selected.name}`)}>{copied === `report-${selected.name}` ? "✓ 공유 링크 생성됨" : "보안 공유 링크 생성"}</button>
        </div>}
      </aside>
    </div>
  </>;
}

function Session({ overall, confidence, axes }: { overall: number; confidence: number; axes: Array<{ code: string; name: string; assetScore: number }> }) {
  return <>
    <section className="head"><div><div className="overline">Today · 14:00</div><h1>김서연님의 후속 코칭</h1><p>재측정 결과와 4주 실천 변화를 함께 확인합니다.</p></div><button className="btn primary">코칭 시작</button></section>
    <div className="report-grid">
      <section className="card hero"><div className="overline" style={{ color: "#bed7ce" }}>건강자산 점수</div><div className="big">{overall}</div><p>이전 평가보다 5점 상승했습니다. 수면·회복력과 혈당대사 영역에서 긍정적인 변화가 관찰됩니다.</p><div className="hero-meta"><span>분석 신뢰도 {confidence}</span><span>4주 변화 +5</span></div></section>
      <section className="card pad"><div className="title"><div><h2>12가지 건강 능력치</h2><p>오늘 상담에서 변화가 큰 영역부터 확인하세요.</p></div></div><div className="axis-grid">{axes.map((axis) => <div className="axis" key={axis.code}><span>{axis.name}</span><strong>{axis.assetScore}</strong><i style={{ "--score": `${axis.assetScore}%` } as React.CSSProperties} /></div>)}</div></section>
    </div>
    <section className="card pad session-actions"><div><h2>오늘의 상담 마무리</h2><p>다음 목표를 설정하고 후속관리 일정을 예약하세요.</p></div><button className="btn">4주 목표 수정</button><button className="btn primary">다음 미팅 예약</button></section>
  </>;
}

function Settings({ copied, copyLink }: { copied: string; copyLink: (id: string, url: string) => void }) {
  const [mentor, setMentor] = useState("박소영 멘토");
  return <>
    <section className="head"><div><div className="overline">Share & operation settings</div><h1>링크·운영 설정</h1><p>고객 유입부터 후속관리, 팀 공유까지 필요한 링크를 한곳에서 운영합니다.</p></div><span className="tag">공개 링크 사용 중</span></section>
    <div className="settings-grid">
      <section className="card pad link-hub">
        <div className="title"><div><h2>내 공유 링크</h2><p>카카오톡, 문자, SNS에 바로 공유할 수 있습니다.</p></div></div>
        {links.map((link) => <div className="link-row" key={link.id}><span className="link-icon">{link.icon}</span><div><strong>{link.title}</strong><p>{link.text}</p><code>{link.url}</code></div><button className="btn" onClick={() => copyLink(link.id, link.url)}>{copied === link.id ? "✓ 복사됨" : "링크 복사"}</button></div>)}
      </section>
      <aside>
        <section className="card pad">
          <div className="title"><div><h2>리포트 검토 체계</h2><p>상위 팀이나 멘토에게 공유할 기본 대상을 설정합니다.</p></div></div>
          <label className="setting-field"><span>기본 멘토</span><select value={mentor} onChange={(event) => setMentor(event.target.value)}><option>박소영 멘토</option><option>센터 운영 책임자</option><option>지정하지 않음</option></select></label>
          <label className="toggle-row"><span><strong>고객 동의 후 자동 알림</strong><small>리포트 승인 요청을 멘토에게 알립니다.</small></span><input type="checkbox" defaultChecked /></label>
          <label className="toggle-row"><span><strong>공유 링크 7일 만료</strong><small>민감정보 보호를 위해 자동으로 만료합니다.</small></span><input type="checkbox" defaultChecked /></label>
        </section>
        <section className="card pad team-card">
          <div className="title"><div><h2>팀 운영 링크</h2><p>함께 일할 코치나 멘토를 초대합니다.</p></div></div>
          <div className="team-people"><span className="customer-avatar mint">윤</span><span className="customer-avatar lilac">박</span><span className="customer-avatar sand">＋</span><div><strong>코치 1 · 멘토 1</strong><p>현재 운영 멤버</p></div></div>
          <button className="btn wide" onClick={() => copyLink("team", "health-asset-coaching.chatgpt.site/team/invite/yoon")}>{copied === "team" ? "✓ 팀 초대 링크 복사됨" : "팀원 초대 링크 복사"}</button>
        </section>
      </aside>
    </div>
    <div className="disclaimer">공개 링크는 서비스 진입용이며, 고객의 건강 리포트 원문은 고객 동의와 권한 확인 후에만 공유됩니다.</div>
  </>;
}
