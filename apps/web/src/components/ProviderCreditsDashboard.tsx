import type {
  OrchestratorCliProviderDescriptor,
  ProviderCreditMetric,
  ProviderCreditStatus,
  ProviderCreditsDashboard as ProviderCreditsDashboardData,
} from "@coding-agent-orchestrator/shared";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

interface ProviderCreditsDashboardProps {
  active: boolean;
  providers: OrchestratorCliProviderDescriptor[];
}

export function ProviderCreditsDashboard(props: ProviderCreditsDashboardProps) {
  const [dashboard, setDashboard] = useState<ProviderCreditsDashboardData>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [hasRequested, setHasRequested] = useState(false);
  const providerOrder = useMemo(
    () =>
      new Map(props.providers.map((provider, index) => [provider.id, index])),
    [props.providers]
  );
  const visibleProviders = useMemo(
    () =>
      [...(dashboard?.providers ?? [])].sort(
        (left, right) =>
          (providerOrder.get(left.providerId) ?? Number.MAX_SAFE_INTEGER) -
          (providerOrder.get(right.providerId) ?? Number.MAX_SAFE_INTEGER)
      ),
    [dashboard?.providers, providerOrder]
  );

  useEffect(() => {
    if (!props.active || dashboard || loading || hasRequested) return;
    void loadDashboard(false);
  }, [props.active, dashboard, loading, hasRequested]);

  async function loadDashboard(forceRefresh: boolean) {
    setHasRequested(true);
    setLoading(true);
    setError(undefined);
    try {
      setDashboard(await api.getProviderCredits(forceRefresh));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load provider usage."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="settings-card provider-credits-dashboard orchestrator-workspace-panel orchestrator-board-card"
      data-mobile-visible={props.active}
      aria-hidden={!props.active}
      hidden={!props.active}
      data-testid="provider-credits-dashboard"
    >
      <header className="provider-credits-header">
        <div>
          <div className="eyebrow">Provider allowance</div>
          <h3>Credits and usage</h3>
          <p className="panel-caption">
            Live balances where the CLI exposes them, with honest fallbacks to
            local stats or the provider dashboard everywhere else.
          </p>
        </div>
        <button
          type="button"
          className="ghost-button"
          disabled={loading}
          onClick={() => void loadDashboard(true)}
        >
          {loading ? "Refreshing…" : "Refresh usage"}
        </button>
      </header>

      {dashboard ? (
        <div className="provider-credits-timestamp" aria-live="polite">
          Checked {formatRelativeTime(dashboard.checkedAt)}
          {" · cached for "}
          {dashboard.cacheTtlSeconds}s
        </div>
      ) : null}
      {error ? (
        <div className="inline-error-banner" role="alert">
          {error}{" "}
          <button
            type="button"
            className="ghost-button"
            onClick={() => void loadDashboard(true)}
          >
            Try again
          </button>
        </div>
      ) : null}
      {loading && !dashboard ? (
        <div className="provider-credit-loading" role="status">
          Asking installed provider CLIs for their current allowance…
        </div>
      ) : null}

      <div className="provider-credit-grid">
        {visibleProviders.map((provider) => (
          <ProviderCreditCard key={provider.providerId} provider={provider} />
        ))}
      </div>
    </section>
  );
}

function ProviderCreditCard(props: { provider: ProviderCreditStatus }) {
  const { provider } = props;
  const isCodex = provider.providerId === "codex";
  const nextSafePromptAt = isCodex ? getNextSafePromptAt(provider) : undefined;
  return (
    <article
      className={`provider-credit-card provider-credit-card-${provider.status}${isCodex ? " provider-credit-card-codex" : ""}`}
    >
      <header className="provider-credit-card-header">
        <div>
          <h4>{provider.displayName}</h4>
          {provider.plan ? (
            <span className="provider-credit-plan">{provider.plan}</span>
          ) : null}
        </div>
        <span className={`provider-credit-status status-${provider.status}`}>
          {statusLabel(provider)}
        </span>
      </header>

      <p className="provider-credit-summary">{provider.summary}</p>

      {isCodex && provider.status === "live" && provider.metrics.length > 0 ? (
        <CodexQuotaOverview
          provider={provider}
          nextSafePromptAt={nextSafePromptAt}
        />
      ) : null}

      {provider.metrics.length > 0 ? (
        <div className="provider-credit-metrics">
          {provider.metrics.map((metric) => (
            <ProviderCreditMetricRow key={metric.id} metric={metric} />
          ))}
        </div>
      ) : null}

      {provider.accountUrl && provider.actionLabel ? (
        <a
          className="provider-credit-link"
          href={provider.accountUrl}
          target="_blank"
          rel="noreferrer"
        >
          {provider.actionLabel} <span aria-hidden="true">↗</span>
        </a>
      ) : null}
    </article>
  );
}

/**
 * Codex exposes two rolling windows (normally five hours and seven days).
 * Keep this presentation tolerant of older runtimes and newer quota payloads:
 * the currently shipped metric shape is enough to render the windows, while
 * optional nextSafePromptAt/nextAvailableAt fields can provide a more precise
 * answer when the runtime has rate-limit scheduling enabled.
 */
function CodexQuotaOverview(props: {
  provider: ProviderCreditStatus;
  nextSafePromptAt?: string;
}) {
  const exhausted = props.provider.metrics.some(isMetricExhausted);
  const nextSafePromptAt = props.nextSafePromptAt;
  return (
    <div className="codex-quota-overview" data-testid="codex-quota-overview">
      <div className="codex-quota-overview-heading">
        <span className="eyebrow">Codex prompt windows</span>
        <span
          className={
            exhausted ? "codex-quota-state is-waiting" : "codex-quota-state"
          }
        >
          {exhausted ? "Waiting for allowance" : "Safe to prompt"}
        </span>
      </div>
      <p className="codex-quota-overview-copy">
        Prompts use both the rolling 5-hour and weekly allowance. A deferred
        prompt starts, or resumes its saved Codex session, when the next window
        opens.
      </p>
      {nextSafePromptAt ? (
        <div className="codex-next-safe-prompt" role="status">
          <strong>Next safe prompt</strong>
          <time dateTime={nextSafePromptAt}>
            {formatResetTime(nextSafePromptAt)}
          </time>
        </div>
      ) : null}
    </div>
  );
}

function ProviderCreditMetricRow(props: { metric: ProviderCreditMetric }) {
  const { metric } = props;
  const codexWindow = metric.id === "primary" || metric.id === "secondary";
  const label = codexWindow ? codexWindowLabel(metric) : metric.label;
  const remaining = metric.remainingPercent;
  const tone =
    remaining === undefined
      ? "neutral"
      : remaining <= 10
        ? "danger"
        : remaining <= 25
          ? "warning"
          : "healthy";
  return (
    <div className="provider-credit-metric">
      <div className="provider-credit-metric-heading">
        <span>{label}</span>
        <strong>{metric.value}</strong>
      </div>
      {remaining !== undefined ? (
        <div
          className={`provider-credit-progress tone-${tone}`}
          role="progressbar"
          aria-label={`${metric.label} remaining`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={remaining}
        >
          <span style={{ width: `${remaining}%` }} />
        </div>
      ) : null}
      {metric.resetAt || metric.detail ? (
        <div className="provider-credit-metric-detail">
          {metric.resetAt ? (
            <time dateTime={metric.resetAt}>
              Resets {formatResetTime(metric.resetAt)}
            </time>
          ) : null}
          {metric.resetAt && metric.detail ? " · " : null}
          {metric.detail}
        </div>
      ) : null}
    </div>
  );
}

function statusLabel(provider: ProviderCreditStatus): string {
  switch (provider.status) {
    case "live":
      return "Live";
    case "local":
      return "Local stats";
    case "interactive":
      return "Open provider";
    case "error":
      return "Refresh failed";
    case "not-installed":
      return "Not installed";
    default:
      return "Unavailable";
  }
}

function formatResetTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const exact = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  const relative = formatRelativeDuration(date.getTime() - Date.now());
  return `${exact} (${relative})`;
}

function formatRelativeDuration(deltaMs: number): string {
  if (deltaMs < 0) return "reset due";
  if (deltaMs <= 30_000) return "now";
  const totalMinutes = Math.max(1, Math.round(deltaMs / 60_000));
  if (totalMinutes < 60) return `in ${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 24) return minutes ? `in ${hours}h ${minutes}m` : `in ${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours ? `in ${days}d ${remainingHours}h` : `in ${days}d`;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : undefined;
}

function readString(
  record: UnknownRecord | undefined,
  keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function getNextSafePromptAt(
  provider: ProviderCreditStatus
): string | undefined {
  const record = provider as unknown as UnknownRecord;
  const quota = asRecord(record.quota) ?? asRecord(record.codexQuota) ?? record;
  const direct = readString(quota, [
    "nextSafePromptAt",
    "nextSafePromptTime",
    "nextAvailableAt",
    "safeToPromptAt",
    "resumeAt",
  ]);
  if (direct && Date.parse(direct) > Date.now()) {
    return direct;
  }

  // If the runtime has not added a provider-level next-safe timestamp yet,
  // use the latest reset among exhausted windows as the conservative fallback.
  const exhaustedResets = provider.metrics
    .filter((metric) => isMetricExhausted(metric) && metric.resetAt)
    .map((metric) => metric.resetAt as string)
    .filter((value) => !Number.isNaN(new Date(value).getTime()))
    .sort((left, right) => Date.parse(right) - Date.parse(left));
  return exhaustedResets[0];
}

function isMetricExhausted(metric: ProviderCreditMetric): boolean {
  if (metric.remainingPercent !== 0) return false;
  if (!metric.resetAt) return true;
  const resetAt = Date.parse(metric.resetAt);
  return Number.isFinite(resetAt) && resetAt > Date.now();
}

function codexWindowLabel(metric: ProviderCreditMetric): string {
  const record = metric as unknown as UnknownRecord;
  const minutes = ["windowDurationMins", "windowMinutes", "durationMinutes"]
    .map((key) => record[key])
    .find((value): value is number => typeof value === "number" && value > 0);
  if (minutes === 300) return "5-hour window";
  if (minutes === 10_080) return "Weekly window";
  const normalized = metric.label.toLowerCase();
  if (/weekly|7\s*day|week/.test(normalized)) return "Weekly window";
  if (/5\s*hour|5\s*h|300\s*min/.test(normalized)) return "5-hour window";
  if (metric.id === "primary") return "5-hour window";
  if (metric.id === "secondary") return "Weekly window";
  return metric.label;
}

function formatRelativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "recently";
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1_000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}
