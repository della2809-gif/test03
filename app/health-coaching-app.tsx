"use client";
import {useMemo,useState} from "react";
import {AXES,calculateConfidence,calculateOverallAsset,calculatePriority} from "../lib/scoring";

type View="session"|"clients"|"report"|"journey";
const steps=[["사전 문진","36문항 완료"],["현장 측정","인바디 · 혈압"],["정밀 문진","맞춤 질문"],["결과 확인","임시 리포트"],["코치 승인","목표 설정"]];
const initial={height:"164.2",weight:"61.8",muscle:"22.4",fat:"31.2",waist:"78.5",visceral:"8",systolic:"128",diastolic:"82",bmr:"1247"};
const signalData=[{score:64,name:"수면·회복력",note:"자도 피곤함 · 수면 불규칙",count:4},{score:67,name:"혈당대사력",note:"식후 졸림 · 단 음식 욕구",count:3},{score:71,name:"에너지 생산력",note:"오후 피로 · 회복 지연",count:3}];
const nav:Array<[View,string,string]>=[["session","⌁","오늘의 세션"],["clients","◉","고객 관리"],["report","▤","리포트"],["journey","↗","건강 여정"]];

export function HealthCoachingApp(){
 const[view,setView]=useState<View>("session");const[step,setStep]=useState(1);const[values,setValues]=useState(initial);const[answer,setAnswer]=useState<number|null>(null);const[saved,setSaved]=useState(true);
 const confidence=useMemo(()=>calculateConfidence({questionnaire:true,lifestyle:true,bodyComposition:true,biomarkers:false,healthHistory:true}),[]);
 const axes=useMemo(()=>AXES.map((axis,i)=>({...axis,assetScore:[67,71,76,72,80,78,74,69,73,66,75,64][i],confidenceScore:confidence})),[confidence]);
 const overall=calculateOverallAsset(axes);const priority=calculatePriority({concern:36,impact:64,persistence:60,upstream:90});
 const update=(key:keyof typeof initial,value:string)=>{setValues(v=>({...v,[key]:value}));setSaved(false);setTimeout(()=>setSaved(true),420)};
 return <div className="shell">
  <aside className="side"><div className="brand"><span className="mark">H+</span>건강자산</div><nav className="nav" aria-label="주요 메뉴">{nav.map(([id,icon,label])=><button key={id} className={view===id?"active":""} onClick={()=>setView(id)}><i>{icon}</i>{label}</button>)}<button><i>⚙</i>운영 설정</button></nav><div className="profile"><div className="privacy">🔒 민감 건강정보는 동의 범위 안에서만 열람됩니다.</div><div className="coach"><div className="avatar">윤</div><div><strong>윤서진 코치</strong><span>프리미엄 코칭센터</span></div></div></div></aside>
  <main className="main"><header className="top"><div><div className="overline">Premium health coaching</div><strong>대면 코칭 워크스페이스</strong></div><span className="live">● 세션 진행 중</span></header>
  {view==="session"&&<>
   <section className="head"><div><div className="overline">2026년 7월 14일 · 14:00</div><h1>김서연님의 현장 코칭</h1><p>사전 문진을 바탕으로 측정값과 필요한 신호를 함께 확인합니다.</p></div><button className="btn">세션 메모 열기</button></section>
   <div className="steps">{steps.map(([name,sub],i)=><button key={name} className={`step ${i<step?"done":""} ${i===step?"active":""}`} onClick={()=>setStep(i)}><b>{i<step?"✓":i+1}</b><span><strong>{name}</strong>{sub}</span></button>)}</div>
   <div className="grid"><div>
    <section className="card pad"><div className="title"><div><h2>현장 측정값</h2><p>고객과 수치를 함께 확인한 뒤 저장해주세요.</p></div><span className="tag">인바디 직접 측정</span></div><div className="fields">{([['height','신장','cm'],['weight','체중','kg'],['muscle','골격근량','kg'],['fat','체지방률','%'],['waist','허리둘레','cm'],['visceral','내장지방 레벨','level'],['systolic','수축기 혈압','mmHg'],['diastolic','이완기 혈압','mmHg'],['bmr','기초대사량','kcal']] as const).map(([key,label,unit])=><label className="field" key={key}><span>{label}</span><div><input aria-label={label} inputMode="decimal" value={values[key]} onChange={e=>update(key,e.target.value)}/><em>{unit}</em></div></label>)}</div><div className="foot"><span>측정기기 InBody 770 · 14:12</span><span className="saved">{saved?"✓ 자동 저장됨":"저장 중…"}</span></div></section>
    <section className="card pad" style={{marginTop:20}}><div className="title"><div><h2>정밀 확인이 필요한 영역</h2><p>1차 선별과 현장 측정을 연결해 추가 질문을 제안합니다.</p></div><span className="tag warn">3개 영역</span></div><div className="signals">{signalData.map(s=><div className="signal" key={s.name}><div className="score">{s.score}</div><div><strong>{s.name}</strong><p>{s.note} · 추가 {s.count}문항</p></div><button className="mini" onClick={()=>{setStep(2);document.getElementById("question")?.scrollIntoView({behavior:"smooth"})}}>확인하기</button></div>)}</div></section>
   </div><aside className="rail">
    <section className="card client"><div className="avatar">김</div><div><h3>김서연 · 38세</h3><p>첫 방문 · 개인정보 동의 완료</p></div><button className="btn" aria-label="고객 상세">···</button></section>
    <section className="card confidence"><div className="confidence-head"><div><div className="overline">분석 신뢰도</div><strong>{confidence}</strong></div><span>보통</span></div><div className="bar"><i style={{width:`${confidence}%`}}/></div><p>사전 문진, 생활습관과 오늘의 인바디 측정값을 반영했습니다.</p><div className="missing">＋ 최근 혈액검사 추가 시 근거 강화</div></section>
    <section className="question" id="question"><small>정밀 문진 · 수면·회복력 1/4</small><h2>충분히 잤다고 생각해도 아침에 개운하지 않은 날이 얼마나 있었나요?</h2><div className="answers">{["전혀 없음","가끔","자주","거의 매일"].map((x,i)=><button key={x} className={answer===i?"selected":""} onClick={()=>{setAnswer(i);setStep(3)}}>{x}</button>)}</div><div className="qmeta"><span>최근 4주 기준</span><span>고객 답변 · 코치 입력</span></div></section>
    <section className="card preview"><div className="ring"><div><strong>{overall}</strong><span>잠정 점수</span></div></div><h3>임시 리포트 준비 중</h3><p>정밀 문진 후 관리 우선순위와 4주 목표를 확인할 수 있어요.</p><div className="lock">ⓘ 현재 우선순위 계산값 {priority}점 · 코치 승인 전에는 임시 분석으로 표시됩니다.</div></section>
   </aside></div><div className="disclaimer">ⓘ 이 점수는 의료적 진단 점수가 아닙니다. 입력한 증상, 생활습관 및 측정자료를 기반으로 현재 관리 필요도를 쉽게 이해하도록 환산한 웰니스 지표입니다.</div>
  </>}
  {view==="report"&&<Report overall={overall} axes={axes}/>} {view==="clients"&&<Empty icon="◉" title="담당 고객을 한눈에" text="사전 문진 완료 여부와 오늘 예약된 코칭 세션을 확인하는 고객 목록이 이곳에 표시됩니다." action="새 고객 초대"/>}{view==="journey"&&<Empty icon="↗" title="변화를 과장 없이 기록해요" text="문진, 인바디, 검사와 4주 체크인을 시간순으로 연결해 개인의 변화 흐름을 보여줍니다." action="김서연님의 여정 보기"/>}
  </main><nav className="mobile">{nav.map(([id,icon,label])=><button key={id} className={view===id?"active":""} onClick={()=>setView(id)}><b>{icon}</b>{label}</button>)}</nav>
 </div>
}

