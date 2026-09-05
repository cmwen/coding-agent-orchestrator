import {
  type ChildProcessWithoutNullStreams,
  execFile as execFileCallback,
  spawn,
} from "node:child_process";
import { promisify } from "node:util";
import type {
  ProviderCreditMetric,
  ProviderCreditStatus,
  ProviderCreditsDashboard,
} from "@coding-agent-orchestrator/shared";
import {
  ORCHESTRATOR_CLI_PROVIDER_DEFINITIONS,
  type OrchestratorCliProviderDefinition,
} from "./cli-providers.js";
import {
  type CodexRateLimitSnapshot,
  type CodexRateLimitsResponse,
  type CodexRateLimitWindow,
  parseCodexRateLimits,
} from "./codex-quota.js";

const execFile = promisify(execFileCallback);
const CACHE_TTL_MS = 60_000;
const COMMAND_TIMEOUT_MS = 10_000;

type JsonObject = Record<string, unknown>;

interface CopilotQuotaSnapshot {
  isUnlimitedEntitlement?: boolean;
  entitlementRequests?: number;
  usedRequests?: number;
  remainingPercentage?: number;
  resetDate?: string;
  hasQuota?: boolean;
}

export class ProviderCreditsService {
  private cached?: { expiresAt: number; value: ProviderCreditsDashboard };
  private inFlight?: Promise<ProviderCreditsDashboard>;
  private codexRateLimitsCache?: {
    expiresAt: number;
    value?: CodexRateLimitSnapshot;
  };
  private codexRateLimitsInFlight?: Promise<CodexRateLimitSnapshot | undefined>;

  async getDashboard(forceRefresh = false): Promise<ProviderCreditsDashboard> {
    const now = Date.now();
    if (!forceRefresh && this.cached && this.cached.expiresAt > now) {
      return this.cached.value;
    }
    if (this.inFlight) {
      return this.inFlight;
    }

    this.inFlight = this.collectDashboard().finally(() => {
      this.inFlight = undefined;
    });
    const value = await this.inFlight;
    this.cached = { expiresAt: now + CACHE_TTL_MS, value };
    return value;
  }

  /** Read the raw included Codex windows for runtime scheduling decisions. */
  async getCodexRateLimits(
    forceRefresh = false
  ): Promise<CodexRateLimitSnapshot | undefined> {
    const now = Date.now();
    if (
      !forceRefresh &&
      this.codexRateLimitsCache &&
      this.codexRateLimitsCache.expiresAt > now
    ) {
      return this.codexRateLimitsCache.value;
    }
    if (this.codexRateLimitsInFlight) return this.codexRateLimitsInFlight;

    this.codexRateLimitsInFlight = requestCodexRateLimits()
      .then((result) => parseCodexRateLimits(result))
      .finally(() => {
        this.codexRateLimitsInFlight = undefined;
      });
    const value = await this.codexRateLimitsInFlight;
    this.codexRateLimitsCache = { expiresAt: now + CACHE_TTL_MS, value };
    return value;
  }

  private async collectDashboard(): Promise<ProviderCreditsDashboard> {
    const checkedAt = new Date().toISOString();
    const providers = await Promise.all(
      ORCHESTRATOR_CLI_PROVIDER_DEFINITIONS.map((definition) =>
        this.collectProvider(definition, checkedAt)
      )
    );
    return {
      checkedAt,
      cacheTtlSeconds: CACHE_TTL_MS / 1_000,
      providers,
    };
  }

