/** The two included Codex allowance windows returned by app-server. */
export interface CodexRateLimitWindow {
  usedPercent?: number;
  windowDurationMins?: number | null;
  resetsAt?: number | null;
}

export interface CodexRateLimitSnapshot {
  limitId?: string;
  limitName?: string | null;
  primary?: CodexRateLimitWindow | null;
  secondary?: CodexRateLimitWindow | null;
  credits?: {
    balance?: string | null;
    hasCredits?: boolean;
    unlimited?: boolean;
  } | null;
  planType?: string | null;
}

export interface CodexRateLimitsResponse {
  rateLimits?: unknown;
  rateLimitsByLimitId?: unknown;
}

export interface CodexQuotaExhaustion {
  exhausted: boolean;
  resetAt?: string;
  window?: "primary" | "secondary";
  reason?: string;
}

export const CODEX_QUOTA_POLL_INTERVAL_MS = 60_000;

export function codexQuotaRetryAt(
  exhaustion: CodexQuotaExhaustion,
  nowMs = Date.now()
): string | undefined {
  if (!exhaustion.exhausted) return undefined;
  return (
    exhaustion.resetAt ??
    new Date(nowMs + CODEX_QUOTA_POLL_INTERVAL_MS).toISOString()
  );
}

function asObject(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

/**
 * Normalizes both the current singular `rateLimits` response and the
 * multi-plan `rateLimitsByLimitId` response used by newer Codex CLIs.
 */
export function parseCodexRateLimits(
  result: CodexRateLimitsResponse | undefined
): CodexRateLimitSnapshot | undefined {
  if (!result) return undefined;
  const direct = asObject(result.rateLimits) as
    | CodexRateLimitSnapshot
    | undefined;
  if (direct) return direct;

  const byId = asObject(result.rateLimitsByLimitId);
  const first = byId ? Object.values(byId)[0] : undefined;
  return asObject(first) as CodexRateLimitSnapshot | undefined;
}

/**
 * Returns the latest future reset when included windows are exhausted. Both
 * windows must permit a request, so the later reset is the safe retry point.
 * Purchased credits are intentionally not considered: they are separate from
 * the included plan allowance and must not cause an automatic spend decision.
 */
export function getCodexQuotaExhaustion(
  snapshot: CodexRateLimitSnapshot | undefined,
  nowMs = Date.now()
): CodexQuotaExhaustion {
  if (!snapshot) return { exhausted: false };

  const exhausted = (["primary", "secondary"] as const)
    .map((window) => ({
      window,
      value: snapshot[window],
    }))
    .filter(
      (
        entry
      ): entry is {
        window: "primary" | "secondary";
        value: CodexRateLimitWindow;
      } =>
        !!entry.value &&
        typeof entry.value.usedPercent === "number" &&
        Number.isFinite(entry.value.usedPercent) &&
        entry.value.usedPercent >= 100
    )
    .map((entry) => ({
      ...entry,
      resetMs:
        typeof entry.value.resetsAt === "number" &&
        Number.isFinite(entry.value.resetsAt)
          ? entry.value.resetsAt * 1_000
          : undefined,
    }))
    .filter((entry) => entry.resetMs === undefined || entry.resetMs > nowMs)
    .sort(
      (left, right) =>
        (right.resetMs ?? Number.POSITIVE_INFINITY) -
        (left.resetMs ?? Number.POSITIVE_INFINITY)
    );

  const first = exhausted[0];
  if (!first) return { exhausted: false };

  return {
    exhausted: true,
    window: first.window,
    resetAt:
      first.resetMs === undefined
        ? undefined
        : new Date(first.resetMs).toISOString(),
    reason: `Codex ${first.window} included usage is exhausted${
      first.resetMs === undefined
        ? ""
        : ` until ${new Date(first.resetMs).toISOString()}`
    }.`,
  };
}

export function isCodexUsageLimitOutput(output: string): boolean {
  return /(?:usage|rate)[ -]?limit|too many requests|429|quota|allowance|weekly limit|5[ -]?hour/i.test(
    output
  );
}
