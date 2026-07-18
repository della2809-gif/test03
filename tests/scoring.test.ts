import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateAxisAsset,
  calculateConfidence,
  calculateHealthAssetScore,
  calculateOverallAsset,
  calculatePriority,
  getScoreStatus,
} from "../lib/scoring.ts";
import { calculateDailyStack, calculateStreak } from "../lib/stack.ts";
import { aiHealthResponseSchema } from "../lib/ai/types.ts";
import { MockAiHealthProvider } from "../lib/ai/mock-provider.ts";

test("문진만 있으면 신뢰도가 제한적이다",()=>assert.equal(calculateConfidence({questionnaire:true,lifestyle:false,bodyComposition:false,biomarkers:false,healthHistory:false}),35));
test("객관적 자료가 추가되면 신뢰도가 올라간다",()=>{const a=calculateConfidence({questionnaire:true,lifestyle:true,bodyComposition:false,biomarkers:false,healthHistory:false});const b=calculateConfidence({questionnaire:true,lifestyle:true,bodyComposition:true,biomarkers:true,healthHistory:false});assert.ok(b>a)});
test("누락 우선순위 요소는 0이 아닌 재정규화로 처리한다",()=>assert.equal(calculatePriority({concern:50,upstream:50}),50));
test("자산점수는 범위를 벗어나지 않는다",()=>{assert.equal(calculateAxisAsset(-10),100);assert.equal(calculateAxisAsset(120),0)});
test("종합 점수는 결정적이고 입력 범위 안에 있다",()=>{const axes=[{assetScore:70,confidenceScore:65},{assetScore:80,confidenceScore:85}];const score=calculateOverallAsset(axes);assert.equal(score,calculateOverallAsset(axes));assert.ok(score>=70&&score<=80)});
test("누락된 검진과 인바디 가중치는 재정규화한다",()=>{
  const result=calculateHealthAssetScore({symptoms:70,lifestyle:80});
  assert.equal(result.score,75);
  assert.equal(result.confidence,65);
  assert.equal(result.scoreVersion,"wellset-score-v1");
});
test("점수 구간은 의료 진단 용어 없이 설명한다",()=>{
  assert.equal(getScoreStatus(85),"안정적으로 관리 중");
  assert.equal(getScoreStatus(65),"관심 필요");
  assert.equal(getScoreStatus(45),"집중관리 권장");
  assert.equal(getScoreStatus(20),"건강멘토상담필요");
});
test("오늘의 STACK은 완료한 행동 이벤트의 합으로 계산한다",()=>{
  const result=calculateDailyStack({sleepGoal:true,hydrationGoal:true,conditionLogged:true});
  assert.equal(result.total,5);
  assert.deepEqual(result.events.map(event=>event.eventType),["sleepGoal","hydrationGoal","conditionLogged"]);
});
test("연속 기록일은 기준일부터 거꾸로 계산한다",()=>{
  assert.equal(calculateStreak(["2026-07-16","2026-07-17","2026-07-18"],"2026-07-18"),3);
  assert.equal(calculateStreak(["2026-07-16"],"2026-07-18"),0);
});
test("Mock AI 응답은 구조화된 스키마를 통과한다",async()=>{
  const provider=new MockAiHealthProvider();
  const response=await provider.createDailyCoaching({nickname:"웰셋 사용자",recentStack:7,focusDomains:["수면"]});
  assert.equal(aiHealthResponseSchema.safeParse(response).success,true);
});