  private async collectProvider(
    definition: OrchestratorCliProviderDefinition,
    checkedAt: string
  ): Promise<ProviderCreditStatus> {
    const installed = await commandExists([
      definition.command,
      ...(definition.commandAliases ?? []),
    ]);
    const base = {
      providerId: definition.descriptor.id,
      displayName: definition.descriptor.displayName,
      installed,
      checkedAt,
    };

    if (!installed) {
      return {
        ...base,
        status: "not-installed",
        source: "none",
        summary: `Install the ${definition.command} command to read usage on this machine.`,
        metrics: [],
      };
    }

    try {
      switch (definition.descriptor.id) {
        case "copilot":
          return { ...base, ...(await collectCopilotCredits()) };
        case "codex":
          return { ...base, ...(await collectCodexCredits()) };
        case "opencode":
          return { ...base, ...(await collectOpenCodeStats()) };
        case "gemini":
          return {
            ...base,
            status: "interactive",
            source: "provider-dashboard",
            summary:
              "Gemini CLI does not expose a documented headless balance command. Consumer Google sign-in has moved to Antigravity; Standard and Enterprise quotas remain in Google Cloud.",
            metrics: [],
            accountUrl:
              "https://developers.google.com/gemini-code-assist/resources/quotas",
            actionLabel: "View Gemini quotas",
          };
        case "antigravity":
          return {
            ...base,
            status: "interactive",
            source: "provider-dashboard",
            summary:
              "Run /usage (or /quota) inside Antigravity CLI for a freshly refreshed, per-model quota breakdown.",
            metrics: [],
            accountUrl: "https://antigravity.google/docs/cli/commands/usage",
            actionLabel: "How to check /usage",
          };
        case "grok":
          return {
            ...base,
            status: "interactive",
            source: "provider-dashboard",
            summary:
              "Grok Build shares a weekly SuperGrok pool with other Grok products. The CLI has no documented usage subcommand; open Settings → Usage for the live balance and reset time.",
            metrics: [],
            accountUrl: "https://grok.com/",
            actionLabel: "Open Grok usage",
          };
        default:
          return {
            ...base,
            status: "unavailable",
            source: "none",
            summary:
              "This provider does not expose a supported usage interface.",
            metrics: [],
          };
      }
    } catch {
      return providerErrorFallback(definition, checkedAt);
    }
  }
}

async function collectCopilotCredits(): Promise<
  Omit<
    ProviderCreditStatus,
    "providerId" | "displayName" | "installed" | "checkedAt"
  >
> {
  const response = await requestCopilotRpc("account.getQuota", {});
  const result = asObject(response.result);
  const snapshots = asObject(result?.quotaSnapshots);
  if (!snapshots || Object.keys(snapshots).length === 0) {
    throw new Error("Copilot returned no quota snapshots.");
  }

  const preferredOrder = ["chat", "completions", "premium_interactions"];
  const entries = Object.entries(snapshots).sort(
    ([left], [right]) =>
      providerMetricOrder(left, preferredOrder) -
      providerMetricOrder(right, preferredOrder)
  );
  const metrics = entries.map(([id, raw]) =>
    copilotSnapshotToMetric(id, raw as CopilotQuotaSnapshot)
  );

  return {
    status: "live",
    source: "live-cli",
    summary: "Live allowance reported by your signed-in Copilot account.",
    metrics,
    accountUrl: "https://github.com/settings/billing",
    actionLabel: "Open GitHub billing",
  };
}

async function collectCodexCredits(): Promise<
  Omit<
    ProviderCreditStatus,
    "providerId" | "displayName" | "installed" | "checkedAt"
  >
> {
  const result = await requestCodexRateLimits();
  const snapshot = parseCodexRateLimits(result as CodexRateLimitsResponse);
  if (!snapshot) {
    throw new Error("Codex returned no rate-limit snapshots.");
  }
  const metrics: ProviderCreditMetric[] = [];
  if (snapshot.primary) {
    metrics.push(codexWindowToMetric("primary", snapshot.primary));
  }
  if (snapshot.secondary) {
    metrics.push(codexWindowToMetric("secondary", snapshot.secondary));
  }
  if (snapshot.credits) {
    const balance = snapshot.credits.unlimited
      ? "Unlimited"
      : `${snapshot.credits.balance ?? "0"} credits`;
    metrics.push({
      id: "purchased-credits",
      label: "Purchased credits",
      value: balance,
      detail: "Separate from the included plan rate limit.",
    });
  }
  const resetCredits = asObject(result.rateLimitResetCredits);
  const availableResets = asFiniteNumber(resetCredits?.availableCount);
  if (availableResets && availableResets > 0) {
    metrics.push({
      id: "rate-limit-resets",
      label: "Full resets",
      value: `${availableResets} available`,
    });
  }

  return {
    status: "live",
    source: "live-cli",
    summary:
      "Live allowance and credits reported by your signed-in Codex account.",
    plan: snapshot.planType ? formatIdentifier(snapshot.planType) : undefined,
    metrics,
    accountUrl: "https://chatgpt.com/codex/settings/usage",
    actionLabel: "Open Codex usage",
  };
}

async function collectOpenCodeStats(): Promise<
  Omit<
    ProviderCreditStatus,
    "providerId" | "displayName" | "installed" | "checkedAt"
  >
