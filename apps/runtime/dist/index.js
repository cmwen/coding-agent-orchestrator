// src/index.ts
import { promises as fs2 } from "fs";
import path2 from "path";
import { fileURLToPath } from "url";
import {
  orchestratorDelegateRequestSchema,
  orchestratorScheduleCreateSchema,
  orchestratorScheduleUpdateSchema,
  orchestratorSessionCreateSchema,
  orchestratorSessionUpdateSchema,
  orchestratorTerminalHistoryChunkSchema,
  orchestratorTerminalInputSchema,
  orchestratorWorkingTreeDiffSchema as orchestratorWorkingTreeDiffSchema2,
  orchestratorWorkingTreeSchema as orchestratorWorkingTreeSchema2
} from "@coding-agent-orchestrator/shared";
import {
  resolveWorkspace,
  summarizeWorkspace
} from "@coding-agent-orchestrator/store";
import { serve } from "@hono/node-server";
import { RESPONSE_ALREADY_SENT } from "@hono/node-server/utils/response";
import { Hono } from "hono";

// src/env.ts
var DEFAULT_RUNTIME_PORT = 8791;
var DEFAULT_ORCHESTRATOR_TMUX_SESSION_NAME = "coding-agent-orchestrator-orchestrator";
function readRuntimePort(env = process.env) {
  return Number(env.CODING_AGENT_ORCHESTRATOR_PORT ?? DEFAULT_RUNTIME_PORT);
}
function readOrchestratorTmuxSessionName(env = process.env) {
  return env.CODING_AGENT_ORCHESTRATOR_ORCHESTRATOR_TMUX_SESSION ?? DEFAULT_ORCHESTRATOR_TMUX_SESSION_NAME;
}
function readRuntimeSmtpEnv(env = process.env) {
  const from = env.CODING_AGENT_ORCHESTRATOR_SMTP_FROM;
  return {
    host: readTrimmedEnvValue(env.CODING_AGENT_ORCHESTRATOR_SMTP_HOST),
    port: readTrimmedEnvValue(env.CODING_AGENT_ORCHESTRATOR_SMTP_PORT),
    secure: env.CODING_AGENT_ORCHESTRATOR_SMTP_SECURE === "true",
    user: readTrimmedEnvValue(env.CODING_AGENT_ORCHESTRATOR_SMTP_USER),
    pass: env.CODING_AGENT_ORCHESTRATOR_SMTP_PASS,
    from,
    normalizedFrom: readTrimmedEnvValue(from),
    replyTo: env.CODING_AGENT_ORCHESTRATOR_SMTP_REPLY_TO
  };
}
function isRuntimeSmtpConfigured(env = process.env) {
  const smtp = readRuntimeSmtpEnv(env);
  return [smtp.host, smtp.port, smtp.normalizedFrom].every(
    (value) => typeof value === "string" && value.length > 0
  );
}
function readTrimmedEnvValue(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : void 0;
}

// src/http-errors.ts
function getHttpErrorStatus(error) {
  if (isZodLikeError(error) || error instanceof SyntaxError) {
    return 400;
  }
  const message = getErrorMessage(error).toLowerCase();
  if (isMissingResourceError(message)) {
    return 404;
  }
  return 500;
}
function getHttpErrorMessage(error) {
  if (isZodLikeError(error)) {
    return error.issues[0]?.message ?? "Request validation failed.";
  }
  return getErrorMessage(error);
}
function isZodLikeError(error) {
  return typeof error === "object" && error !== null && Array.isArray(error.issues) && (error.name === "ZodError" || error.issues.every(
    (issue) => typeof issue === "object" && issue !== null
  ));
}
function getErrorMessage(error) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Internal server error.";
}
function isMissingResourceError(message) {
  return message.includes("not found") || message.includes("missing session") || message.includes("missing task") || message.includes("missing schedule") || message.includes("missing agent") || message.includes("missing resource");
}

