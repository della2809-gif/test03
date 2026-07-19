export type Locale = "ko" | "en";

export const DEFAULT_LOCALE: Locale = "ko";
export const LOCALE_STORAGE_KEY = "wellset-locale";

export const isLocale = (value: unknown): value is Locale =>
  value === "ko" || value === "en";

const en = {
  brand: "Health Asset",
  healthAccount: "Health Account",
  todayMission: "Today's Mission",
  community: "Community",
  coachOperations: "Coach Console",
  freeCheck: "Free Health Check",
  customerView: "Customer View",
  heroEyebrow: "AI HEALTH ASSET PLATFORM",
  heroTitle1: "Your health is your",
  heroTitle2: "most valuable asset.",
  heroBody:
    "Check 12 health asset areas in five minutes and build long-term wellbeing through small daily actions.",
  startCheck: "Start 5-min health check",
  previewAccount: "Preview my Health Account",
  noSignup: "No sign-up required",
  instantResult: "Instant results",
  notDiagnosis: "Not a medical diagnosis",
  journeyTitle: "Turn one check into a lifelong health habit",
  journeyBody:
    "It does not end with a test. AI supports daily action, and a professional coach joins when needed.",
  weeklyCoach: "A health coach that understands you better each week",
  weeklyCoachBody: "Guidance becomes more specific as your records grow.",
  accountPromoTitle: "All your health records in one place",
  accountPromoBody:
    "Review weight, body composition, blood pressure, glucose, exercise and nutrition by week or month.",
  exploreAccount: "Explore Health Account →",
  premiumTitle: "When you need a more precise change, meet a coach in person.",
  premiumBody:
    "Measure body composition on site, review lifestyle patterns, and build a practical personal plan.",
  startFree: "Start with a free check",
  accountHeading: "Kim Seoyeon's Health Account",
  accountIntro: "Every small change is being recorded as a health asset.",
  checkAgain: "Retake health check",
  monthlyAsset: "July 2026 Health Asset",
  versusLastMonth: "+4 from last month",
  weight: "Weight",
  skeletalMuscle: "Skeletal muscle",
  bloodPressure: "Blood pressure",
  weeklyExercise: "Weekly exercise",
  monthlyExercise: "Monthly exercise",
  stable: "Stable",
  viewTrend: "View trend ↓",
  closeTrend: "Close trend ↑",
  cumulativeTrend: "Cumulative trend",
  weekly: "Weekly",
  monthly: "Monthly",
  close: "Close ×",
  metricNote:
    "Weight, muscle and blood pressure show trends rather than sums. Only exercise time is accumulated.",
  accumulatedTitle: "Weekly · Monthly Health Assets",
  accumulatedBody: "Recorded actions and measurements are summarized by period.",
  accumulatedPoints: "Accumulated points",
  completedMissions: "Completed missions",
  exerciseTime: "Exercise time",
  averageAsset: "Average health asset",
  assetHistory: "Health asset history",
  pointsEarned: "Earned from healthy actions",
  actionTotal: "Accumulated action records",
  activityTotal: "Total activity recorded",
  periodAverage: "Average measurements in period",
  footerCopy: "Record your health. Build your health.",
  language: "Language",
  korean: "한국어",
  english: "English",
} as const;

export type MessageKey = keyof typeof en;

const ko: Record<MessageKey, string> = {
  brand: "건강자산",
  healthAccount: "건강통장",
  todayMission: "오늘의 미션",
  community: "커뮤니티",
  coachOperations: "코치 운영",
  freeCheck: "무료 건강체크",
  customerView: "고객용 화면",
  heroEyebrow: "AI HEALTH ASSET PLATFORM",
  heroTitle1: "건강도 나의 소중한",
  heroTitle2: "자산입니다.",
  heroBody:
    "혈당대사부터 회복력까지 12대 건강영역을 5분 만에 체크하고, 매일 작은 실천으로 나만의 건강자산을 쌓아보세요.",
  startCheck: "5분 무료 건강체크",
  previewAccount: "내 건강통장 미리보기",
  noSignup: "회원가입 없이 시작",
  instantResult: "결과 즉시 확인",
  notDiagnosis: "의료 진단 아님",
  journeyTitle: "한 번의 체크가 평생의 건강 습관이 되도록",
  journeyBody:
    "검사에서 끝나지 않습니다. AI가 매일의 실천을 돕고, 중요한 순간에는 전문 코치가 함께합니다.",
  weeklyCoach: "매주 나를 더 잘 아는 건강 코치",
  weeklyCoachBody: "기록이 쌓일수록 조언은 더 구체적으로 바뀝니다.",
  accountPromoTitle: "흩어진 건강 기록을 한곳에 차곡차곡",
  accountPromoBody:
    "체중, 인바디, 혈압, 혈당, 운동과 영양 기록을 주·월별로 확인하세요.",
  exploreAccount: "건강통장 둘러보기 →",
  premiumTitle: "더 정확한 변화가 필요할 때, 전문 코치와 직접 만나요.",
  premiumBody:
    "현장에서 인바디를 측정하고 생활 패턴을 함께 확인한 뒤, 바로 실천할 수 있는 개인 플랜을 설계합니다.",
  startFree: "무료 체크부터 시작하기",
  accountHeading: "김서연님의 건강통장",
  accountIntro: "작은 변화도 빠짐없이 건강자산으로 기록하고 있어요.",
  checkAgain: "건강체크 다시 하기",
  monthlyAsset: "2026년 7월 건강자산",
  versusLastMonth: "지난달보다 +4",
  weight: "체중",
  skeletalMuscle: "골격근량",
  bloodPressure: "혈압",
  weeklyExercise: "주간 운동",
  monthlyExercise: "월간 운동",
  stable: "안정",
  viewTrend: "추이 보기 ↓",
  closeTrend: "추이 닫기 ↑",
  cumulativeTrend: "누적 추이",
  weekly: "주간",
  monthly: "월간",
  close: "닫기 ×",
  metricNote:
    "체중·골격근량·혈압은 합산하지 않고 변화 추이를 보여주며, 운동시간만 기간별로 누적합니다.",
  accumulatedTitle: "주·월 누적 건강자산",
  accumulatedBody: "기록된 행동과 측정 결과를 기간별로 합산했어요.",
  accumulatedPoints: "누적 포인트",
  completedMissions: "완료 미션",
  exerciseTime: "운동 시간",
  averageAsset: "평균 건강자산",
  assetHistory: "건강자산이 쌓인 기록",
  pointsEarned: "건강 행동으로 적립",
  actionTotal: "실천 기록 누적",
  activityTotal: "활동 기록 합계",
  periodAverage: "기간 내 측정 평균",
  footerCopy: "건강을 기록하고, 건강을 쌓다.",
  language: "언어",
  korean: "한국어",
  english: "English",
};

export const messages: Record<Locale, Record<MessageKey, string>> = { ko, en };

export function translate(locale: Locale, key: MessageKey) {
  return messages[locale][key];
}