> {
  const { stdout } = await execFile(
    "opencode",
    ["stats", "--days", "30", "--models", "5"],
    {
      encoding: "utf8",
      maxBuffer: 1_000_000,
      timeout: COMMAND_TIMEOUT_MS,
    }
  );
  const stats = parseOpenCodeStats(stdout);
  const metrics: ProviderCreditMetric[] = [
    {
      id: "cost-30d",
      label: "30-day local cost",
      value: stats.totalCost ?? "$0.00",
    },
    {
      id: "tokens-30d",
      label: "30-day tokens",
      value: formatNumber(stats.inputTokens + stats.outputTokens),
      detail: `${formatNumber(stats.inputTokens)} input · ${formatNumber(stats.outputTokens)} output`,
    },
    {
      id: "sessions-30d",
      label: "30-day sessions",
      value: formatNumber(stats.sessions),
    },
  ];
  return {
    status: "local",
    source: "local-cli",
    summary:
      "Local usage across OpenCode sessions. OpenCode can use many upstream providers, so it cannot report one universal subscription balance.",
    metrics,
    accountUrl: "https://console.opencode.ai/",
    actionLabel: "Open OpenCode Console",
  };
}

export function parseOpenCodeStats(output: string): {
  sessions: number;
  inputTokens: number;
  outputTokens: number;
  totalCost?: string;
} {
  // Avoid embedding the ESC control character in a regular-expression literal.
  // biome-ignore lint/complexity/useRegexLiterals: constructor keeps the source readable
  const ansiPattern = new RegExp("\\x1b\\[[0-?]*[ -/]*[@-~]", "g");
  const plain = output.replace(ansiPattern, "");
  const readNumber = (label: string): number => {
    const match = plain.match(
      new RegExp(`${label}\\s+([\\d,]+)\\s*(?:│|$)`, "m")
    );
    return match?.[1] ? Number(match[1].replaceAll(",", "")) : 0;
  };
  const costMatch = plain.match(/Total Cost\s+(\$[\d,.]+)\s*(?:│|$)/m);
  return {
    sessions: readNumber("Sessions"),
    inputTokens: readNumber("Input"),
    outputTokens: readNumber("Output"),
    totalCost: costMatch?.[1],
  };
}

function copilotSnapshotToMetric(
  id: string,
  snapshot: CopilotQuotaSnapshot
): ProviderCreditMetric {
  const entitlement = asFiniteNumber(snapshot.entitlementRequests) ?? 0;
  const used = asFiniteNumber(snapshot.usedRequests) ?? 0;
  const hasAllowance =
    snapshot.isUnlimitedEntitlement ||
    (snapshot.hasQuota !== false && entitlement > 0);
  const remainingPercent = hasAllowance
    ? clampPercent(snapshot.remainingPercentage ?? 0)
    : undefined;
  let value = "Not included";
  if (snapshot.isUnlimitedEntitlement) {
    value = "Unlimited";
  } else if (snapshot.hasQuota !== false && entitlement > 0) {
    value = `${formatNumber(Math.max(0, entitlement - used))} / ${formatNumber(entitlement)} left`;
  }
  return {
    id,
    label: formatIdentifier(id),
    value,
    remainingPercent,
    usedPercent:
      remainingPercent === undefined
        ? undefined
        : clampPercent(100 - remainingPercent),
    resetAt: toIsoDate(snapshot.resetDate),
  };
}

function codexWindowToMetric(
  id: string,
  window: CodexRateLimitWindow
): ProviderCreditMetric {
  const usedPercent = clampPercent(window.usedPercent ?? 0);
  const remainingPercent = clampPercent(100 - usedPercent);
  const duration = window.windowDurationMins;
  return {
    id,
    label: duration ? formatWindowDuration(duration) : formatIdentifier(id),
    value: `${formatNumber(remainingPercent)}% remaining`,
    usedPercent,
    remainingPercent,
    resetAt: window.resetsAt
      ? new Date(window.resetsAt * 1_000).toISOString()
      : undefined,
  };
}