// src/orchestrator.ts
import { execFile as execFileCallback } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";
import {
  DEFAULT_CHAT_MODEL,
  DEFAULT_CHAT_PROVIDER,
  DEFAULT_ORCHESTRATOR_CLI_PROVIDER,
  orchestratorCapabilitiesSchema,
  orchestratorWorkingTreeDiffSchema,
  orchestratorWorkingTreeSchema
} from "@coding-agent-orchestrator/shared";
import {
  accumulatePremiumUsageTotals,
  buildOrchestratorWindowName,
  createOrchestratorJob,
  createOrchestratorSchedule,
  createOrchestratorSession,
  deleteOrchestratorJob,
  deleteOrchestratorSchedule,
  deleteOrchestratorSession,
  discoverCopilotCustomAgents,
  getDefaultOrchestratorCustomAgentId,
  getOrchestratorSchedule,
  getOrchestratorSession,
  getOrchestratorTerminalSize,
  listOrchestratorSchedules,
  listOrchestratorSessions,
  ORCHESTRATOR_AGENT_ID,
  ORCHESTRATOR_TERMINAL_LINE_LIMIT,
  orchestratorHistoryRoot,
  pathExists,
  readOrchestratorTerminalChunk,
  readOrchestratorTerminalHistoryChunk,
  resetOrchestratorTerminalLog,
  toOrchestratorChatSummary,
  updateOrchestratorJob,
  updateOrchestratorSchedule,
  updateOrchestratorSession,
  writeOrchestratorJobCompletion
} from "@coding-agent-orchestrator/store";
var execFile = promisify(execFileCallback);
var DEFAULT_TMUX_SESSION_NAME = readOrchestratorTmuxSessionName();
var DIRECT_PROMPT_LIMIT = 800;
var DIRECT_PROMPT_LINE_LIMIT = 12;
var CANCELLED_JOB_EXIT_CODE = -1;
var ORCHESTRATOR_PROMPT_FILENAME = "prompt.txt";
var ORCHESTRATOR_SCRIPT_FILENAME = "run.sh";
var DEFAULT_COPILOT_RATE_LIMIT_WAIT_SECONDS = 60;
var COPILOT_RATE_LIMIT_BUFFER_SECONDS = 5;
var MAX_COPILOT_RATE_LIMIT_RETRIES = 5;
var AUTO_RECOVERED_TMUX_NOTICE = "A new tmux session was created because the previous tmux session no longer existed.";
var COPILOT_RATE_LIMIT_SIGNAL_PATTERN = /\b429\b|too many requests|rate limit|usage limit|session limit|weekly limit|retry-after|x-ratelimit-reset|available again|try again/i;
var COPILOT_RATE_LIMIT_RETRY_AFTER_PATTERN = /retry-after[^0-9]{0,20}(\d{1,10})/gi;
var COPILOT_RATE_LIMIT_RESET_EPOCH_PATTERN = /x-ratelimit-reset[^0-9]{0,20}(\d{10,})/gi;
var COPILOT_RATE_LIMIT_RESET_ISO_PATTERN = /(?:available again at|try again at|reset(?:s| time)? at|retry at)[^\d]{0,20}(\d{4}-\d{2}-\d{2}t\d{2}:\d{2}(?::\d{2})?z)/gi;
var COPILOT_RATE_LIMIT_RELATIVE_WINDOW_PATTERN = /(?:wait|retry|available again|try again|reset(?:s)?)[^\n]{0,120}?\b(?:in|after)\s+([^\n]+)/gi;
var COPILOT_RATE_LIMIT_DURATION_PART_PATTERN = /(\d+)\s*(days?|d|hours?|hrs?|hr|h|minutes?|mins?|min|m|seconds?|secs?|sec|s)\b/gi;
var COPILOT_SESSION_ID_PATTERNS = [
  /(?:started|resuming)\s+(?:github\s+)?copilot(?:\s+cli)?\s+session\s*:\s*([^\r\n]+)/gi,
  /(?:^|\b)session(?:\s+started)?\.?\s*(?:session\s+)?id\s*:\s*([^\r\n]+)/gim,
  /\/sessions\/([A-Za-z0-9][A-Za-z0-9._:-]*)\b/gi
];
var COPILOT_CLI_PROVIDER = {
  id: "copilot",
  displayName: "GitHub Copilot CLI",
  description: "Runs delegated jobs through the GitHub Copilot CLI inside the tmux workspace.",
  capabilities: {
    supportsCustomAgents: true,
    supportsExecutionMode: true
  }
};
var GEMINI_CLI_PROVIDER = {
  id: "gemini",
  displayName: "Gemini CLI",
  description: "Runs delegated jobs through the Gemini CLI inside the tmux workspace.",
  capabilities: {
    supportsCustomAgents: false,
    supportsExecutionMode: false
  }
};
var CODEX_CLI_PROVIDER = {
  id: "codex",
  displayName: "OpenAI Codex CLI",
  description: "Runs delegated jobs through the OpenAI Codex CLI inside the tmux workspace.",
  capabilities: {
    supportsCustomAgents: false,
    supportsExecutionMode: false
  }
};
var OPENCODE_CLI_PROVIDER = {
  id: "opencode",
  displayName: "OpenCode CLI",
  description: "Runs delegated jobs through the OpenCode CLI inside the tmux workspace.",
  capabilities: {
    supportsCustomAgents: false,
    supportsExecutionMode: false
  }
};
var ORCHESTRATOR_CLI_PROVIDERS = [
  COPILOT_CLI_PROVIDER,
  GEMINI_CLI_PROVIDER,
  CODEX_CLI_PROVIDER,
  OPENCODE_CLI_PROVIDER
];
function normalizeProviderSessionId(value) {
  const normalized = value?.trim();
  return normalized ? normalized : void 0;
}
function supportsProviderSessionResume(cliProvider) {
  return cliProvider === COPILOT_CLI_PROVIDER.id || cliProvider === GEMINI_CLI_PROVIDER.id || cliProvider === CODEX_CLI_PROVIDER.id || cliProvider === OPENCODE_CLI_PROVIDER.id;
}
function supportsProviderSessionBootstrap(cliProvider) {
  return cliProvider === COPILOT_CLI_PROVIDER.id;
}
function defaultJobProviderSessionId(cliProvider, jobId) {
  return supportsProviderSessionBootstrap(cliProvider) ? `job-${jobId}` : void 0;
}
function resolveUpdatedProviderSessionId(input) {
  if (input.requestedProviderSessionId !== void 0) {
    return normalizeProviderSessionId(input.requestedProviderSessionId);
  }
  if (input.cliProvider === input.currentCliProvider) {
    return input.currentProviderSessionId;
  }
  return void 0;
}
function resolveQueuedJobProviderSession(input) {
  const requestedProviderSessionId = normalizeProviderSessionId(
    input.requestedProviderSessionId
  );
  if (requestedProviderSessionId) {
    return {
      providerSessionId: requestedProviderSessionId,
      resumeProviderSession: true
    };
  }
  const sessionProviderSessionId = normalizeProviderSessionId(
    input.sessionProviderSessionId
  );
  if (sessionProviderSessionId) {
    return {
      providerSessionId: sessionProviderSessionId,
      resumeProviderSession: true
    };
  }
  return {
    providerSessionId: defaultJobProviderSessionId(
      input.cliProvider,
      input.jobId
    ),
    resumeProviderSession: false
  };
}
var TmuxOrchestratorService = class {
  constructor(workspace2, defaultProjectPath2, tmuxSessionName = DEFAULT_TMUX_SESSION_NAME, resolveModelDescriptor) {
    this.workspace = workspace2;
    this.defaultProjectPath = defaultProjectPath2;
    this.tmuxSessionName = tmuxSessionName;
    this.resolveModelDescriptor = resolveModelDescriptor;
  }
  workspace;
  defaultProjectPath;
  tmuxSessionName;
  resolveModelDescriptor;
  async getCapabilities() {
    const smtp = readRuntimeSmtpEnv();
    const [
      tmuxInstalled,
      copilotInstalled,
      geminiInstalled,
      codexInstalled,
      opencodeInstalled,
      sessions
    ] = await Promise.all([
      this.commandExists("tmux"),
      this.commandExists("copilot"),
      this.commandExists("gemini"),
      this.commandExists("codex"),
      this.commandExists("opencode"),
      listOrchestratorSessions(this.workspace)
    ]);
    const recentProjectPaths = [
      ...new Set(sessions.map((session) => session.projectPath))
    ].filter((projectPath) => projectPath !== this.defaultProjectPath).slice(0, 8);
    const cliProviders = ORCHESTRATOR_CLI_PROVIDERS.filter((provider) => {
      if (provider.id === "copilot") return copilotInstalled;
      if (provider.id === "gemini") return geminiInstalled;
      if (provider.id === "codex") return codexInstalled;
      if (provider.id === "opencode") return opencodeInstalled;
      return false;
    });
    return orchestratorCapabilitiesSchema.parse({
      available: tmuxInstalled && cliProviders.length > 0,
      defaultProjectPath: this.defaultProjectPath,
      recentProjectPaths,
      tmuxInstalled,
      copilotInstalled,
      geminiInstalled,
      codexInstalled,
      opencodeInstalled,
      defaultCliProvider: cliProviders[0]?.id ?? DEFAULT_ORCHESTRATOR_CLI_PROVIDER,
      cliProviders,
      tmuxSessionName: this.tmuxSessionName,
      emailDeliveryAvailable: this.isEmailDeliveryConfigured(),
      emailFromAddress: smtp.from
    });
  }
  async getAgentSummary() {
    const historyRoot = orchestratorHistoryRoot(this.workspace);
    const sessionCount = (await listOrchestratorSessions(this.workspace)).length;
    return {
      id: ORCHESTRATOR_AGENT_ID,
      kind: "orchestrator",
      title: "CLI Orchestrator",
      description: "Maximizes project context, then delegates implementation work to Copilot or Gemini CLI sessions inside tmux windows.",
      combinedPrompt: "You are the built-in Copilot orchestrator agent. Maximize the available project context, keep delegated session state current, and route implementation work through specialized Copilot custom agents instead of doing everything in one generic run.",
      agentPath: path.join(this.workspace.agentsRoot, ORCHESTRATOR_AGENT_ID),
      defaultSoulPath: path.join(
        this.workspace.agentsRoot,
        "default",
        "SOUL.md"
      ),
      historyRoot,
      workingMemoryRoot: path.join(
        this.workspace.agentsRoot,
        ORCHESTRATOR_AGENT_ID,
        "memory",
        "working"
      ),
      skillRoot: path.join(
        this.workspace.agentsRoot,
        ORCHESTRATOR_AGENT_ID,
        "skills"
      ),
      skillNames: [],
      sessionCount
    };
  }
  async listChatSummaries() {
    const sessions = await listOrchestratorSessions(this.workspace);
    return sessions.map((session) => toOrchestratorChatSummary(session));
  }
  async listSessions() {
    const sessions = await listOrchestratorSessions(this.workspace);
    return Promise.all(
      sessions.map((session) => this.getSession(session.sessionId))
    );
  }
  async getSession(sessionId) {
    const session = await getOrchestratorSession(this.workspace, sessionId);
    const reconciled = await this.reconcileSession(session);
    return getOrchestratorSession(this.workspace, reconciled.sessionId);
  }
  async getSessionChanges(sessionId) {
    const session = await getOrchestratorSession(this.workspace, sessionId);
    return this.readWorkingTree(session.projectPath);
  }
  async getSessionChangeDiff(sessionId, filePath) {
    const session = await getOrchestratorSession(this.workspace, sessionId);
    return this.readWorkingTreeDiff(session.projectPath, filePath);
  }
  async createSession(request) {
    const cliProvider = this.normalizeCliProvider(request.cliProvider);
    await this.assertCapabilities(cliProvider);
    const projectPath = path.resolve(request.projectPath);
    const model = request.model.trim() || DEFAULT_CHAT_MODEL;
    await this.assertProjectPath(projectPath);
    const availableCustomAgents = cliProvider === COPILOT_CLI_PROVIDER.id ? await discoverCopilotCustomAgents(projectPath) : [];
    const defaultCustomAgentId = getDefaultOrchestratorCustomAgentId(
      availableCustomAgents
    );
    const selectedCustomAgentId = cliProvider === COPILOT_CLI_PROVIDER.id ? this.resolveSelectedCustomAgentId(
      {
        availableCustomAgents,
        selectedCustomAgentId: defaultCustomAgentId
      },
      request.selectedCustomAgentId
    ) : void 0;
    const executionMode = cliProvider === COPILOT_CLI_PROVIDER.id ? request.executionMode ?? "standard" : "standard";
    const title = request.title?.trim() || request.projectPurpose.trim() || path.basename(projectPath) || "Orchestrator session";
    const startedAt = (/* @__PURE__ */ new Date()).toISOString();
    const sessionId = `${startedAt.slice(0, 10)}-${slugify(title)}`;
    const providerSessionId = normalizeProviderSessionId(
      request.providerSessionId
    );
    const tmuxWindowName = buildOrchestratorWindowName(
      title,
      projectPath,
      sessionId
    );
    const paneId = await this.createWindow({
      projectPath,
      tmuxWindowName,
      startedAt,
      title,
      sessionId
    });
    await createOrchestratorSession(this.workspace, {
      title,
      sessionId,
      startedAt,
      projectPath,
      projectPurpose: request.projectPurpose,
      cliProvider,
      model,
      availableCustomAgents,
      selectedCustomAgentId,
      providerSessionId,
      executionMode,
      tmuxSessionName: this.tmuxSessionName,
      tmuxWindowName,
      tmuxPaneId: paneId,
      status: "idle"
    });
    if (request.prompt) {
      await this.delegate(sessionId, request.prompt);
    }
    return this.getSession(sessionId);
  }
  async updateSession(sessionId, request) {
    const session = await this.getSession(sessionId);
    const title = request.title;
    const cliProvider = this.normalizeCliProvider(request.cliProvider);
    const model = request.model;
    await this.assertCapabilities(cliProvider);
    const availableCustomAgents = cliProvider === COPILOT_CLI_PROVIDER.id ? session.availableCustomAgents : [];
    const selectedCustomAgentId = cliProvider === COPILOT_CLI_PROVIDER.id ? this.resolveSelectedCustomAgentId(
      session,
      request.selectedCustomAgentId
    ) : void 0;
    const providerSessionId = resolveUpdatedProviderSessionId({
      cliProvider,
      currentCliProvider: session.cliProvider,
      currentProviderSessionId: session.providerSessionId,
      requestedProviderSessionId: request.providerSessionId
    });
    const executionMode = cliProvider === COPILOT_CLI_PROVIDER.id ? request.executionMode ?? session.executionMode ?? "standard" : "standard";
    const tmuxWindowName = buildOrchestratorWindowName(
      title,
      session.projectPath,
      session.sessionId
    );
    const hasChanges = title !== session.title || cliProvider !== (session.cliProvider ?? DEFAULT_ORCHESTRATOR_CLI_PROVIDER) || model !== session.model || selectedCustomAgentId !== session.selectedCustomAgentId || providerSessionId !== session.providerSessionId || executionMode !== (session.executionMode ?? "standard") || tmuxWindowName !== session.tmuxWindowName;
    if (!hasChanges) {
      return session;
    }
    if (tmuxWindowName !== session.tmuxWindowName && await this.commandExists("tmux") && await this.tmuxPaneExists(session.tmuxPaneId)) {
      const windowId = await this.readTmuxValue(
        session.tmuxPaneId,
        "#{window_id}"
      );
      await this.runTmux(["rename-window", "-t", windowId, tmuxWindowName]);
    }
    await updateOrchestratorSession(this.workspace, sessionId, {
      title,
      cliProvider,
      model,
      availableCustomAgents,
      selectedCustomAgentId,
      providerSessionId,
      executionMode,
      tmuxWindowName
    });
    return this.getSession(sessionId);
  }
  async listSchedules(sessionId) {
    return listOrchestratorSchedules(this.workspace, { sessionId });
  }
  async getSchedule(scheduleId) {
    return getOrchestratorSchedule(this.workspace, scheduleId);
  }
  async createSchedule(request, nextRunAt) {
    const session = await this.getSession(request.sessionId);
    if (request.emailTo && !this.isEmailDeliveryConfigured()) {
      throw new Error(
        "Email delivery is not configured for this runtime. Set the CODING_AGENT_ORCHESTRATOR_SMTP_* environment variables first."
      );
    }
    const customAgentId = this.resolveSelectedCustomAgentId(
      session,
      request.customAgentId
    );
    return createOrchestratorSchedule(this.workspace, {
      sessionId: request.sessionId,
      title: request.title,
      prompt: request.prompt,
      frequency: request.frequency,
      timeOfDay: request.timeOfDay,
      timezone: request.timezone,
      dayOfWeek: request.dayOfWeek,
      dayOfMonth: request.dayOfMonth,
      customAgentId,
      emailTo: request.emailTo?.trim() || void 0,
      enabled: request.enabled,
      nextRunAt
    });
  }
  async updateSchedule(scheduleId, request, nextRunAt) {
    const schedule = await this.getSchedule(scheduleId);
    const session = await this.getSession(schedule.sessionId);
    if (request.emailTo && !this.isEmailDeliveryConfigured()) {
      throw new Error(
        "Email delivery is not configured for this runtime. Set the CODING_AGENT_ORCHESTRATOR_SMTP_* environment variables first."
      );
    }
    const customAgentId = this.resolveSelectedCustomAgentId(
      session,
      request.customAgentId
    );
    return updateOrchestratorSchedule(this.workspace, scheduleId, {
      title: request.title.trim(),
      prompt: request.prompt.trim(),
      frequency: request.frequency,
      timeOfDay: request.timeOfDay,
      timezone: request.timezone.trim(),
      dayOfWeek: request.dayOfWeek,
      dayOfMonth: request.dayOfMonth,
      customAgentId,
      emailTo: request.emailTo?.trim() || void 0,
      enabled: request.enabled,
      nextRunAt
    });
  }
  async deleteSchedule(scheduleId) {
    await deleteOrchestratorSchedule(this.workspace, scheduleId);
  }
  async triggerSchedule(schedule) {
    const session = await this.getSession(schedule.sessionId);
    const { job } = await this.queueDelegation(session, schedule.prompt, {
      customAgentId: schedule.customAgentId,
      scheduleId: schedule.scheduleId
    });
    return job;
  }
  async delegate(sessionId, request) {
    const session = await this.getSession(sessionId);
    await this.assertCapabilities(
      session.cliProvider ?? DEFAULT_ORCHESTRATOR_CLI_PROVIDER
    );
    const delegatedPrompt = typeof request === "string" ? request : request.prompt;
    const attachment = typeof request === "string" ? void 0 : request.attachment;
    const providerSessionId = typeof request === "string" ? void 0 : request.providerSessionId;
    if (!delegatedPrompt.trim() && !attachment) {
      throw new Error(
        "Provide a prompt or attach a file before delegating work."
      );
    }
    const customAgentId = this.resolveSelectedCustomAgentId(
      session,
      typeof request === "string" ? void 0 : request.customAgentId
    );
    const { systemNotice } = await this.queueDelegation(
      session,
      delegatedPrompt,
      {
        attachment,
        customAgentId,
        providerSessionId
      }
    );
    return this.loadSession(sessionId, systemNotice);
  }
  async retryJob(sessionId, jobId) {
    const session = await this.getSession(sessionId);
    await this.assertCapabilities(
      session.cliProvider ?? DEFAULT_ORCHESTRATOR_CLI_PROVIDER
    );
    const job = session.jobs.find((candidate) => candidate.jobId === jobId);
    if (!job) {
      throw new Error(`Orchestrator session ${sessionId} has no job ${jobId}.`);
    }
    if (job.status !== "failed") {
      throw new Error(
        `Only failed jobs can be retried. Received ${job.status}.`
      );
    }
    const prompt = await this.resolveRetryPrompt(job);
    const attachment = await this.readRetryAttachment(job.attachment);
    if (!prompt.trim() && !attachment) {
      throw new Error(
        `Orchestrator job ${jobId} does not have enough persisted input to retry.`
      );
    }
    const customAgentId = this.resolveSelectedCustomAgentId(
      session,
      job.customAgentId
    );
    const { systemNotice } = await this.queueDelegation(session, prompt, {
      attachment,
      customAgentId,
      providerSessionId: job.providerSessionId
    });
    return this.loadSession(sessionId, systemNotice);
  }
  async sendInput(sessionId, input, submit = true) {
    const session = await this.getSession(sessionId);
    if (input.length > 0) {
      await this.runTmux([
        "send-keys",
        "-t",
        session.tmuxPaneId,
        "-l",
        "--",
        input
      ]);
    }
    if (submit) {
      await this.runTmux(["send-keys", "-t", session.tmuxPaneId, "Enter"]);
    }
    return this.getSession(sessionId);
  }
  async cancelJob(sessionId) {
    const session = await this.getSession(sessionId);
    if (session.status !== "running" || !session.activeJobId) {
      throw new Error(`Orchestrator session ${sessionId} has no running job.`);
    }
    const runningJob = session.jobs.find((job) => job.jobId === session.activeJobId) ?? session.jobs.find((job) => job.status === "running");
    if (!runningJob) {
      throw new Error(
        `Orchestrator session ${sessionId} has no persisted running job.`
      );
    }
    const completedAt = (/* @__PURE__ */ new Date()).toISOString();
    await this.killWindowForPane(session.tmuxPaneId);
    try {
      const nextPaneId = await this.createWindow({
        projectPath: session.projectPath,
        tmuxWindowName: session.tmuxWindowName,
        startedAt: session.startedAt,
        title: session.title,
        sessionId: session.sessionId
      });
      await this.finalizeCancelledJob(
        session.sessionId,
        runningJob.jobId,
        completedAt,
        {
          tmuxPaneId: nextPaneId,
          status: "failed"
        }
      );
    } catch (error) {
      await this.finalizeCancelledJob(
        session.sessionId,
        runningJob.jobId,
        completedAt,
        {
          status: "missing"
        }
      );
      throw error;
    }
    return this.getSession(sessionId);
  }
  async deleteSession(sessionId) {
    const session = await this.getSession(sessionId);
    await this.killWindowForPane(session.tmuxPaneId);
    await deleteOrchestratorSession(this.workspace, sessionId);
  }
  async restartSession(sessionId) {
    const session = await getOrchestratorSession(this.workspace, sessionId);
    await this.assertCapabilities(
      session.cliProvider ?? DEFAULT_ORCHESTRATOR_CLI_PROVIDER
    );
    const runningJob = session.jobs.find((job) => job.jobId === session.activeJobId) ?? session.jobs.find((job) => job.status === "running");
    const completedAt = runningJob ? (/* @__PURE__ */ new Date()).toISOString() : void 0;
    await this.killWindowForPane(session.tmuxPaneId);
    await resetOrchestratorTerminalLog(this.workspace, sessionId);
    try {
      const nextPaneId = await this.createWindow({
        projectPath: session.projectPath,
        tmuxWindowName: session.tmuxWindowName,
        startedAt: session.startedAt,
        title: session.title,
        sessionId: session.sessionId
      });
      if (runningJob && completedAt) {
        await this.finalizeCancelledJob(
          session.sessionId,
          runningJob.jobId,
          completedAt,
          {
            tmuxPaneId: nextPaneId,
            status: "failed"
          }
        );
      } else {
        await updateOrchestratorSession(this.workspace, session.sessionId, {
          tmuxPaneId: nextPaneId,
          activeJobId: void 0,
          status: "idle"
        });
      }
    } catch (error) {
      if (runningJob && completedAt) {
        await this.finalizeCancelledJob(
          session.sessionId,
          runningJob.jobId,
          completedAt,
          {
            status: "missing"
          }
        );
      } else {
        await updateOrchestratorSession(this.workspace, session.sessionId, {
          activeJobId: void 0,
          status: "missing"
        });
      }
      throw error;
    }
    return this.getSession(sessionId);
  }
  async deleteQueuedJob(sessionId, jobId) {
    const session = await this.getSession(sessionId);
    const job = session.jobs.find((item) => item.jobId === jobId);
    if (!job) {
      throw new Error(`Orchestrator session ${sessionId} has no job ${jobId}.`);
    }
    if (job.status !== "queued") {
      throw new Error(
        `Only queued jobs can be deleted. Received ${job.status}.`
      );
    }
    await deleteOrchestratorJob(this.workspace, sessionId, jobId);
    return this.getSession(sessionId);
  }
  async readTerminalChunk(sessionId, offset) {
    return readOrchestratorTerminalChunk(this.workspace, sessionId, offset);
  }
  async readTerminalHistoryChunk(sessionId, beforeOffset, maxLines = ORCHESTRATOR_TERMINAL_LINE_LIMIT) {
    return readOrchestratorTerminalHistoryChunk(
      this.workspace,
      sessionId,
      beforeOffset,
      maxLines
    );
  }
  async getTerminalSize(sessionId) {
    return getOrchestratorTerminalSize(this.workspace, sessionId);
  }
  async createWindow(input) {
    const historyRoot = path.join(
      orchestratorHistoryRoot(this.workspace),
      input.startedAt.slice(0, 7),
      input.sessionId
    );
    await fs.mkdir(path.join(historyRoot, "terminal"), { recursive: true });
    await this.ensureTmuxSession();
    await this.runTmux([
      "new-window",
      "-d",
      "-t",
      this.tmuxSessionName,
      "-n",
      input.tmuxWindowName,
      "-c",
      input.projectPath
    ]);
    const paneId = await this.readTmuxValue(
      `${this.tmuxSessionName}:${input.tmuxWindowName}`,
      "#{pane_id}"
    );
    const logPath = path.join(historyRoot, "terminal", "pane.log");
    await this.runTmux([
      "pipe-pane",
      "-o",
      "-t",
      paneId,
      `cat >> ${shellQuote(logPath)}`
    ]);
    await this.runTmux([
      "send-keys",
      "-t",
      paneId,
      `printf ${shellQuote(`[coding-agent-orchestrator] Ready for ${input.title}\\n`)}`,
      "Enter"
    ]);
    return paneId;
  }
  async ensureTmuxSession() {
    if (await this.tmuxSessionExists()) {
      return;
    }
    await this.runTmux([
      "new-session",
      "-d",
      "-s",
      this.tmuxSessionName,
      "-n",
      "orchestrator-home",
      "-c",
      this.defaultProjectPath
    ]);
  }
  async tmuxSessionExists() {
    try {
      await this.runTmux(["has-session", "-t", this.tmuxSessionName]);
      return true;
    } catch {
      return false;
    }
  }
  async reconcileSession(session) {
    const syncedSession = await this.syncDiscoveredProviderSessionIds(session);
    const paneExists = await this.tmuxPaneExists(session.tmuxPaneId);
    if (paneExists) {
      const queuedJob = getNextQueuedJob(syncedSession.jobs);
      if (!syncedSession.jobs.some((job) => job.status === "running") && queuedJob) {
        await this.startPreparedJob(syncedSession, queuedJob);
        return getOrchestratorSession(this.workspace, session.sessionId);
      }
    }
    const next = deriveSessionStatus(syncedSession, paneExists);
    const statusChanged = next.status !== syncedSession.status || next.activeJobId !== syncedSession.activeJobId || next.lastJobId !== syncedSession.lastJobId;
    if (statusChanged) {
      await updateOrchestratorSession(this.workspace, session.sessionId, next);
    }
    return statusChanged ? getOrchestratorSession(this.workspace, session.sessionId) : syncedSession;
  }
  async tmuxPaneExists(paneId) {
    try {
      await this.readTmuxValue(paneId, "#{pane_id}");
      return true;
    } catch {
      return false;
    }
  }
  async readTmuxValue(target, format) {
    const { stdout } = await this.runTmux([
      "display-message",
      "-p",
      "-t",
      target,
      format
    ]);
    const value = stdout.trim();
    if (!value) {
      throw new Error(`tmux target ${target} did not produce ${format}.`);
    }
    return value;
  }
  async runTmux(args) {
    return execFile("tmux", args, { encoding: "utf8" });
  }
  async killWindowForPane(paneId) {
    const paneExists = await this.tmuxPaneExists(paneId);
    if (!paneExists) {
      return;
    }
    const windowId = await this.readTmuxValue(paneId, "#{window_id}");
    await this.runTmux(["kill-window", "-t", windowId]);
  }
  async assertCapabilities(cliProvider = DEFAULT_ORCHESTRATOR_CLI_PROVIDER) {
    const capabilities = await this.getCapabilities();
    if (!capabilities.tmuxInstalled) {
      throw new Error("tmux is required for the Orchestrator feature.");
    }
    if (cliProvider === COPILOT_CLI_PROVIDER.id && !capabilities.copilotInstalled) {
      throw new Error(
        "The `copilot` CLI is required for Copilot-backed orchestrator sessions."
      );
    }
    if (cliProvider === GEMINI_CLI_PROVIDER.id && !capabilities.geminiInstalled) {
      throw new Error(
        "The `gemini` CLI is required for Gemini-backed orchestrator sessions."
      );
    }
    if (cliProvider === CODEX_CLI_PROVIDER.id && !capabilities.codexInstalled) {
      throw new Error(
        "The `codex` CLI is required for Codex-backed orchestrator sessions."
      );
    }
    if (cliProvider === OPENCODE_CLI_PROVIDER.id && !capabilities.opencodeInstalled) {
      throw new Error(
        "The `opencode` CLI is required for Opencode-backed orchestrator sessions."
      );
    }
  }
  async commandExists(command) {
    try {
      await execFile("which", [command], { encoding: "utf8" });
      return true;
    } catch {
      return false;
    }
  }
  async assertProjectPath(projectPath) {
    const stat = await fs.stat(projectPath).catch((error) => {
      if (error.code === "ENOENT") {
        throw new Error(`Project path does not exist: ${projectPath}`);
      }
      throw error;
    });
    if (!stat.isDirectory()) {
      throw new Error(`Project path must be a directory: ${projectPath}`);
    }
    const historyRoot = path.join(
      this.workspace.agentsRoot,
      ORCHESTRATOR_AGENT_ID
    );
    if (!await pathExists(historyRoot)) {
      await fs.mkdir(historyRoot, { recursive: true });
    }
  }
  async readWorkingTree(projectPath) {
    const repository = await this.resolveGitRepository(projectPath);
    if ("message" in repository) {
      return orchestratorWorkingTreeSchema.parse({
        state: repository.state,
        projectPath,
        files: [],
        message: repository.message
      });
    }
    const { stdout } = await this.runGitCommand(
      ["status", "--porcelain=v1", "--untracked-files=all"],
      repository.repositoryRoot
    );
    const files = await Promise.all(
      parseGitStatusPorcelain(stdout).map(async (file) => ({
        ...file,
        lineStats: await this.readWorkingTreeFileLineStats(
          repository.repositoryRoot,
          file
        )
      }))
    );
    return orchestratorWorkingTreeSchema.parse({
      state: files.length > 0 ? "dirty" : "clean",
      projectPath,
      repositoryRoot: repository.repositoryRoot,
      files,
      message: files.length > 0 ? void 0 : "No uncommitted changes in this project."
    });
  }
  async readWorkingTreeDiff(projectPath, filePath) {
    const normalizedPath = normalizeRepositoryRelativePath(filePath);
    const workingTree = await this.readWorkingTree(projectPath);
    if (workingTree.state !== "dirty" && workingTree.state !== "clean") {
      return orchestratorWorkingTreeDiffSchema.parse({
        state: workingTree.state,
        projectPath,
        repositoryRoot: workingTree.repositoryRoot,
        path: normalizedPath,
        diff: "",
        message: workingTree.message
      });
    }
    const change = workingTree.files.find(
      (candidate) => candidate.path === normalizedPath
    );
    if (!change) {
      return orchestratorWorkingTreeDiffSchema.parse({
        state: "not-found",
        projectPath,
        repositoryRoot: workingTree.repositoryRoot,
        path: normalizedPath,
        diff: "",
        message: "That file is no longer listed as an uncommitted change."
      });
    }
    const diffArgs = change.statusCode === "??" ? ["diff", "--no-index", "--no-color", "--", "/dev/null", change.path] : ["diff", "--no-ext-diff", "--no-color", "HEAD", "--", change.path];
    const diffResult = await this.runGitCommand(
      diffArgs,
      workingTree.repositoryRoot ?? projectPath,
      [0, 1]
    );
    const diff = diffResult.stdout.trim().length > 0 ? diffResult.stdout : "";
    const structured = diff ? parseStructuredUnifiedDiff(diff) : void 0;
    return orchestratorWorkingTreeDiffSchema.parse({
      state: diff ? "ready" : "empty",
      projectPath,
      repositoryRoot: workingTree.repositoryRoot,
      path: change.path,
      diff,
      structured,
      message: diff ? structured && !structured.hasText ? structured.isBinary ? "This change contains binary or non-text content, so no text diff preview is available." : "No line-level text diff is available for this file." : void 0 : "No text diff is available for this file yet."
    });
  }
  async readWorkingTreeFileLineStats(repositoryRoot, file) {
    const diffArgs = file.statusCode === "??" ? [
      "diff",
      "--no-index",
      "--no-color",
      "--numstat",
      "--",
      "/dev/null",
      file.path
    ] : [
      "diff",
      "--no-ext-diff",
      "--no-color",
      "--numstat",
      "HEAD",
      "--",
      file.path
    ];
    const result = await this.runGitCommand(diffArgs, repositoryRoot, [0, 1]);
    const firstLine = result.stdout.split(/\r?\n/).find((line) => line.trim().length > 0);
    if (!firstLine) {
      return {
        added: 0,
        removed: 0,
        isBinary: false
      };
    }
    return parseNumstatLine(firstLine);
  }
  async resolveGitRepository(projectPath) {
    if (!await this.commandExists("git")) {
      return {
        state: "git-unavailable",
        message: "Git is not installed, so working tree changes cannot be shown."
      };
    }
    try {
      const { stdout } = await this.runGitCommand(
        ["rev-parse", "--show-toplevel"],
        projectPath
      );
      return {
        state: "clean",
        repositoryRoot: stdout.trim()
      };
    } catch (error) {
      if (isGitMissingRepositoryError(error)) {
        return {
          state: "non-git",
          message: "This project path is not inside a git repository."
        };
      }
      throw error;
    }
  }
  async runGitCommand(args, cwd, allowedExitCodes = [0]) {
    try {
      return await execFile("git", args, {
        cwd,
        encoding: "utf8"
      });
    } catch (error) {
      const exitCode = typeof error === "object" && error && "code" in error ? error.code : void 0;
      if (typeof exitCode === "number" && allowedExitCodes.includes(exitCode) && typeof error === "object" && error && "stdout" in error && "stderr" in error) {
        return {
          stdout: typeof error.stdout === "string" ? error.stdout : "",
          stderr: typeof error.stderr === "string" ? error.stderr : ""
        };
      }
      throw error;
    }
  }
  normalizeCliProvider(cliProvider) {
    const normalized = cliProvider?.trim() || DEFAULT_ORCHESTRATOR_CLI_PROVIDER;
    if (normalized === GEMINI_CLI_PROVIDER.id) return GEMINI_CLI_PROVIDER.id;
    if (normalized === CODEX_CLI_PROVIDER.id) return CODEX_CLI_PROVIDER.id;
    if (normalized === OPENCODE_CLI_PROVIDER.id)
      return OPENCODE_CLI_PROVIDER.id;
    return COPILOT_CLI_PROVIDER.id;
  }
  async finalizeCancelledJob(sessionId, jobId, completedAt, sessionUpdates) {
    await updateOrchestratorJob(this.workspace, sessionId, jobId, {
      status: "failed",
      completedAt,
      exitCode: CANCELLED_JOB_EXIT_CODE
    });
    await writeOrchestratorJobCompletion(this.workspace, sessionId, jobId, {
      exitCode: CANCELLED_JOB_EXIT_CODE,
      completedAt
    });
    await updateOrchestratorSession(this.workspace, sessionId, {
      ...sessionUpdates,
      activeJobId: void 0,
      lastJobId: jobId
    });
  }
  async queueDelegation(session, delegatedPrompt, options = {}) {
    const attachment = options.attachment;
    const cliProvider = session.cliProvider ?? DEFAULT_ORCHESTRATOR_CLI_PROVIDER;
    const promptMode = attachment || shouldMaterializePrompt(delegatedPrompt) ? "file" : "inline";
    const premiumUsage = await this.estimatePremiumUsage(session.model);
    const job = await createOrchestratorJob(this.workspace, session.sessionId, {
      prompt: delegatedPrompt,
      promptPreview: delegatedPrompt.trim().slice(0, 160) || attachment?.name || "Delegated prompt",
      providerSessionId: supportsProviderSessionResume(cliProvider) ? normalizeProviderSessionId(
        options.providerSessionId ?? session.providerSessionId
      ) : void 0,
      promptMode,
      attachment,
      customAgentId: options.customAgentId,
      scheduleId: options.scheduleId,
      premiumUsage
    });
    const { providerSessionId, resumeProviderSession } = resolveQueuedJobProviderSession({
      cliProvider,
      jobId: job.jobId,
      sessionProviderSessionId: session.providerSessionId,
      requestedProviderSessionId: options.providerSessionId
    });
    const effectiveJob = providerSessionId === job.providerSessionId ? job : {
      ...job,
      providerSessionId
    };
    if (providerSessionId !== job.providerSessionId) {
      await updateOrchestratorJob(
        this.workspace,
        session.sessionId,
        job.jobId,
        {
          providerSessionId
        }
      );
    }
    if (options.customAgentId !== session.selectedCustomAgentId) {
      await updateOrchestratorSession(this.workspace, session.sessionId, {
        selectedCustomAgentId: options.customAgentId
      });
    }
    const { session: executionSession, systemNotice } = await this.ensureSessionReadyForExecution({
      ...session,
      selectedCustomAgentId: options.customAgentId
    });
    const preparedJob = await this.prepareJobArtifacts(
      executionSession,
      effectiveJob,
      delegatedPrompt,
      resumeProviderSession
    );
    if (executionSession.status === "running" && executionSession.activeJobId) {
      await updateOrchestratorSession(this.workspace, session.sessionId, {
        lastJobId: preparedJob.jobId,
        status: "running"
      });
      return { job: preparedJob, systemNotice };
    }
    await this.startPreparedJob(executionSession, preparedJob);
    return { job: preparedJob, systemNotice };
  }
  async prepareJobArtifacts(session, job, prompt, resumeProviderSession) {
    const effectivePrompt = buildPromptWithAttachmentContext(
      this.workspace.storeRoot,
      prompt,
      job.attachment
    );
    let promptPath = job.promptPath;
    if (job.promptMode === "file") {
      promptPath = path.join(job.jobDirectory, ORCHESTRATOR_PROMPT_FILENAME);
      await fs.writeFile(
        promptPath,
        ensureTrailingNewline(effectivePrompt),
        "utf8"
      );
      await updateOrchestratorJob(
        this.workspace,
        session.sessionId,
        job.jobId,
        {
          promptPath
        }
      );
    }
    const donePath = path.join(job.jobDirectory, "DONE.json");
    const outputPath = path.join(job.jobDirectory, "output.log");
    const scriptPath = path.join(
      job.jobDirectory,
      ORCHESTRATOR_SCRIPT_FILENAME
    );
    await updateOrchestratorJob(this.workspace, session.sessionId, job.jobId, {
      outputPath
    });
    const script = buildDelegationShellScript({
      jobId: job.jobId,
      donePath,
      outputPath,
      cliProvider: session.cliProvider ?? DEFAULT_ORCHESTRATOR_CLI_PROVIDER,
      model: session.model,
      prompt: effectivePrompt,
      promptPath,
      promptMode: job.promptMode,
      projectPurpose: session.projectPurpose,
      customAgentId: job.customAgentId,
      providerSessionId: job.providerSessionId,
      resumeProviderSession,
      executionMode: session.executionMode,
      tmuxTarget: session.tmuxPaneId
    });
    await fs.writeFile(scriptPath, script, "utf8");
    await fs.chmod(scriptPath, 493);
    return {
      ...job,
      promptPath,
      outputPath
    };
  }
  async startPreparedJob(session, job) {
    const scriptPath = path.join(
      job.jobDirectory,
      ORCHESTRATOR_SCRIPT_FILENAME
    );
    await this.runTmux([
      "send-keys",
      "-t",
      session.tmuxPaneId,
      `bash ${shellQuote(scriptPath)}`,
      "Enter"
    ]);
    await updateOrchestratorJob(this.workspace, session.sessionId, job.jobId, {
      status: "running",
      startedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    await updateOrchestratorSession(this.workspace, session.sessionId, {
      activeJobId: job.jobId,
      lastJobId: job.jobId,
      premiumUsage: accumulatePremiumUsageTotals(
        session.premiumUsage,
        job.premiumUsage
      ),
      status: "running"
    });
  }
  async ensureSessionReadyForExecution(session) {
    if (await this.tmuxPaneExists(session.tmuxPaneId)) {
      return { session };
    }
    const nextPaneId = await this.createWindow({
      projectPath: session.projectPath,
      tmuxWindowName: session.tmuxWindowName,
      startedAt: session.startedAt,
      title: session.title,
      sessionId: session.sessionId
    });
    await this.writePaneNotice(nextPaneId, AUTO_RECOVERED_TMUX_NOTICE);
    const runningJob = session.jobs.find((job) => job.jobId === session.activeJobId) ?? session.jobs.find((job) => job.status === "running");
    if (runningJob) {
      await this.finalizeCancelledJob(
        session.sessionId,
        runningJob.jobId,
        (/* @__PURE__ */ new Date()).toISOString(),
        {
          tmuxPaneId: nextPaneId,
          status: "idle"
        }
      );
    } else {
      await updateOrchestratorSession(this.workspace, session.sessionId, {
        tmuxPaneId: nextPaneId,
        activeJobId: void 0,
        status: "idle"
      });
    }
    return {
      session: {
        ...session,
        tmuxPaneId: nextPaneId,
        activeJobId: void 0,
        status: "idle"
      },
      systemNotice: AUTO_RECOVERED_TMUX_NOTICE
    };
  }
  async estimatePremiumUsage(model) {
    if (!this.resolveModelDescriptor) {
      return void 0;
    }
    const descriptor = await this.resolveModelDescriptor(model);
    if (!descriptor) {
      return void 0;
    }
    return {
      source: "tmux-estimate",
      model,
      premiumRequestUnits: descriptor.premiumRequestMultiplier ?? 0,
      billingMultiplier: descriptor.premiumRequestMultiplier,
      recordedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async resolveRetryPrompt(job) {
    if (job.prompt?.trim().length) {
      return job.prompt;
    }
    if (!job.promptPath) {
      return "";
    }
    return fs.readFile(job.promptPath, "utf8");
  }
  async readRetryAttachment(attachment) {
    if (!attachment) {
      return void 0;
    }
    const filePath = path.join(
      this.workspace.storeRoot,
      attachment.relativePath
    );
    const content = await fs.readFile(filePath);
    return {
      name: attachment.name,
      contentType: attachment.contentType,
      size: attachment.size,
      base64Data: content.toString("base64")
    };
  }
  resolveSelectedCustomAgentId(session, requestedCustomAgentId) {
    if (requestedCustomAgentId === void 0) {
      return session.selectedCustomAgentId;
    }
    if (requestedCustomAgentId === null) {
      return void 0;
    }
    const selected = requestedCustomAgentId.trim();
    if (!selected) {
      return void 0;
    }
    const exists = session.availableCustomAgents.some(
      (agent) => agent.id === selected
    );
    if (!exists) {
      throw new Error(
        `Unknown Copilot custom agent for this session: ${requestedCustomAgentId}`
      );
    }
    return selected;
  }
  isEmailDeliveryConfigured() {
    return isRuntimeSmtpConfigured();
  }
  async loadSession(sessionId, systemNotice) {
    const session = await this.getSession(sessionId);
    return systemNotice ? { ...session, systemNotice } : session;
  }
  async writePaneNotice(paneId, message) {
    await this.runTmux([
      "send-keys",
      "-t",
      paneId,
      `printf ${shellQuote(`[coding-agent-orchestrator] ${message}\\n`)}`,
      "Enter"
    ]);
  }
  async syncDiscoveredProviderSessionIds(session) {
    if ((session.cliProvider ?? DEFAULT_ORCHESTRATOR_CLI_PROVIDER) !== "copilot") {
      return session;
    }
    let jobsChanged = false;
    const discoveredProviderSessions = [];
    const jobs = await Promise.all(
      session.jobs.map(async (job) => {
        const discoveredProviderSessionId = await this.readDiscoveredProviderSessionId(job);
        if (discoveredProviderSessionId) {
          discoveredProviderSessions.push({
            providerSessionId: discoveredProviderSessionId,
            timestamp: getJobActivityTimestamp(job)
          });
        }
        if (!discoveredProviderSessionId || discoveredProviderSessionId === job.providerSessionId) {
          return job;
        }
        jobsChanged = true;
        await updateOrchestratorJob(
          this.workspace,
          session.sessionId,
          job.jobId,
          {
            providerSessionId: discoveredProviderSessionId
          }
        );
        return {
          ...job,
          providerSessionId: discoveredProviderSessionId
        };
      })
    );
    const latestProviderSessionId = discoveredProviderSessions.sort(
      (left, right) => right.timestamp.localeCompare(left.timestamp)
    )[0]?.providerSessionId;
    const shouldUpdateSession = latestProviderSessionId && latestProviderSessionId !== session.providerSessionId;
    if (!jobsChanged && !shouldUpdateSession) {
      return session;
    }
    if (shouldUpdateSession) {
      await updateOrchestratorSession(this.workspace, session.sessionId, {
        providerSessionId: latestProviderSessionId
      });
    }
    return {
      ...session,
      jobs,
      providerSessionId: latestProviderSessionId ?? session.providerSessionId
    };
  }
  async readDiscoveredProviderSessionId(job) {
    if (!job.outputPath) {
      return void 0;
    }
    const output = await fs.readFile(job.outputPath, "utf8").catch((error) => {
      if (error.code === "ENOENT") {
        return void 0;
      }
      throw error;
    });
    if (!output) {
      return void 0;
    }
    return extractCopilotProviderSessionId(output);
  }
};
function deriveSessionStatus(session, paneExists) {
  if (!paneExists) {
    return {
      status: "missing",
      activeJobId: void 0,
      lastJobId: session.lastJobId
    };
  }
  const runningJob = session.jobs.find((job) => job.status === "running");
  if (runningJob) {
    return {
      status: "running",
      activeJobId: runningJob.jobId,
      lastJobId: runningJob.jobId
    };
  }
  const queuedJob = getNextQueuedJob(session.jobs);
  if (queuedJob) {
    return {
      status: "running",
      activeJobId: void 0,
      lastJobId: queuedJob.jobId
    };
  }
  const latestJob = session.jobs[0];
  if (!latestJob) {
    return {
      status: "idle",
      activeJobId: void 0,
      lastJobId: void 0
    };
  }
  return {
    status: latestJob.status === "failed" ? "failed" : "completed",
    activeJobId: void 0,
    lastJobId: latestJob.jobId
  };
}
function getNextQueuedJob(jobs) {
  return [...jobs].filter((job) => job.status === "queued").sort(
    (left, right) => left.submittedAt.localeCompare(right.submittedAt)
  )[0];
}
function getJobActivityTimestamp(job) {
  return job.completedAt ?? job.startedAt ?? job.submittedAt;
}
function shouldMaterializePrompt(prompt) {
  const lineCount = prompt.split("\n").length;
  return prompt.length > DIRECT_PROMPT_LIMIT || lineCount > DIRECT_PROMPT_LINE_LIMIT;
}
function buildDelegationShellScript(input) {
  const cliProvider = input.cliProvider ?? DEFAULT_ORCHESTRATOR_CLI_PROVIDER;
  const command = cliProvider === GEMINI_CLI_PROVIDER.id ? buildGeminiCommand({
    model: input.model,
    prompt: input.prompt,
    promptMode: input.promptMode,
    promptPath: input.promptPath,
    providerSessionId: input.providerSessionId
  }) : cliProvider === CODEX_CLI_PROVIDER.id ? buildCodexCommand({
    model: input.model,
    prompt: input.prompt,
    promptMode: input.promptMode,
    promptPath: input.promptPath,
    projectPurpose: input.projectPurpose,
    providerSessionId: input.providerSessionId
  }) : cliProvider === OPENCODE_CLI_PROVIDER.id ? buildOpencodeCommand({
    model: input.model,
    prompt: input.prompt,
    promptMode: input.promptMode,
    promptPath: input.promptPath,
    providerSessionId: input.providerSessionId
  }) : buildCopilotCommand({
    model: input.model,
    prompt: input.prompt,
    promptMode: input.promptMode,
    promptPath: input.promptPath,
    projectPurpose: input.projectPurpose,
    customAgentId: input.customAgentId,
    providerSessionId: input.providerSessionId,
    resumeProviderSession: input.resumeProviderSession ?? false,
    executionMode: input.executionMode ?? "standard"
  });
  return [
    "#!/usr/bin/env bash",
    "set -u",
    "set -o pipefail",
    `job_id=${shellQuote(input.jobId)}`,
    `done_path=${shellQuote(input.donePath)}`,
    `output_path=${shellQuote(input.outputPath)}`,
    `tmux_target=${shellQuote(input.tmuxTarget)}`,
    `cli_provider=${shellQuote(cliProvider)}`,
    `max_rate_limit_retries=${MAX_COPILOT_RATE_LIMIT_RETRIES}`,
    `rate_limit_buffer_seconds=${COPILOT_RATE_LIMIT_BUFFER_SECONDS}`,
    `project_purpose=${shellQuote(input.projectPurpose)}`,
    "extract_rate_limit_wait_seconds() {",
    '  local output_file="$1"',
    `  node - "$output_file" <<'NODE' 2>/dev/null || true`,
    ...buildCopilotRateLimitParserNodeScript(),
    "NODE",
    "}",
    'started_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")',
    `printf '\\n[coding-agent-orchestrator] Delegating job %s at %s\\n' "$job_id" "$started_at"`,
    'mkdir -p "$(dirname "$output_path")"',
    `printf '[coding-agent-orchestrator] Job %s started at %s\\n' "$job_id" "$started_at" >> "$output_path"`,
    "attempt=1",
    "rate_limit_retry_count=0",
    "while true; do",
    `  attempt_output=$(mktemp "\${TMPDIR:-/tmp}/coding-agent-orchestrator-rate-limit.XXXXXX")`,
    '  if [ "$attempt" -gt 1 ]; then',
    `    printf '[coding-agent-orchestrator] Job %s retry attempt %s of %s\\n' "$job_id" "$rate_limit_retry_count" "$max_rate_limit_retries" | tee -a "$output_path"`,
    "  fi",
    "  {",
    `    ${command}`,
    '  } 2>&1 | tee -a "$output_path" "$attempt_output"',
    "  status=${PIPESTATUS[0]}",
    '  if [ "$status" -eq 0 ]; then',
    '    rm -f "$attempt_output"',
    "    break",
    "  fi",
    '  wait_seconds=""',
    '  if [ "$cli_provider" = "copilot" ]; then',
    '    wait_seconds=$(extract_rate_limit_wait_seconds "$attempt_output")',
    "  fi",
    '  if [ -n "$wait_seconds" ]; then',
    '    if [ "$rate_limit_retry_count" -ge "$max_rate_limit_retries" ]; then',
    `      printf '[coding-agent-orchestrator] Copilot rate limit retry budget exhausted for job %s after %s retries.\\n' "$job_id" "$rate_limit_retry_count" | tee -a "$output_path"`,
    '      rm -f "$attempt_output"',
    "      break",
    "    fi",
    "    rate_limit_retry_count=$((rate_limit_retry_count + 1))",
    "    sleep_seconds=$((wait_seconds + rate_limit_buffer_seconds))",
    '    if [ "$sleep_seconds" -lt 1 ]; then',
    "      sleep_seconds=1",
    "    fi",
    '    retry_at=$(date -u -d "@$(( $(date -u +%s) + sleep_seconds ))" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || true)',
    '    if [ -n "$retry_at" ]; then',
    `      printf '[coding-agent-orchestrator] Copilot rate limit detected for job %s. Waiting %s seconds until %s before retry %s of %s.\\n' "$job_id" "$sleep_seconds" "$retry_at" "$rate_limit_retry_count" "$max_rate_limit_retries" | tee -a "$output_path"`,
    "    else",
    `      printf '[coding-agent-orchestrator] Copilot rate limit detected for job %s. Waiting %s seconds before retry %s of %s.\\n' "$job_id" "$sleep_seconds" "$rate_limit_retry_count" "$max_rate_limit_retries" | tee -a "$output_path"`,
    "    fi",
    '    rm -f "$attempt_output"',
    '    sleep "$sleep_seconds"',
    "    attempt=$((attempt + 1))",
    "    continue",
    "  fi",
    '  rm -f "$attempt_output"',
    "  break",
    "done",
    'completed_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")',
    `printf '\\n[coding-agent-orchestrator] Job %s finished with exit code %s at %s\\n' "$job_id" "$status" "$completed_at"`,
    `printf '[coding-agent-orchestrator] Job %s finished with exit code %s at %s\\n' "$job_id" "$status" "$completed_at" >> "$output_path"`,
    'if [ "$status" -eq 0 ]; then',
    '  completion_message="coding-agent-orchestrator: job $job_id completed successfully"',
    "else",
    '  completion_message="coding-agent-orchestrator: job $job_id failed (exit $status)"',
    "fi",
    `printf '[coding-agent-orchestrator] Notification: %s at %s\\n' "$completion_message" "$completed_at"`,
    'cat > "$done_path" <<EOF',
    "{",
    '  "exitCode": $status,',
    '  "completedAt": "$completed_at"',
    "}",
    "EOF",
    'tmux display-message -d 15000 -t "$tmux_target" "$completion_message"',
    "printf '\\a'",
    "exit 0",
    ""
  ].join("\n");
}
function extractCopilotProviderSessionId(output) {
  for (const pattern of COPILOT_SESSION_ID_PATTERNS) {
    const matches = [...output.matchAll(pattern)];
    for (const match of matches.reverse()) {
      const candidate = normalizeDiscoveredProviderSessionId(match[1]);
      if (candidate) {
        return candidate;
      }
    }
  }
  return void 0;
}
function buildCopilotCommand(input) {
  const agentFlag = input.customAgentId ? ` --agent ${shellQuote(input.customAgentId)}` : "";
  const autopilotFlag = input.executionMode === "auto" ? " --mode autopilot" : "";
  const providerSessionFlag = input.providerSessionId ? input.resumeProviderSession ? ` --resume ${shellQuote(input.providerSessionId)}` : ` --name ${shellQuote(input.providerSessionId)}` : "";
  const promptFlag = "-p";
  const normalizePrompt = (value) => {
    if (input.executionMode === "fleet") {
      return `/fleet ${value}`;
    }
    return value;
  };
  if (input.promptMode === "file") {
    if (!input.promptPath) {
      throw new Error("Prompt file mode requires a promptPath.");
    }
    const delegatedPrompt = [
      "Read the full task instructions from the referenced file and carry them out in the current working directory.",
      `Task file: ${input.promptPath}`,
      `Project purpose: ${input.projectPurpose}`
    ].join("\n");
    return `copilot --model ${shellQuote(input.model)}${agentFlag}${autopilotFlag}${providerSessionFlag} --yolo ${promptFlag} ${shellQuote(
      normalizePrompt(delegatedPrompt)
    )}`;
  }
  return `copilot --model ${shellQuote(input.model)}${agentFlag}${autopilotFlag}${providerSessionFlag} --yolo ${promptFlag} ${shellQuote(
    normalizePrompt(input.prompt)
  )}`;
}
function buildGeminiCommand(input) {
  const providerSessionFlag = input.providerSessionId ? ` --resume ${shellQuote(input.providerSessionId)}` : "";
  if (input.promptMode === "file") {
    if (!input.promptPath) {
      throw new Error("Prompt file mode requires a promptPath.");
    }
    return `gemini --model ${shellQuote(input.model)}${providerSessionFlag} --yolo < ${shellQuote(
      input.promptPath
    )}`;
  }
  return `gemini --model ${shellQuote(input.model)}${providerSessionFlag} --yolo --prompt ${shellQuote(
    input.prompt
  )}`;
}
function buildCodexCommand(input) {
  if (input.providerSessionId) {
    if (input.promptMode === "file" && !input.promptPath) {
      throw new Error("Prompt file mode requires a promptPath.");
    }
    const prompt = input.promptMode === "file" ? [
      "Read the full task instructions from the referenced file and carry them out in the current working directory.",
      `Task file: ${input.promptPath}`,
      `Project purpose: ${input.projectPurpose}`
    ].join("\n") : input.prompt;
    return `codex resume --model ${shellQuote(input.model)} --approval-mode full-auto ${shellQuote(
      input.providerSessionId
    )} ${shellQuote(prompt)}`;
  }
  if (input.promptMode === "file") {
    if (!input.promptPath) {
      throw new Error("Prompt file mode requires a promptPath.");
    }
    return `codex --model ${shellQuote(input.model)} --approval-mode full-auto < ${shellQuote(
      input.promptPath
    )}`;
  }
  return `codex --model ${shellQuote(input.model)} --approval-mode full-auto -q ${shellQuote(
    input.prompt
  )}`;
}
function buildOpencodeCommand(input) {
  const providerSessionFlag = input.providerSessionId ? ` --session ${shellQuote(input.providerSessionId)}` : "";
  if (input.promptMode === "file") {
    if (!input.promptPath) {
      throw new Error("Prompt file mode requires a promptPath.");
    }
    return `opencode run --model ${shellQuote(input.model)}${providerSessionFlag} < ${shellQuote(
      input.promptPath
    )}`;
  }
  return `opencode run --model ${shellQuote(input.model)}${providerSessionFlag} -p ${shellQuote(
    input.prompt
  )}`;
}
function buildPromptWithAttachmentContext(storeRoot, prompt, attachment) {
  const trimmedPrompt = prompt.trim();
  if (!attachment) {
    return trimmedPrompt;
  }
  const attachmentPath = path.join(storeRoot, attachment.relativePath);
  return [
    "A file is attached to this delegated task.",
    `Attachment name: ${attachment.name}`,
    `Attachment type: ${attachment.contentType}`,
    `Attachment size: ${attachment.size} bytes`,
    `Attachment path: ${attachmentPath}`,
    "Inspect the attachment from disk as part of the work if it is relevant.",
    "",
    "Task:",
    trimmedPrompt || "Inspect the attached file and complete the most relevant next step in the current project."
  ].join("\n");
}
function normalizeDiscoveredProviderSessionId(value) {
  if (!value) {
    return void 0;
  }
  const normalized = value.trim().replace(/\s+\(named:.*$/i, "").replace(/[),.;:]+$/, "").replace(/^["']|["']$/g, "").trim();
  if (!normalized || normalized.toLowerCase() === "none") {
    return void 0;
  }
  return normalized;
}
function buildCopilotRateLimitParserNodeScript() {
  return [
    "const fs = require('node:fs');",
    `const COPILOT_RATE_LIMIT_SIGNAL_PATTERN = ${COPILOT_RATE_LIMIT_SIGNAL_PATTERN.toString()};`,
    `const COPILOT_RATE_LIMIT_RETRY_AFTER_PATTERN = ${COPILOT_RATE_LIMIT_RETRY_AFTER_PATTERN.toString()};`,
    `const COPILOT_RATE_LIMIT_RESET_EPOCH_PATTERN = ${COPILOT_RATE_LIMIT_RESET_EPOCH_PATTERN.toString()};`,
    `const COPILOT_RATE_LIMIT_RESET_ISO_PATTERN = ${COPILOT_RATE_LIMIT_RESET_ISO_PATTERN.toString()};`,
    `const COPILOT_RATE_LIMIT_RELATIVE_WINDOW_PATTERN = ${COPILOT_RATE_LIMIT_RELATIVE_WINDOW_PATTERN.toString()};`,
    `const COPILOT_RATE_LIMIT_DURATION_PART_PATTERN = ${COPILOT_RATE_LIMIT_DURATION_PART_PATTERN.toString()};`,
    `const DEFAULT_COPILOT_RATE_LIMIT_WAIT_SECONDS = ${DEFAULT_COPILOT_RATE_LIMIT_WAIT_SECONDS};`,
    collectRateLimitHelpersSource(),
    "const outputPath = process.argv[2];",
    "if (!outputPath) {",
    "  process.exit(0);",
    "}",
    "const output = fs.readFileSync(outputPath, 'utf8');",
    "const waitSeconds = extractCopilotRateLimitWaitSeconds(output);",
    "if (Number.isFinite(waitSeconds) && waitSeconds > 0) {",
    "  process.stdout.write(String(waitSeconds));",
    "}"
  ];
}
function collectRateLimitHelpersSource() {
  return [
    "function collectMatches(pattern, output, mapper) {",
    "  return Array.from(output.matchAll(pattern), mapper);",
    "}",
    "function unitToSeconds(unit) {",
    "  switch (unit.toLowerCase()) {",
    "    case 'second':",
    "    case 'seconds':",
    "    case 'sec':",
    "    case 'secs':",
    "    case 's':",
    "      return 1;",
    "    case 'minute':",
    "    case 'minutes':",
    "    case 'min':",
    "    case 'mins':",
    "    case 'm':",
    "      return 60;",
    "    case 'hour':",
    "    case 'hours':",
    "    case 'hr':",
    "    case 'hrs':",
    "    case 'h':",
    "      return 3600;",
    "    case 'day':",
    "    case 'days':",
    "    case 'd':",
    "      return 86400;",
    "    default:",
    "      return undefined;",
    "  }",
    "}",
    "function collectRateLimitRetryAfterMatches(output) {",
    "  return collectMatches(",
    "    COPILOT_RATE_LIMIT_RETRY_AFTER_PATTERN,",
    "    output,",
    "    (match) => Number.parseInt(match[1] ?? '', 10)",
    "  ).filter(Number.isFinite);",
    "}",
    "function collectRateLimitResetEpochMatches(output, nowMs) {",
    "  return collectMatches(",
    "    COPILOT_RATE_LIMIT_RESET_EPOCH_PATTERN,",
    "    output,",
    "    (match) => {",
    "      const resetAtSeconds = Number.parseInt(match[1] ?? '', 10);",
    "      if (!Number.isFinite(resetAtSeconds)) {",
    "        return Number.NaN;",
    "      }",
    "      return resetAtSeconds - nowMs / 1000;",
    "    }",
    "  ).filter(Number.isFinite);",
    "}",
    "function collectRateLimitResetIsoMatches(output, nowMs) {",
    "  return collectMatches(",
    "    COPILOT_RATE_LIMIT_RESET_ISO_PATTERN,",
    "    output,",
    "    (match) => {",
    "      const resetAtMs = Date.parse(match[1] ?? '');",
    "      if (!Number.isFinite(resetAtMs)) {",
    "        return Number.NaN;",
    "      }",
    "      return (resetAtMs - nowMs) / 1000;",
    "    }",
    "  ).filter(Number.isFinite);",
    "}",
    "function collectRateLimitRelativeMatches(output) {",
    "  return collectMatches(COPILOT_RATE_LIMIT_RELATIVE_WINDOW_PATTERN, output, (match) => {",
    "    const window = match[1] ?? '';",
    "    const durationParts = Array.from(window.matchAll(COPILOT_RATE_LIMIT_DURATION_PART_PATTERN));",
    "    if (durationParts.length === 0) {",
    "      return Number.NaN;",
    "    }",
    "    const totalSeconds = durationParts.reduce((sum, durationMatch) => {",
    "      const amount = Number.parseInt(durationMatch[1] ?? '', 10);",
    "      const unitSeconds = unitToSeconds(durationMatch[2] ?? '');",
    "      if (!Number.isFinite(amount) || unitSeconds === undefined) {",
    "        return Number.NaN;",
    "      }",
    "      return sum + amount * unitSeconds;",
    "    }, 0);",
    "    return Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds : Number.NaN;",
    "  }).filter(Number.isFinite);",
    "}",
    "function extractCopilotRateLimitWaitSeconds(output, nowMs = Date.now()) {",
    "  if (!COPILOT_RATE_LIMIT_SIGNAL_PATTERN.test(output)) {",
    "    return undefined;",
    "  }",
    "  const candidates = [",
    "    ...collectRateLimitRetryAfterMatches(output),",
    "    ...collectRateLimitResetEpochMatches(output, nowMs),",
    "    ...collectRateLimitResetIsoMatches(output, nowMs),",
    "    ...collectRateLimitRelativeMatches(output),",
    "  ].filter((value) => Number.isFinite(value) && value > 0);",
    "  if (candidates.length === 0) {",
    "    return DEFAULT_COPILOT_RATE_LIMIT_WAIT_SECONDS;",
    "  }",
    "  return Math.max(1, Math.ceil(Math.min(...candidates)));",
    "}"
  ].join("\n");
}
function parseGitStatusPorcelain(stdout) {
  return stdout.split(/\r?\n/).flatMap((line) => {
    if (line.length < 3) {
      return [];
    }
    const statusCode = line.slice(0, 2);
    if (statusCode === "!!") {
      return [];
    }
    const rawPath = line.slice(3).trim();
    if (!rawPath) {
      return [];
    }
    const renameLike = statusCode[0] === "R" || statusCode[0] === "C" || statusCode[1] === "R" || statusCode[1] === "C";
    const [previousPath, nextPath] = renameLike && rawPath.includes(" -> ") ? rawPath.split(/\s->\s/, 2) : [void 0, rawPath];
    const nextFilePath = nextPath?.trim();
    if (!nextFilePath) {
      return [];
    }
    const stagedStatus = statusCode === "??" ? void 0 : decodeGitStatusCharacter(statusCode[0] ?? " ");
    const unstagedStatus = statusCode === "??" ? "untracked" : decodeGitStatusCharacter(statusCode[1] ?? " ");
    return [
      {
        path: nextFilePath,
        previousPath: previousPath?.trim() || void 0,
        statusCode,
        stagedStatus,
        unstagedStatus,
        displayStatus: formatGitChangeDisplayStatus({
          stagedStatus,
          unstagedStatus
        })
      }
    ];
  });
}
function parseNumstatLine(line) {
  const [addedRaw = "0", removedRaw = "0"] = line.split("	");
  if (addedRaw === "-" || removedRaw === "-") {
    return {
      added: 0,
      removed: 0,
      isBinary: true
    };
  }
  const added = Number.parseInt(addedRaw, 10);
  const removed = Number.parseInt(removedRaw, 10);
  return {
    added: Number.isFinite(added) ? added : 0,
    removed: Number.isFinite(removed) ? removed : 0,
    isBinary: false
  };
}
function parseStructuredUnifiedDiff(diff) {
  const lines = diff.replace(/\r?\n$/, "").split(/\r?\n/);
  const headerLines = [];
  const hunks = [];
  let oldPath;
  let newPath;
  let isBinary = false;
  let currentHunk;
  let oldLineNumber = 0;
  let newLineNumber = 0;
  for (const line of lines) {
    const hunkMatch = line.match(
      /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(?:\s(.*))?$/
    );
    if (hunkMatch) {
      oldLineNumber = Number.parseInt(hunkMatch[1] ?? "0", 10);
      newLineNumber = Number.parseInt(hunkMatch[3] ?? "0", 10);
      currentHunk = {
        header: line,
        lines: []
      };
      hunks.push(currentHunk);
      continue;
    }
    if (!currentHunk) {
      headerLines.push(line);
      if (line.startsWith("--- ")) {
        oldPath = parseDiffHeaderPath(line.slice(4).trim()) ?? oldPath;
      } else if (line.startsWith("+++ ")) {
        newPath = parseDiffHeaderPath(line.slice(4).trim()) ?? newPath;
      } else if (line.startsWith("rename from ")) {
        oldPath = line.slice("rename from ".length).trim() || oldPath;
      } else if (line.startsWith("rename to ")) {
        newPath = line.slice("rename to ".length).trim() || newPath;
      } else if (line.startsWith("Binary files ") || line === "GIT binary patch") {
        isBinary = true;
      }
      continue;
    }
    if (line.startsWith("+")) {
      currentHunk.lines.push({
        kind: "add",
        content: line.slice(1),
        newLineNumber
      });
      newLineNumber += 1;
      continue;
    }
    if (line.startsWith("-")) {
      currentHunk.lines.push({
        kind: "remove",
        content: line.slice(1),
        oldLineNumber
      });
      oldLineNumber += 1;
      continue;
    }
    if (line.startsWith(" ")) {
      currentHunk.lines.push({
        kind: "context",
        content: line.slice(1),
        oldLineNumber,
        newLineNumber
      });
      oldLineNumber += 1;
      newLineNumber += 1;
      continue;
    }
    currentHunk.lines.push({
      kind: "meta",
      content: line
    });
  }
  return {
    oldPath,
    newPath,
    headerLines,
    hunks,
    isBinary,
    hasText: hunks.length > 0
  };
}
function parseDiffHeaderPath(value) {
  if (!value || value === "/dev/null") {
    return void 0;
  }
  if (value.startsWith("a/") || value.startsWith("b/")) {
    return value.slice(2);
  }
  return value;
}
function shellQuote(value) {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}
function decodeGitStatusCharacter(value) {
  switch (value) {
    case "M":
      return "modified";
    case "A":
      return "added";
    case "D":
      return "deleted";
    case "R":
      return "renamed";
    case "C":
      return "copied";
    case "U":
      return "unmerged";
    default:
      return void 0;
  }
}
function formatGitChangeDisplayStatus(input) {
  const staged = input.stagedStatus ? `${formatGitStatusLabel(input.stagedStatus)} staged` : void 0;
  const unstaged = input.unstagedStatus ? input.unstagedStatus === "untracked" ? "Untracked" : `${formatGitStatusLabel(input.unstagedStatus)} unstaged` : void 0;
  return [staged, unstaged].filter(Boolean).join(" \xB7 ") || "Changed";
}
function formatGitStatusLabel(status) {
  switch (status) {
    case "added":
      return "Added";
    case "copied":
      return "Copied";
    case "deleted":
      return "Deleted";
    case "modified":
      return "Modified";
    case "renamed":
      return "Renamed";
    case "unmerged":
      return "Unmerged";
    case "untracked":
      return "Untracked";
  }
}
function normalizeRepositoryRelativePath(filePath) {
  const normalized = path.posix.normalize(
    filePath.trim().replaceAll("\\", "/")
  );
  if (normalized.length === 0 || normalized === "." || normalized === ".." || normalized.startsWith("../") || path.posix.isAbsolute(normalized)) {
    throw new Error("Change paths must stay inside the session repository.");
  }
  return normalized;
}
function isGitMissingRepositoryError(error) {
  if (!error || typeof error !== "object") {
    return false;
  }
  const stderr = "stderr" in error && typeof error.stderr === "string" ? error.stderr : "";
  return /not a git repository/i.test(stderr);
}
function ensureTrailingNewline(value) {
  return value.endsWith("\n") ? value : `${value}
`;
}
function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "session";
}

// src/scheduler.ts
import { readFile } from "fs/promises";
import {
  listOrchestratorSchedules as listOrchestratorSchedules2,
  updateOrchestratorSchedule as updateOrchestratorSchedule2
} from "@coding-agent-orchestrator/store";
import { DateTime } from "luxon";
import nodemailer from "nodemailer";
var DAY_OF_WEEK_TO_LUXON = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7
};
var OrchestratorScheduleService = class {
  constructor(workspace2, orchestrator2, intervalMs = 6e4) {
    this.workspace = workspace2;
    this.orchestrator = orchestrator2;
    this.intervalMs = intervalMs;
  }
  workspace;
  orchestrator;
  intervalMs;
  timer;
  busy = false;
  mailer;
  stopped = true;
  start() {
    if (!this.stopped) {
      return;
    }
    this.stopped = false;
    void this.tick();
  }
  stop() {
    this.stopped = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = void 0;
    }
  }
  async tick() {
    if (this.busy) {
      return;
    }
    this.busy = true;
    let schedules = [];
    try {
      schedules = await listOrchestratorSchedules2(this.workspace);
      const now = DateTime.utc();
      for (const schedule of schedules) {
        let current = await this.reconcileScheduleRun(schedule);
        if (!current.enabled) {
          continue;
        }
        const nextRun = DateTime.fromISO(current.nextRunAt, { zone: "utc" });
        if (!nextRun.isValid || nextRun > now) {
          continue;
        }
        const job = await this.orchestrator.triggerSchedule(current);
        current = await updateOrchestratorSchedule2(
          this.workspace,
          current.scheduleId,
          {
            lastRunAt: now.toISO() ?? current.lastRunAt,
            lastJobId: job.jobId,
            lastJobStatus: job.status,
            nextRunAt: computeNextRunAt(current, now.plus({ seconds: 1 })),
            totalRuns: current.totalRuns + 1,
            lastCompletedAt: void 0,
            lastEmailAttemptAt: void 0,
            lastEmailAttemptJobId: void 0,
            lastEmailError: void 0
          }
        );
        await this.reconcileScheduleRun(current);
      }
    } catch (error) {
      console.error("Failed to process orchestrator schedules", error);
    } finally {
      this.busy = false;
      this.scheduleNextTick(schedules);
    }
  }
  scheduleNextTick(schedules) {
    if (this.stopped) {
      return;
    }
    if (this.timer) {
      clearTimeout(this.timer);
    }
    const nowMs = Date.now();
    const nextDueMs = schedules.filter((schedule) => schedule.enabled).map((schedule) => Date.parse(schedule.nextRunAt)).filter((value) => Number.isFinite(value)).sort((left, right) => left - right)[0];
    const delayMs = nextDueMs === void 0 ? this.intervalMs : Math.min(this.intervalMs, Math.max(1e3, nextDueMs - nowMs));
    this.timer = setTimeout(() => {
      void this.tick();
    }, delayMs);
    this.timer.unref?.();
  }
  async reconcileScheduleRun(schedule) {
    if (!schedule.lastJobId) {
      return schedule;
    }
    const session = await this.orchestrator.getSession(schedule.sessionId);
    const job = session.jobs.find(
      (candidate) => candidate.jobId === schedule.lastJobId
    );
    if (!job) {
      return schedule;
    }
    let nextSchedule = schedule;
    const statusChanged = job.status !== schedule.lastJobStatus || job.completedAt !== schedule.lastCompletedAt;
    if (statusChanged) {
      nextSchedule = await updateOrchestratorSchedule2(
        this.workspace,
        schedule.scheduleId,
        {
          lastJobStatus: job.status,
          lastCompletedAt: job.completedAt,
          failedRuns: job.status === "failed" && job.completedAt && job.completedAt !== schedule.lastCompletedAt ? schedule.failedRuns + 1 : schedule.failedRuns
        }
      );
    }
    if (!nextSchedule.emailTo || !job.completedAt || nextSchedule.lastEmailAttemptJobId === job.jobId) {
      return nextSchedule;
    }
    const attemptedAt = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await this.sendCompletionEmail(nextSchedule, session.title, job);
      return updateOrchestratorSchedule2(
        this.workspace,
        nextSchedule.scheduleId,
        {
          lastEmailAttemptAt: attemptedAt,
          lastEmailAttemptJobId: job.jobId,
          lastEmailError: void 0
        }
      );
    } catch (error) {
      return updateOrchestratorSchedule2(
        this.workspace,
        nextSchedule.scheduleId,
        {
          lastEmailAttemptAt: attemptedAt,
          lastEmailAttemptJobId: job.jobId,
          lastEmailError: error instanceof Error ? error.message : "Unknown email error"
        }
      );
    }
  }
  async sendCompletionEmail(schedule, sessionTitle, job) {
    if (!schedule.emailTo) {
      return;
    }
    const transporter = this.getMailer();
    if (!transporter) {
      throw new Error("Email delivery is not configured.");
    }
    const smtp = readRuntimeSmtpEnv();
    const output = await this.readJobOutput(job);
    await transporter.sendMail({
      from: smtp.from,
      to: schedule.emailTo,
      replyTo: smtp.replyTo,
      subject: `[coding-agent-orchestrator] ${schedule.title} ${job.status === "failed" ? "failed" : "completed"}`,
      text: [
        `Schedule: ${schedule.title}`,
        `Session: ${sessionTitle}`,
        `Status: ${job.status}`,
        `Completed: ${job.completedAt ?? "in progress"}`,
        `Next run: ${schedule.nextRunAt}`,
        "",
        "Prompt:",
        schedule.prompt,
        "",
        "Output:",
        output || "No job output was captured."
      ].join("\n")
    });
  }
  getMailer() {
    const smtp = readRuntimeSmtpEnv();
    if (!smtp.host || !smtp.port || !smtp.normalizedFrom) {
      return void 0;
    }
    if (this.mailer) {
      return this.mailer;
    }
    const port2 = Number.parseInt(smtp.port, 10);
    if (!Number.isFinite(port2) || port2 <= 0) {
      throw new Error(
        "CODING_AGENT_ORCHESTRATOR_SMTP_PORT must be a positive integer."
      );
    }
    const options = {
      host: smtp.host,
      port: port2,
      secure: smtp.secure
    };
    if (smtp.user) {
      options.auth = {
        user: smtp.user,
        pass: smtp.pass ?? ""
      };
    }
    this.mailer = nodemailer.createTransport(options);
    return this.mailer;
  }
  async readJobOutput(job) {
    if (!job.outputPath) {
      return "";
    }
    try {
      const raw = await readFile(job.outputPath, "utf8");
      return raw.trim().slice(-2e4);
    } catch {
      return "";
    }
  }
};
function computeNextRunAt(schedule, from = DateTime.utc()) {
  const zonedFrom = ensureTimeZone(schedule.timezone, from);
  const [hour, minute] = parseTimeOfDay(schedule.timeOfDay);
  const base = zonedFrom.set({
    hour,
    minute,
    second: 0,
    millisecond: 0
  });
  let next;
  switch (schedule.frequency) {
    case "daily": {
      next = base > zonedFrom ? base : base.plus({ days: 1 });
      break;
    }
    case "weekly": {
      if (!schedule.dayOfWeek) {
        throw new Error("Weekly schedules require a day of week.");
      }
      const targetWeekday = DAY_OF_WEEK_TO_LUXON[schedule.dayOfWeek];
      const dayOffset = (targetWeekday - base.weekday + 7) % 7;
      next = base.plus({ days: dayOffset });
      if (next <= zonedFrom) {
        next = next.plus({ weeks: 1 });
      }
      break;
    }
    case "monthly": {
      if (!schedule.dayOfMonth) {
        throw new Error("Monthly schedules require a day of month.");
      }
      next = resolveMonthlyCandidate(base, schedule.dayOfMonth);
      if (next <= zonedFrom) {
        next = resolveMonthlyCandidate(
          base.plus({ months: 1 }),
          schedule.dayOfMonth
        );
      }
      break;
    }
  }
  const iso = next.toUTC().toISO();
  if (!iso) {
    throw new Error("Unable to compute the next scheduled run.");
  }
  return iso;
}
function resolveMonthlyCandidate(base, requestedDay) {
  return base.set({
    day: Math.min(requestedDay, base.daysInMonth ?? 31)
  });
}
function parseTimeOfDay(timeOfDay) {
  const match = timeOfDay.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error("Time of day must use HH:MM (24-hour) format.");
  }
  const hourText = match[1];
  const minuteText = match[2];
  if (!hourText || !minuteText) {
    throw new Error("Time of day must use HH:MM (24-hour) format.");
  }
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);
  if (hour > 23 || minute > 59) {
    throw new Error("Time of day must be a valid 24-hour time.");
  }
  return [hour, minute];
}
function ensureTimeZone(timezone, from) {
  const zoned = from.setZone(timezone);
  if (!zoned.isValid) {
    throw new Error(`Unsupported time zone: ${timezone}`);
  }
  return zoned;
}

