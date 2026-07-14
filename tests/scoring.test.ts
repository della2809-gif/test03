import assert from "node:assert/strict";
import test from "node:test";
import {calculateAxisAsset,calculateConfidence,calculateOverallAsset,calculatePriority} from "../lib/scoring.ts";

test("문진만 있으면 신뢰도가 제한적이다",()=>assert.equal(calculateConfidence({questionnaire:true,lifestyle:false,bodyComposition:false,biomarkers:false,healthHistory:false}),35));
test("객관적 자료가 추가되면 신뢰도가 올라간다",()=>{const a=calculateConfidence({questionnaire:true,lifestyle:true,bodyComposition:false,biomarkers:false,healthHistory:false});const b=calculateConfidence({questionnaire:true,lifestyle:true,bodyComposition:true,biomarkers:true,healthHistory:false});assert.ok(b>a)});
test("누락 우선순위 요소는 0이 아닌 재정규화로 처리한다",()=>assert.equal(calculatePriority({concern:50,upstream:50}),50));
test("자산점수는 범위를 벗어나지 않는다",()=>{assert.equal(calculateAxisAsset(-10),100);assert.equal(calculateAxisAsset(120),0)});
test("종합 점수는 결정적이고 입력 범위 안에 있다",()=>{const axes=[{assetScore:70,confidenceScore:65},{assetScore:80,confidenceScore:85}];const score=calculateOverallAsset(axes);assert.equal(score,calculateOverallAsset(axes));assert.ok(score>=70&&score<=80)});