function requestCopilotRpc(
  method: string,
  params: JsonObject
): Promise<JsonObject> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "copilot",
      ["--server", "--stdio", "--no-auto-update", "--log-level", "none"],
      { stdio: ["pipe", "pipe", "pipe"] }
    );
    let buffer = Buffer.alloc(0);
    child.stderr.resume();
    const timer = createProcessTimeout(child, reject, "Copilot quota request");

    child.once("error", (error) => finishWithError(error));
    child.stdout.on("data", (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk]);
      const separator = buffer.indexOf("\r\n\r\n");
      if (separator < 0) return;
      const header = buffer.subarray(0, separator).toString("utf8");
      const length = Number(/Content-Length:\s*(\d+)/i.exec(header)?.[1]);
      if (!Number.isFinite(length) || buffer.length < separator + 4 + length) {
        return;
      }
      try {
        const response = JSON.parse(
          buffer
            .subarray(separator + 4, separator + 4 + length)
            .toString("utf8")
        ) as JsonObject;
        if (response.error) {
          finishWithError(new Error("Copilot quota request failed."));
          return;
        }
        clearTimeout(timer);
        child.kill();
        resolve(response);
      } catch (error) {
        finishWithError(error);
      }
    });

    const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
    child.stdin.write(
      `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`
    );

    function finishWithError(error: unknown) {
      clearTimeout(timer);
      child.kill();
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

function requestCodexRateLimits(): Promise<JsonObject> {
  return new Promise((resolve, reject) => {
    const child = spawn("codex", ["app-server"], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let buffer = "";
    child.stderr.resume();
    const timer = createProcessTimeout(child, reject, "Codex quota request");

    child.once("error", (error) => finishWithError(error));
    child.stdout.on("data", (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line) {
          try {
            const message = JSON.parse(line) as JsonObject;
            if (message.id === 0) {
              writeJsonLine(child, { method: "initialized", params: {} });
              writeJsonLine(child, {
                method: "account/rateLimits/read",
                id: 1,
                params: null,
              });
            } else if (message.id === 1) {
              if (message.error) {
                finishWithError(new Error("Codex quota request failed."));
                return;
              }
              clearTimeout(timer);
              child.kill();
              resolve(asObject(message.result) ?? {});
              return;
            }
          } catch (error) {
            finishWithError(error);
            return;
          }
        }
        newline = buffer.indexOf("\n");
      }
    });

    writeJsonLine(child, {
      method: "initialize",
      id: 0,
      params: {
        clientInfo: {
          name: "coding-agent-orchestrator",
          title: "Coding Agent Orchestrator",
          version: "0.1.0",
        },
      },
    });

    function finishWithError(error: unknown) {
      clearTimeout(timer);
      child.kill();
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

function writeJsonLine(child: ChildProcessWithoutNullStreams, value: unknown) {
  child.stdin.write(`${JSON.stringify(value)}\n`);
}

function createProcessTimeout(
  child: ChildProcessWithoutNullStreams,
  reject: (error: Error) => void,
  label: string
): NodeJS.Timeout {
  return setTimeout(() => {
    child.kill();
    reject(new Error(`${label} timed out.`));
  }, COMMAND_TIMEOUT_MS);
}

async function commandExists(commands: readonly string[]): Promise<boolean> {
  for (const command of commands) {
    try {
      await execFile("which", [command], { encoding: "utf8", timeout: 2_000 });
      return true;
    } catch {}
  }
  return false;
}

function providerErrorFallback(
  definition: OrchestratorCliProviderDefinition,
  checkedAt: string
): ProviderCreditStatus {
  const providerId = definition.descriptor.id;
  const links: Record<string, { url: string; label: string }> = {
    copilot: {
      url: "https://github.com/settings/billing",
      label: "Open GitHub billing",
    },
    codex: {
      url: "https://chatgpt.com/codex/settings/usage",
      label: "Open Codex usage",
    },
    opencode: {
      url: "https://console.opencode.ai/",
      label: "Open OpenCode Console",
    },
  };
  const link = links[providerId];
  return {
    providerId,
    displayName: definition.descriptor.displayName,
    installed: true,
    status: "error",
    source: link ? "provider-dashboard" : "none",
    summary:
      providerId === "opencode"
        ? "Local OpenCode stats could not be read. Its database may be busy; refresh after active OpenCode processes finish."
        : `The ${definition.descriptor.displayName} usage interface did not respond. Your coding sessions are unaffected.`,
    metrics: [],
    accountUrl: link?.url,
    actionLabel: link?.label,
    checkedAt,
  };
}

function asObject(value: unknown): JsonObject | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value * 10) / 10));
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
    value
  );
}

function formatIdentifier(value: string): string {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatWindowDuration(minutes: number): string {
  if (minutes % 10_080 === 0) return `${minutes / 10_080}-week limit`;
  if (minutes % 1_440 === 0) return `${minutes / 1_440}-day limit`;
  if (minutes % 60 === 0) return `${minutes / 60}-hour limit`;
  return `${minutes}-minute limit`;
}

function toIsoDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function providerMetricOrder(id: string, preferred: readonly string[]): number {
  const index = preferred.indexOf(id);
  return index < 0 ? preferred.length : index;
}
