export type AxisScore={assetScore:number;confidenceScore:number;baseWeight?:number};
export const AXES=[["metabolic","혈당대사력"],["energy","에너지 생산력"],["digestive","소화건강력"],["inflammation","염증 균형력"],["immune","면역 방어력"],["hormone","호르몬 균형력"],["detox","해독·정화력"],["brain","집중·기억력"],["circulation","혈관 건강력"],["muscle","근골격 활력"],["youth","젊음지수"],["recovery","수면·회복력"]].map(([code,name])=>({code,name,baseWeight:1}));
export const clamp=(n:number)=>Math.min(100,Math.max(0,n));
export function calculateConfidence(x:{questionnaire:boolean;lifestyle:boolean;bodyComposition:boolean;biomarkers:boolean;healthHistory:boolean}){return clamp((x.questionnaire?35:0)+(x.lifestyle?15:0)+(x.bodyComposition?15:0)+(x.biomarkers?25:0)+(x.healthHistory?10:0))}
const factor=(n:number)=>n>=80?1:n>=60?.85:n>=40?.65:.4;
export function calculateOverallAsset(axes:AxisScore[]){if(!axes.length)return 0;const x=axes.reduce((s,a)=>{const w=(a.baseWeight??1)*factor(a.confidenceScore);return{total:s.total+clamp(a.assetScore)*w,weight:s.weight+w}},{total:0,weight:0});return Math.round(x.total/x.weight)}
export function calculatePriority(x:{concern:number;objective?:number;impact?:number;persistence?:number;upstream:number;trend?:number}){const p=[{v:x.concern,w:.45},{v:x.objective,w:.2},{v:x.impact,w:.1},{v:x.persistence,w:.08},{v:x.upstream,w:.1},{v:x.trend,w:.07}].filter((a):a is {v:number;w:number}=>a.v!==undefined);const w=p.reduce((s,a)=>s+a.w,0);return Math.round(p.reduce((s,a)=>s+clamp(a.v)*a.w,0)/w)}
export const calculateAxisAsset=(concern:number)=>clamp(100-clamp(concern));
