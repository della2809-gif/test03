import { z } from "zod";

export const aiHealthResponseSchema = z.object({
  summary: z.string().min(1),
  observations: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      evidence: z.array(z.string()),
    }),
  ),
  actions: z.array(
    z.object({
      title: z.string().min(1),
      reason: z.string().min(1),
      priority: z.enum(["high", "medium", "low"]),
      actionType: z.enum([
        "sleep",
        "hydration",
        "activity",
        "nutrition",
        "stress",
        "medical_check",
      ]),
    }),
  ),
  cautions: z.array(z.string()),
  disclaimer: z.string().min(1),
});

export type AiHealthResponse = z.infer<typeof aiHealthResponseSchema>;

export type AiHealthContext = {
  nickname: string;
  healthAssetScore?: number;
  dataConfidence?: number;
  recentStack?: number;
  focusDomains: string[];
};