// src/index.ts
var workspace = await resolveWorkspace();
var defaultProjectPath = process.cwd();
var ORCHESTRATOR_TERMINAL_PAGE_LINE_LIMIT = 2e3;
var orchestrator = new TmuxOrchestratorService(workspace, defaultProjectPath);
var scheduleService = new OrchestratorScheduleService(
  workspace,
  orchestrator
);
var app = new Hono();
var port = readRuntimePort();
var runtimeDir = path2.dirname(fileURLToPath(import.meta.url));
var webDistRoot = path2.resolve(runtimeDir, "../../web/dist");
var webDistIndex = path2.join(webDistRoot, "index.html");
app.onError((error, context) => {
  const status = getHttpErrorStatus(error);
  const log = status >= 500 ? console.error : console.warn;
  log(error);
  return context.json({ error: getHttpErrorMessage(error) }, status);
});
app.get("/api/health", async (context) => {
  const summary = await summarizeWorkspace(workspace);
  return context.json({ ok: true, workspace: summary });
});
app.get("/api/workspace", async (context) => {
  return context.json(await summarizeWorkspace(workspace));
});
app.get("/api/orchestrator/agent", async (context) => {
  return context.json(await orchestrator.getAgentSummary());
});
app.get("/api/orchestrator/capabilities", async (context) => {
  return context.json(await orchestrator.getCapabilities());
});
app.get("/api/orchestrator/sessions", async (context) => {
  return context.json(await orchestrator.listSessions());
});
app.post("/api/orchestrator/sessions", async (context) => {
  const request = orchestratorSessionCreateSchema.parse(
    await context.req.json()
  );
  return context.json(await orchestrator.createSession(request));
});
app.get("/api/orchestrator/sessions/:sessionId", async (context) => {
  return context.json(
    await orchestrator.getSession(context.req.param("sessionId"))
  );
});
app.patch("/api/orchestrator/sessions/:sessionId", async (context) => {
  const request = orchestratorSessionUpdateSchema.parse(
    await context.req.json()
  );
  return context.json(
    await orchestrator.updateSession(context.req.param("sessionId"), request)
  );
});
app.delete("/api/orchestrator/sessions/:sessionId", async (context) => {
  await orchestrator.deleteSession(context.req.param("sessionId"));
  return context.json({ ok: true });
});
app.get("/api/orchestrator/sessions/:sessionId/changes", async (context) => {
  const changes = orchestratorWorkingTreeSchema2.parse(
    await orchestrator.getSessionChanges(
      context.req.param("sessionId")
    )
  );
  return context.json(changes);
});
app.get(
  "/api/orchestrator/sessions/:sessionId/changes/diff",
  async (context) => {
    const filePath = context.req.query("path")?.trim();
    if (!filePath) {
      return context.json({ error: "Change path is required." }, 400);
    }
    const diff = orchestratorWorkingTreeDiffSchema2.parse(
      await orchestrator.getSessionChangeDiff(
        context.req.param("sessionId"),
        filePath
      )
    );
    return context.json(diff);
  }
);
app.get("/api/orchestrator/sessions/:sessionId/terminal", async (context) => {
  const sessionId = context.req.param("sessionId");
  const requestedBefore = Number.parseInt(
    context.req.query("before") ?? Number.MAX_SAFE_INTEGER.toString(),
    10
  );
  const beforeOffset = Number.isFinite(requestedBefore) && requestedBefore >= 0 ? requestedBefore : Number.MAX_SAFE_INTEGER;
  const requestedMaxLines = Number.parseInt(
    context.req.query("maxLines") ?? ORCHESTRATOR_TERMINAL_PAGE_LINE_LIMIT.toString(),
    10
  );
  const maxLines = Number.isFinite(requestedMaxLines) && requestedMaxLines > 0 ? Math.min(requestedMaxLines, ORCHESTRATOR_TERMINAL_PAGE_LINE_LIMIT) : ORCHESTRATOR_TERMINAL_PAGE_LINE_LIMIT;
  const chunk = orchestratorTerminalHistoryChunkSchema.parse(
    await orchestrator.readTerminalHistoryChunk(
      sessionId,
      beforeOffset,
      maxLines
    )
  );
  return context.json(chunk);
});
app.post("/api/orchestrator/sessions/:sessionId/jobs", async (context) => {
  const request = orchestratorDelegateRequestSchema.parse(
    await context.req.json()
  );
  return context.json(
    await orchestrator.delegate(context.req.param("sessionId"), request)
  );
});
app.post(
  "/api/orchestrator/sessions/:sessionId/jobs/:jobId/retry",
  async (context) => {
    return context.json(
      await orchestrator.retryJob(
        context.req.param("sessionId"),
        context.req.param("jobId")
      )
    );
  }
);
app.delete(
  "/api/orchestrator/sessions/:sessionId/jobs/:jobId",
  async (context) => {
    return context.json(
      await orchestrator.deleteQueuedJob(
        context.req.param("sessionId"),
        context.req.param("jobId")
      )
    );
  }
);
app.post("/api/orchestrator/sessions/:sessionId/input", async (context) => {
  const request = orchestratorTerminalInputSchema.parse(
    await context.req.json()
  );
  return context.json(
    await orchestrator.sendInput(
      context.req.param("sessionId"),
      request.input,
      request.submit
    )
  );
});
app.post("/api/orchestrator/sessions/:sessionId/cancel", async (context) => {
  return context.json(
    await orchestrator.cancelJob(context.req.param("sessionId"))
  );
});
app.post("/api/orchestrator/sessions/:sessionId/restart", async (context) => {
  return context.json(
    await orchestrator.restartSession(context.req.param("sessionId"))
  );
});
app.get("/api/orchestrator/schedules", async (context) => {
  const sessionId = context.req.query("sessionId") ?? void 0;
  return context.json(await orchestrator.listSchedules(sessionId));
});
app.post("/api/orchestrator/schedules", async (context) => {
  const request = orchestratorScheduleCreateSchema.parse(
    await context.req.json()
  );
  return context.json(
    await orchestrator.createSchedule(request, computeNextRunAt(request))
  );
});
app.patch("/api/orchestrator/schedules/:scheduleId", async (context) => {
  const request = orchestratorScheduleUpdateSchema.parse(
    await context.req.json()
  );
  return context.json(
    await orchestrator.updateSchedule(
      context.req.param("scheduleId"),
      request,
      computeNextRunAt(request)
    )
  );
});
app.delete("/api/orchestrator/schedules/:scheduleId", async (context) => {
  await orchestrator.deleteSchedule(context.req.param("scheduleId"));
  return context.json({ ok: true });
});
app.get("/api/orchestrator/sessions/:sessionId/stream", async (context) => {
  return streamOrchestratorTerminal(context, context.req.param("sessionId"));
});
app.get("/", async (context) => serveWebRequest(context, "/"));
app.get("/*", async (context) => serveWebRequest(context, context.req.path));
serve({ fetch: app.fetch, port });
scheduleService.start();
console.log(
  `coding-agent-orchestrator runtime listening on http://localhost:${port}`
);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    scheduleService.stop();
    process.exit(0);
  });
}
async function streamOrchestratorTerminal(context, sessionId) {
  const initialSession = await orchestrator.getSession(sessionId);
  const { incoming, outgoing } = context.env;
  let closed = false;
  let busy = false;
  let offset = Number.parseInt(context.req.query("offset") ?? "0", 10);
  if (!Number.isFinite(offset) || offset < 0) {
    offset = 0;
  }
  let lastSessionSignal = buildSessionSignal(initialSession);
  const sendEvent = (event, data) => {
    if (closed) {
      return;
    }
    outgoing.write(`event: ${event}
`);
    outgoing.write(`data: ${JSON.stringify(data)}

`);
  };
  outgoing.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-store, no-cache, no-transform",
    connection: "keep-alive"
  });
  outgoing.write("retry: 1000\n\n");
  sendEvent("session", initialSession);
  if (offset === 0 && initialSession.terminalTail) {
    offset = Math.max(
      0,
      initialSession.logSize - Buffer.byteLength(initialSession.terminalTail)
    );
    sendEvent("output", {
      chunk: initialSession.terminalTail,
      nextOffset: initialSession.logSize
    });
  }
  const tick = async () => {
    if (closed || busy) {
      return;
    }
    busy = true;
    try {
      const chunk = await orchestrator.readTerminalChunk(sessionId, offset);
      if (chunk.chunk) {
        offset = chunk.nextOffset;
        sendEvent("output", chunk);
      }
      const session = await orchestrator.getSession(sessionId);
      const nextSessionSignal = buildSessionSignal(session);
      if (nextSessionSignal !== lastSessionSignal) {
        lastSessionSignal = nextSessionSignal;
        sendEvent("session", session);
      }
      sendEvent("heartbeat", {
        offset,
        status: session.status
      });
    } catch (error) {
      sendEvent("error", {
        message: error instanceof Error ? error.message : "Unknown stream error"
      });
      cleanup();
    } finally {
      busy = false;
    }
  };
  const interval = setInterval(() => {
    void tick();
  }, 1e3);
  const cleanup = () => {
    if (closed) {
      return;
    }
    closed = true;
    clearInterval(interval);
    outgoing.end();
  };
  incoming.on("close", cleanup);
  return RESPONSE_ALREADY_SENT;
}
function buildSessionSignal(session) {
  return JSON.stringify({
    updatedAt: session.updatedAt,
    status: session.status,
    activeJobId: session.activeJobId,
    lastJobId: session.lastJobId
  });
}
async function serveWebRequest(context, requestPath) {
  if (requestPath.startsWith("/api/")) {
    return context.notFound();
  }
  const assetPath = resolveWebAssetPath(requestPath);
  if (assetPath) {
    try {
      return await serveWebFile(context, assetPath);
    } catch (error) {
      if (!isNodeError(error) || error.code !== "ENOENT") {
        throw error;
      }
      if (path2.extname(requestPath)) {
        return context.notFound();
      }
    }
  }
  try {
    return await serveWebFile(context, webDistIndex);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return context.json({
        name: "coding-agent-orchestrator runtime",
        message: "Run the web app separately with `pnpm dev:web` or build it with `pnpm --filter @coding-agent-orchestrator/web build`."
      });
    }
    throw error;
  }
}
function resolveWebAssetPath(requestPath) {
  const normalizedPath = requestPath === "/" ? "/index.html" : path2.posix.normalize(requestPath);
  const resolvedPath = path2.resolve(webDistRoot, `.${normalizedPath}`);
  return resolvedPath.startsWith(webDistRoot) ? resolvedPath : void 0;
}
async function serveWebFile(context, filePath) {
  const body = await fs2.readFile(filePath);
  return context.body(body, 200, {
    "cache-control": getWebCacheControl(filePath),
    "content-type": getContentType(filePath)
  });
}
function getContentType(filePath) {
  switch (path2.extname(filePath)) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    case ".ico":
      return "image/x-icon";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    case ".webmanifest":
      return "application/manifest+json; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}
function getWebCacheControl(filePath) {
  const normalizedPath = filePath.split(path2.sep).join("/");
  const basename = path2.basename(normalizedPath);
  if (normalizedPath.endsWith("/index.html") || normalizedPath.endsWith("/manifest.webmanifest") || normalizedPath.endsWith("/sw.js")) {
    return "no-cache";
  }
  if (normalizedPath.includes("/assets/") && /-[A-Za-z0-9_-]{8,}\.[^.]+$/.test(basename)) {
    return "public, max-age=31536000, immutable";
  }
  return "public, max-age=86400";
}
function isNodeError(error) {
  return error instanceof Error && "code" in error;
}
