import type { AiHealthContext, AiHealthResponse } from "./types.ts";

export interface AiHealthProvider {
  createDailyCoaching(context: AiHealthContext): Promise<AiHealthResponse>;
}
