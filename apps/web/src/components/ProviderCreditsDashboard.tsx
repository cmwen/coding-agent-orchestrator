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
  return (
    <article
      className={`provider-credit-card provider-credit-card-${provider.status}`}
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

function ProviderCreditMetricRow(props: { metric: ProviderCreditMetric }) {
  const { metric } = props;
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
        <span>{metric.label}</span>
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
          {metric.resetAt ? `Resets ${formatResetTime(metric.resetAt)}` : null}
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
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatRelativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "recently";
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1_000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}
