import type { AiHealthProvider } from "./provider.ts";
import {
  aiHealthResponseSchema,
  type AiHealthContext,
  type AiHealthResponse,
} from "./types.ts";

export class MockAiHealthProvider implements AiHealthProvider {
  async createDailyCoaching(
    context: AiHealthContext,
  ): Promise<AiHealthResponse> {
    const focus = context.focusDomains[0] ?? "생활습관";
    return aiHealthResponseSchema.parse({
      summary: `${context.nickname}님의 최근 기록에서 ${focus} 관리의 꾸준함이 중요하게 보입니다.`,
      observations: [
        {
          title: "기록이 쌓이고 있어요",
          description: "작은 실천을 반복하면 변화 추세를 더 잘 이해할 수 있습니다.",
          evidence: [`최근 STACK ${context.recentStack ?? 0}`],
        },
      ],
      actions: [
        {
          title: "오늘 한 가지 행동을 완료해보세요",
          reason: `${focus} 영역의 생활 리듬을 확인하는 데 도움이 됩니다.`,
          priority: "high",
          actionType: "activity",
        },
      ],
      cautions: [],
      disclaimer:
        "WELLSET의 안내는 일반적인 웰니스 정보이며 의료 진단이나 처방을 대신하지 않습니다.",
    });
  }
}
