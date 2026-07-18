import type { AssessmentQuestion } from "./types.ts";
import type { Locale } from "../../lib/i18n.ts";

const prompts: Record<string, string> = {
  "hc-metabolic": "Do you feel sleepy after meals, crave sweets, or gain weight around your abdomen?",
  "hc-energy": "Are you tired in the morning, sluggish in the afternoon, or easily exhausted after activity?",
  "hc-gut": "Do you experience constipation, diarrhea, bloating, or discomfort after meals?",
  "hc-inflammation": "Do you often feel swollen, stiff, sore, or slow to recover?",
  "hc-immune": "Do you frequently have colds, allergies, mouth sores, or slow wound healing?",
  "hc-hormone": "Do your weight, mood, sleep, temperature, or vitality change significantly in cycles?",
  "hc-liver": "Do you feel unusually tired after drinking, sensitive to odors, or slow to recover?",
  "hc-brain": "Do you notice reduced focus or memory, tension, or frequent emotional changes?",
  "hc-circulation": "Do you often have cold or tingling hands and feet, swelling, or shortness of breath?",
  "hc-body": "Do you have joint, neck, shoulder, or back discomfort, weakness, or muscle cramps?",
  "hc-skin": "Have you noticed dry skin, reduced elasticity, hair loss, or weak nails?",
  "hc-recovery": "Is your sleep uncomfortable, with morning fatigue or slow recovery after stress or exercise?",
  "ls-metabolic": "Do you keep regular meal times and manage overeating and frequent sweets?",
  "ls-energy": "Do you manage daily energy with regular meals and light activity?",
  "ls-gut": "Do you eat slowly and get enough water and fiber for a comfortable bowel rhythm?",
  "ls-inflammation": "Do you reduce late meals and sleep loss and allow enough recovery after activity?",
  "ls-immune": "Do you consistently support recovery with sleep, protein, and vegetables?",
  "ls-hormone": "Do you keep regular sleep, wake, and meal times and observe your body rhythm?",
  "ls-liver": "Do you moderate alcohol and late-night meals and get enough water and rest?",
  "ls-brain": "Do you take screen-free breaks or make time to lower stress and tension?",
  "ls-circulation": "Do you walk daily, change posture often, and check blood pressure and lipids regularly?",
  "ls-body": "Do you do strength and joint-mobility activities at least twice a week?",
  "ls-skin": "Do you get enough protein, vegetables, and water and protect your skin from UV and irritation?",
  "ls-recovery": "Do you maintain regular sleep and enough rest to feel recovered the next day?",
};

const frequencyOptions = ["Rarely", "Sometimes", "Often", "Almost always"];
const habitOptions = ["Consistently", "Mostly", "Occasionally", "Rarely"];

export function localizeQuestion(question: AssessmentQuestion, locale: Locale): AssessmentQuestion {
  if (locale === "ko") return question;
  return {
    ...question,
    prompt: prompts[question.id] ?? question.prompt,
    helper: question.section === "health-check"
      ? "Answer based on your average experience over the past two weeks."
      : "Choose the option closest to your habits over the past two weeks.",
    options: question.options.map((option, index) => ({
      ...option,
      label: question.section === "health-check" ? frequencyOptions[index] : habitOptions[index],
    })),
  };
}
