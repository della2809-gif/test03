const JOURNAL_URL =
  "https://wellset-journal.fluffy-cow-3410.chatgpt.site";

export type JournalRecommendation = {
  id: string;
  title: string;
  summary: string;
  category: string;
  href: string;
};

const content = {
  compound: {
    id: "journal-health-compound",
    title: "건강은 복리로 쌓인다",
    summary: "수면, 물, 걷기와 기록을 건강자산으로 쌓는 방법",
    category: "건강 자산",
    href: `${JOURNAL_URL}/#article-health-compound`,
  },
  sleepRoutine: {
    id: "journal-sleep-routine",
    title: "피부 컨디션을 바꾸는 저녁 습관",
    summary: "수면과 수분, 회복 리듬을 함께 점검하는 저녁 루틴",
    category: "수면·회복",
    href: `${JOURNAL_URL}/#article-sleep-score`,
  },
  energyFatigue: {
    id: "journal-energy-fatigue",
    title: "8시간 자도 피곤한 이유",
    summary: "수면 시간만으로 설명되지 않는 피로와 에너지 리듬 살펴보기",
    category: "에너지 자산",
    href: `${JOURNAL_URL}/#article-energy-fatigue`,
  },
  glucose: {
    id: "journal-glucose-order",
    title: "식후 혈당 스파이크를 줄이는 식사 순서",
    summary: "오늘 식사부터 적용할 수 있는 현실적인 순서 안내",
    category: "혈당대사",
    href: `${JOURNAL_URL}/#article-postmeal-sleepiness`,
  },
  hydration: {
    id: "journal-hydration-routine",
    title: "수분과 생활 리듬을 함께 관리하는 법",
    summary: "물을 챙기고 기록을 이어가는 작은 건강 루틴",
    category: "에너지",
    href: `${JOURNAL_URL}/#article-water-seven-days`,
  },
  walking: {
    id: "journal-walking-start",
    title: "매일 반복되는 작은 선택이 자산이 되는 이유",
    summary: "부담 없이 시작하는 걷기와 건강 기록",
    category: "근육·순환",
    href: `${JOURNAL_URL}/#article-parent-muscle`,
  },
  muscle: {
    id: "journal-parent-muscle",
    title: "부모님의 근육이 줄고 있다는 신호",
    summary: "걷는 속도와 일상 동작에서 확인하는 근력 변화 신호",
    category: "근육 자산",
    href: `${JOURNAL_URL}/#article-parent-muscle`,
  },
  recovery: {
    id: "journal-recovery-note",
    title: "내 몸의 신호를 이해하고 기록하는 방법",
    summary: "몸의 신호를 읽고 작은 행동으로 연결하는 WELLSET 가이드",
    category: "회복력",
    href: `${JOURNAL_URL}/#about`,
  },
} satisfies Record<string, JournalRecommendation>;

const byDomain: Record<string, JournalRecommendation[]> = {
  metabolic: [content.glucose, content.walking, content.compound],
  energy: [content.energyFatigue, content.sleepRoutine, content.hydration],
  lifestyle: [content.sleepRoutine, content.energyFatigue, content.recovery],
  "brain-stress": [content.sleepRoutine, content.recovery, content.hydration],
  "body-composition": [content.muscle, content.walking, content.compound],
  circulation: [content.walking, content.glucose, content.compound],
};

export function recommendJournalContent(
  priorityCodes: string[],
  limit = 3,
): JournalRecommendation[] {
  const candidates = priorityCodes.flatMap((code) => byDomain[code] ?? []);
  const fallback = [content.compound, content.recovery, content.sleepRoutine];
  const unique = new Map<string, JournalRecommendation>();

  for (const item of [...candidates, ...fallback]) {
    if (!unique.has(item.id)) unique.set(item.id, item);
  }

  return [...unique.values()].slice(0, limit);
}