function Report({overall,axes}:{overall:number;axes:Array<{code:string;name:string;assetScore:number}>}){return <><section className="head"><div><div className="overline">Coach review</div><h1>임시 분석 리포트</h1><p>계산 결과를 확인하고 상담 코멘트를 더한 뒤 고객에게 발행하세요.</p></div><button className="btn primary">검토 후 승인하기</button></section><div className="report-grid"><section className="card hero"><div className="overline" style={{color:"#bed7ce"}}>건강자산 잠정 점수</div><div className="big">{overall}</div><p>관리 신호와 긍정적인 생활 기반을 현재 확보된 자료 안에서 함께 환산했습니다.</p></section><section className="card pad"><div className="title"><div><h2>12가지 건강 능력치</h2><p>절대 건강 상태가 아닌 입력 자료 기반 웰니스 지표입니다.</p></div></div><div className="axis-grid">{axes.map(a=><div className="axis" key={a.code}><span>{a.name}</span><strong>{a.assetScore}</strong><i style={{"--score":`${a.assetScore}%`} as React.CSSProperties}/></div>)}</div></section></div></>}
function Empty({icon,title,text,action}:{icon:string;title:string;text:string;action:string}){return <><section className="head"><div><div className="overline">Health asset workspace</div><h1>{title}</h1></div></section><section className="card empty"><b>{icon}</b><h2>{title}</h2><p>{text}</p><button className="btn primary">{action}</button></section></>}
