export type JourneyContext = {
  visitorId?: string;
  contentId?: string;
  keywordId?: string;
  campaignId?: string;
  referralCode?: string;
  checkId?: string;
};

type JourneyEvent = JourneyContext & {
  name: string;
  occurredAt: string;
};

const CONTEXT_KEY = "wellset-journey-context-v1";
const EVENT_KEY = "wellset-journey-events-v1";
const VISITOR_KEY = "wellset-visitor-id-v1";

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function ensureVisitorId(preferred?: string): string {
  if (preferred) {
    window.localStorage.setItem(VISITOR_KEY, preferred);
    return preferred;
  }
  const saved = window.localStorage.getItem(VISITOR_KEY);
  if (saved) return saved;
  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(VISITOR_KEY, created);
  return created;
}

export function captureJourneyContext(search: string): JourneyContext {
  const params = new URLSearchParams(search);
  const previous = readJson<JourneyContext>(CONTEXT_KEY, {});
  const next: JourneyContext = {
    ...previous,
    visitorId: ensureVisitorId(params.get("visitor_id") ?? previous.visitorId),
    contentId: params.get("content_id") ?? previous.contentId,
    keywordId: params.get("keyword_id") ?? previous.keywordId,
    campaignId: params.get("campaign_id") ?? previous.campaignId,
    referralCode: params.get("referral_code") ?? previous.referralCode,
    checkId: params.get("check_id") ?? previous.checkId,
  };
  window.localStorage.setItem(CONTEXT_KEY, JSON.stringify(next));
  return next;
}

export function recordJourneyEvent(
  name: string,
  context: JourneyContext = {},
) {
  const stored = readJson<JourneyContext>(CONTEXT_KEY, {});
  const events = readJson<JourneyEvent[]>(EVENT_KEY, []);
  const event: JourneyEvent = {
    ...stored,
    ...context,
    name,
    occurredAt: new Date().toISOString(),
  };
  window.localStorage.setItem(
    EVENT_KEY,
    JSON.stringify([...events.slice(-99), event]),
  );
}
