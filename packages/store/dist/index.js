import {
  compactTimestamp,
  displayTimestamp,
  ensureTrailingNewline,
  firstParagraph,
  isoFromCompactTimestamp,
  normalizeAgentId,
  pathExists,
  readDirNames,
  readOptionalFile,
  slugify,
  toPosixRelative,
  walkFiles
} from "./chunk-H7IVPLAV.js";

// src/orchestrator.ts
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import {
  attachmentUploadSchema,
  copilotCustomAgentSchema,
  DEFAULT_CHAT_MODEL,
  DEFAULT_ORCHESTRATOR_CLI_PROVIDER,
  orchestratorJobSchema,
  orchestratorScheduleSchema,
  orchestratorSessionSchema,
  orchestratorSessionSummarySchema,
  premiumUsageTotalsSchema,
  storedAttachmentSchema
} from "@coding-agent-orchestrator/shared";
import matter from "gray-matter";
var ORCHESTRATOR_AGENT_ID = "copilot-orchestrator";
var IMPLEMENTATION_ORCHESTRATOR_CUSTOM_AGENT_ID = "implementation-orchestrator";
var DEFAULT_ORCHESTRATOR_CUSTOM_AGENT_IDS = [
  IMPLEMENTATION_ORCHESTRATOR_CUSTOM_AGENT_ID
];
var ORCHESTRATOR_STATE_FILENAME = "ORCHESTRATOR.json";
var ORCHESTRATOR_JOB_FILENAME = "JOB.json";
var ORCHESTRATOR_JOB_DONE_FILENAME = "DONE.json";
var ORCHESTRATOR_TERMINAL_LOG = "terminal/pane.log";
var ORCHESTRATOR_JOBS_DIRECTORY = "delegations";
var ORCHESTRATOR_SCHEDULES_DIRECTORY = "schedules";
var ORCHESTRATOR_SCHEDULE_FILENAME = "SCHEDULE.json";
var ORCHESTRATOR_SESSION_HEADER = "# Orchestrator Session: ";
var ORCHESTRATOR_TERMINAL_LINE_LIMIT = 2e3;
var ORCHESTRATOR_SESSION_TAIL_LINE_LIMIT = 200;
function sessionIdFromTitle(title, timestamp) {
  const date = timestamp.slice(0, 10);
  return `${date}-${slugify(title) || "orchestrator-session"}`;
}
var storedOrchestratorSessionStateSchema = orchestratorSessionSummarySchema.omit({
  sessionDirectory: true,
  manifestPath: true
});
async function listOrchestratorSessions(workspace) {
  const historyRoot = orchestratorHistoryRoot(workspace);
  if (!await pathExists(historyRoot)) {
    return [];
  }
  const stateFiles = (await walkFiles(historyRoot)).filter(
    (filePath) => path.basename(filePath) === ORCHESTRATOR_STATE_FILENAME
  );
  const sessions = await Promise.all(
    stateFiles.map(
      (filePath) => readOrchestratorSessionSummaryFromState(workspace, filePath)
    )
  );
  return sessions.sort(
    (left, right) => right.updatedAt.localeCompare(left.updatedAt)
  );
}
async function getOrchestratorSession(workspace, sessionId) {
  const statePath = await findOrchestratorStatePath(workspace, sessionId);
  if (!statePath) {
    throw new Error(`Orchestrator session not found: ${sessionId}`);
  }
  const summary = await readOrchestratorSessionSummaryFromState(
    workspace,
    statePath
  );
  const sessionDirectory = path.dirname(statePath);
  const jobs = await listOrchestratorJobs(sessionDirectory);
  const { content, size } = await readTerminalTail(sessionDirectory);
  return orchestratorSessionSchema.parse({
    ...summary,
    jobs,
    terminalTail: content,
    logSize: size
  });
}
async function createOrchestratorSession(workspace, input) {
  const startedAt = input.startedAt ?? (/* @__PURE__ */ new Date()).toISOString();
  const title = input.title?.trim() || input.projectPurpose.trim() || path.basename(input.projectPath) || "Orchestrator session";
  const sessionId = input.sessionId ?? sessionIdFromTitle(title, startedAt);
  const existingState = await findOrchestratorStatePath(workspace, sessionId);
  if (existingState) {
    return readOrchestratorSessionSummaryFromState(workspace, existingState);
  }
  const sessionDirectory = resolveOrchestratorSessionDirectory(
    workspace,
    sessionId,
    startedAt
  );
  await fs.mkdir(path.join(sessionDirectory, "terminal"), { recursive: true });
  await fs.mkdir(path.join(sessionDirectory, ORCHESTRATOR_JOBS_DIRECTORY), {
    recursive: true
  });
  const state = {
    sessionId,
    agentId: ORCHESTRATOR_AGENT_ID,
    title,
    startedAt,
    updatedAt: startedAt,
    summary: input.projectPurpose.trim(),
    projectPath: path.resolve(input.projectPath),
    projectPurpose: input.projectPurpose.trim(),
    cliProvider: input.cliProvider?.trim() || DEFAULT_ORCHESTRATOR_CLI_PROVIDER,
    model: input.model?.trim() || DEFAULT_CHAT_MODEL,
    availableCustomAgents: copilotCustomAgentSchema.array().parse(input.availableCustomAgents ?? []),
    selectedCustomAgentId: input.selectedCustomAgentId,
    executionMode: input.executionMode ?? "standard",
    tmuxSessionName: input.tmuxSessionName,
    tmuxWindowName: input.tmuxWindowName,
    tmuxPaneId: input.tmuxPaneId,
    status: input.status ?? "idle",
    premiumUsage: premiumUsageTotalsSchema.parse({})
  };
  await writeOrchestratorSessionManifest(sessionDirectory, state);
  await writeOrchestratorSessionState(sessionDirectory, state);
  return readOrchestratorSessionSummaryFromState(
    workspace,
    path.join(sessionDirectory, ORCHESTRATOR_STATE_FILENAME)
  );
}
async function updateOrchestratorSession(workspace, sessionId, updates) {
  const statePath = await findOrchestratorStatePath(workspace, sessionId);
  if (!statePath) {
    throw new Error(`Cannot update missing orchestrator session: ${sessionId}`);
  }
  const sessionDirectory = path.dirname(statePath);
  const currentState = await readStoredOrchestratorSessionState(statePath);
  const nextState = {
    ...currentState,
    ...updates,
    updatedAt: updates.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString()
  };
  await writeOrchestratorSessionManifest(sessionDirectory, nextState);
  await writeOrchestratorSessionState(sessionDirectory, nextState);
  return readOrchestratorSessionSummaryFromState(workspace, statePath);
}
async function deleteOrchestratorSession(workspace, sessionId) {
  const statePath = await findOrchestratorStatePath(workspace, sessionId);
  if (!statePath) {
    throw new Error(`Cannot delete missing orchestrator session: ${sessionId}`);
  }
  await fs.rm(path.dirname(statePath), { recursive: true, force: true });
}
async function createOrchestratorJob(workspace, sessionId, input) {
  const statePath = await findOrchestratorStatePath(workspace, sessionId);
  if (!statePath) {
    throw new Error(`Cannot add a job to missing session: ${sessionId}`);
  }
  const sessionDirectory = path.dirname(statePath);
  const submittedAt = input.submittedAt ?? (/* @__PURE__ */ new Date()).toISOString();
  const jobId = `${compactTimestamp(submittedAt)}-${randomUUID().replace(/-/g, "").slice(0, 8)}`;
  const jobDirectory = path.join(
    sessionDirectory,
    ORCHESTRATOR_JOBS_DIRECTORY,
    jobId
  );
  await fs.mkdir(jobDirectory, { recursive: true });
  const attachment = input.attachment ? await writeOrchestratorJobAttachment(
    workspace,
    jobDirectory,
    input.attachment
  ) : void 0;
  const job = orchestratorJobSchema.parse({
    jobId,
    sessionId,
    scheduleId: input.scheduleId,
    prompt: input.prompt ?? "",
    promptPreview: input.promptPreview,
    promptMode: input.promptMode,
    promptPath: input.promptPath,
    outputPath: input.outputPath,
    attachment,
    customAgentId: input.customAgentId,
    premiumUsage: input.premiumUsage,
    status: "queued",
    submittedAt,
    jobDirectory
  });
  await writeOrchestratorJob(jobDirectory, job);
  return job;
}
async function updateOrchestratorJob(workspace, sessionId, jobId, updates) {
  const jobPath = await findOrchestratorJobPath(workspace, sessionId, jobId);
  if (!jobPath) {
    throw new Error(`Cannot update missing job ${jobId} for ${sessionId}`);
  }
  const jobDirectory = path.dirname(jobPath);
  const current = await readStoredOrchestratorJob(jobPath);
  const next = orchestratorJobSchema.parse({
    ...current,
    ...updates,
    jobDirectory
  });
  await writeOrchestratorJob(jobDirectory, next);
  return next;
}
async function deleteOrchestratorJob(workspace, sessionId, jobId) {
  const jobPath = await findOrchestratorJobPath(workspace, sessionId, jobId);
  if (!jobPath) {
    throw new Error(`Cannot delete missing job ${jobId} for ${sessionId}`);
  }
  await fs.rm(path.dirname(jobPath), { recursive: true, force: true });
}
async function writeOrchestratorJobCompletion(workspace, sessionId, jobId, completion) {
  const jobPath = await findOrchestratorJobPath(workspace, sessionId, jobId);
  if (!jobPath) {
    throw new Error(`Cannot finalize missing job ${jobId} for ${sessionId}`);
  }
  const jobDirectory = path.dirname(jobPath);
  await fs.writeFile(
    path.join(jobDirectory, ORCHESTRATOR_JOB_DONE_FILENAME),
    `${JSON.stringify(completion, null, 2)}
`,
    "utf8"
  );
}
async function listOrchestratorSchedules(workspace, options) {
  const schedulesRoot = orchestratorSchedulesRoot(workspace);
  const scheduleIds = await readDirNames(schedulesRoot);
  const schedules = await Promise.all(
    scheduleIds.map(
      (scheduleId) => getOrchestratorSchedule(workspace, scheduleId)
    )
  );
  const filtered = options?.sessionId ? schedules.filter((schedule) => schedule.sessionId === options.sessionId) : schedules;
  return filtered.sort(
    (left, right) => left.nextRunAt.localeCompare(right.nextRunAt)
  );
}
async function getOrchestratorSchedule(workspace, scheduleId) {
  const schedulePath = resolveOrchestratorSchedulePath(workspace, scheduleId);
  const raw = await readOptionalFile(schedulePath);
  if (!raw) {
    throw new Error(`Orchestrator schedule not found: ${scheduleId}`);
  }
  return orchestratorScheduleSchema.parse(JSON.parse(raw));
}
async function createOrchestratorSchedule(workspace, input) {
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const scheduleId = `${slugify(input.title)}-${randomUUID().replace(/-/g, "").slice(0, 8)}`;
  const schedule = orchestratorScheduleSchema.parse({
    scheduleId,
    sessionId: input.sessionId,
    title: input.title.trim(),
    prompt: input.prompt.trim(),
    frequency: input.frequency,
    timeOfDay: input.timeOfDay,
    timezone: input.timezone.trim(),
    dayOfWeek: input.dayOfWeek,
    dayOfMonth: input.dayOfMonth,
    customAgentId: input.customAgentId,
    emailTo: input.emailTo,
    enabled: input.enabled ?? true,
    createdAt,
    updatedAt: createdAt,
    nextRunAt: input.nextRunAt,
    totalRuns: 0,
    failedRuns: 0
  });
  await writeOrchestratorSchedule(workspace, schedule);
  return schedule;
}
async function updateOrchestratorSchedule(workspace, scheduleId, updates) {
  const current = await getOrchestratorSchedule(workspace, scheduleId);
  const next = orchestratorScheduleSchema.parse({
    ...current,
    ...updates,
    scheduleId: current.scheduleId,
    sessionId: updates.sessionId ?? current.sessionId,
    createdAt: current.createdAt,
    updatedAt: updates.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString()
  });
  await writeOrchestratorSchedule(workspace, next);
  return next;
}
async function deleteOrchestratorSchedule(workspace, scheduleId) {
  const scheduleDirectory = resolveOrchestratorScheduleDirectory(
    workspace,
    scheduleId
  );
  if (!await pathExists(scheduleDirectory)) {
    throw new Error(
      `Cannot delete missing orchestrator schedule: ${scheduleId}`
    );
  }
  await fs.rm(scheduleDirectory, { recursive: true, force: true });
}
async function readOrchestratorTerminalChunk(workspace, sessionId, offset) {
  const statePath = await findOrchestratorStatePath(workspace, sessionId);
  if (!statePath) {
    throw new Error(`Orchestrator session not found: ${sessionId}`);
  }
  const logPath = path.join(path.dirname(statePath), ORCHESTRATOR_TERMINAL_LOG);
  const raw = await fs.readFile(logPath).catch((error) => {
    if (error.code === "ENOENT") {
      return Buffer.alloc(0);
    }
    throw error;
  });
  const nextOffset = raw.length;
  if (offset >= nextOffset) {
    return { chunk: "", nextOffset };
  }
  return {
    chunk: raw.subarray(offset).toString("utf8"),
    nextOffset
  };
}
async function readOrchestratorTerminalHistoryChunk(workspace, sessionId, beforeOffset, maxLines = ORCHESTRATOR_TERMINAL_LINE_LIMIT) {
  const statePath = await findOrchestratorStatePath(workspace, sessionId);
  if (!statePath) {
    throw new Error(`Orchestrator session not found: ${sessionId}`);
  }
  const logPath = path.join(path.dirname(statePath), ORCHESTRATOR_TERMINAL_LOG);
  const raw = await fs.readFile(logPath).catch((error) => {
    if (error.code === "ENOENT") {
      return Buffer.alloc(0);
    }
    throw error;
  });
  return sliceTerminalRangeByLines(raw, beforeOffset, maxLines);
}
async function getOrchestratorTerminalSize(workspace, sessionId) {
  const statePath = await findOrchestratorStatePath(workspace, sessionId);
  if (!statePath) {
    throw new Error(`Orchestrator session not found: ${sessionId}`);
  }
  const logPath = path.join(path.dirname(statePath), ORCHESTRATOR_TERMINAL_LOG);
  try {
    const stat = await fs.stat(logPath);
    return stat.size;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return 0;
    }
    throw error;
  }
}
async function resetOrchestratorTerminalLog(workspace, sessionId) {
  const statePath = await findOrchestratorStatePath(workspace, sessionId);
  if (!statePath) {
    throw new Error(`Orchestrator session not found: ${sessionId}`);
  }
  const logPath = path.join(path.dirname(statePath), ORCHESTRATOR_TERMINAL_LOG);
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.writeFile(logPath, "", "utf8");
}
function toOrchestratorChatSummary(session) {
  return {
    sessionId: session.sessionId,
    agentId: session.agentId,
    title: session.title,
    startedAt: session.startedAt,
    summary: `${session.projectPurpose} \u2022 ${humanizeStatus(session.status)}`,
    manifestPath: session.manifestPath,
    turnCount: 0,
    lastTurnAt: session.updatedAt,
    premiumUsage: session.premiumUsage,
    completionStatus: session.status === "completed" || session.status === "failed" ? session.status : void 0
  };
}
function accumulatePremiumUsageTotals(current, usage) {
  if (!usage) {
    return current;
  }
  const normalizedCurrent = premiumUsageTotalsSchema.parse(current ?? {});
  return premiumUsageTotalsSchema.parse({
    chargedRequestCount: normalizedCurrent.chargedRequestCount + 1,
    premiumRequestUnits: normalizedCurrent.premiumRequestUnits + usage.premiumRequestUnits,
    lastRecordedAt: usage.recordedAt,
    lastModel: usage.model
  });
}
function orchestratorHistoryRoot(workspace) {
  return path.join(
    workspace.agentsRoot,
    normalizeAgentId(ORCHESTRATOR_AGENT_ID),
    "history"
  );
}
function orchestratorSchedulesRoot(workspace) {
  return path.join(
    workspace.agentsRoot,
    normalizeAgentId(ORCHESTRATOR_AGENT_ID),
    ORCHESTRATOR_SCHEDULES_DIRECTORY
  );
}
function buildOrchestratorWindowName(title, projectPath, sessionId) {
  const baseName = path.basename(projectPath) || "project";
  const suffix = sessionId.slice(-4);
  const label = `${slugify(baseName)}-${slugify(title)}-${suffix}`;
  return label.slice(0, 28);
}
async function discoverCopilotCustomAgents(projectPath) {
  const roots = [
    path.join(projectPath, ".github", "agents"),
    path.join(projectPath, "agents")
  ];
  const agentsById = /* @__PURE__ */ new Map();
  for (const root of roots) {
    const files = (await walkFiles(root)).filter(
      (filePath) => filePath.endsWith(".agent.md")
    );
    for (const filePath of files) {
      const relativePath = toPosixRelative(projectPath, filePath);
      const id = path.basename(filePath, ".agent.md");
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = matter(raw);
      const target = parsed.data.target;
      if (typeof target === "string" && target.trim().length > 0 && target !== "github-copilot") {
        continue;
      }
      const name = typeof parsed.data.name === "string" && parsed.data.name.trim().length > 0 ? parsed.data.name.trim() : id;
      const description = typeof parsed.data.description === "string" ? parsed.data.description.trim() : "";
      agentsById.set(
        id,
        copilotCustomAgentSchema.parse({
          id,
          name,
          description,
          path: relativePath
        })
      );
    }
  }
  return [...agentsById.values()].sort(
    (left, right) => left.name.localeCompare(right.name)
  );
}
function getDefaultOrchestratorCustomAgentId(agents) {
  return DEFAULT_ORCHESTRATOR_CUSTOM_AGENT_IDS.find(
    (agentId) => agents.some((agent) => agent.id === agentId)
  );
}
async function writeOrchestratorJobAttachment(workspace, jobDirectory, attachment) {
  const normalized = attachmentUploadSchema.parse(attachment);
  const attachmentDirectory = path.join(jobDirectory, "attachments");
  await fs.mkdir(attachmentDirectory, { recursive: true });
  const normalizedFilename = buildAttachmentFilename(normalized.name);
  const attachmentPath = path.join(attachmentDirectory, normalizedFilename);
  const buffer = Buffer.from(normalized.base64Data, "base64");
  await fs.writeFile(attachmentPath, buffer);
  return storedAttachmentSchema.parse({
    attachmentId: randomUUID().replace(/-/g, ""),
    name: normalized.name,
    contentType: normalized.contentType,
    size: buffer.length,
    mediaType: classifyAttachmentMediaType(normalized.contentType),
    relativePath: toPosixRelative(workspace.storeRoot, attachmentPath)
  });
}
function buildAttachmentFilename(name) {
  const extension = path.extname(name).toLowerCase();
  const stem = path.basename(name, extension);
  const normalizedStem = slugify(stem) || "attachment";
  return `${normalizedStem}${extension}`;
}
function classifyAttachmentMediaType(contentType) {
  if (contentType.startsWith("image/")) {
    return "image";
  }
  if (contentType.startsWith("text/") || contentType.includes("json") || contentType.includes("xml")) {
    return "text";
  }
  return "binary";
}
function resolveOrchestratorSessionDirectory(workspace, sessionId, startedAt) {
  return path.join(
    orchestratorHistoryRoot(workspace),
    startedAt.slice(0, 7),
    sessionId
  );
}
async function readOrchestratorSessionSummaryFromState(workspace, statePath) {
  const state = await readStoredOrchestratorSessionState(statePath);
  const sessionDirectory = path.dirname(statePath);
  return orchestratorSessionSummarySchema.parse({
    ...state,
    sessionDirectory,
    manifestPath: toPosixRelative(
      workspace.storeRoot,
      path.join(sessionDirectory, "SESSION.md")
    )
  });
}
async function readStoredOrchestratorSessionState(statePath) {
  const raw = await fs.readFile(statePath, "utf8");
  return storedOrchestratorSessionStateSchema.parse(JSON.parse(raw));
}
async function writeOrchestratorSessionState(sessionDirectory, state) {
  await fs.writeFile(
    path.join(sessionDirectory, ORCHESTRATOR_STATE_FILENAME),
    `${JSON.stringify(state, null, 2)}
`,
    "utf8"
  );
}
async function writeOrchestratorSessionManifest(sessionDirectory, state) {
  const manifest = [
    `${ORCHESTRATOR_SESSION_HEADER}${state.title}`,
    `Session ID: ${state.sessionId}`,
    `Agent: ${state.agentId}`,
    `Started: ${state.startedAt}`,
    `Project Path: ${state.projectPath}`,
    `Project Purpose: ${state.projectPurpose}`,
    `CLI Provider: ${state.cliProvider}`,
    `Model: ${state.model}`,
    `Selected Custom Agent: ${state.selectedCustomAgentId ?? "none"}`,
    `Execution Mode: ${state.executionMode}`,
    `Available Custom Agents: ${state.availableCustomAgents.length}`,
    `Tmux Session: ${state.tmuxSessionName}`,
    `Tmux Window: ${state.tmuxWindowName}`,
    `Tmux Pane: ${state.tmuxPaneId}`,
    "",
    "## Summary",
    "",
    state.summary || state.projectPurpose,
    "",
    "## Copilot Custom Agents",
    "",
    state.availableCustomAgents.length > 0 ? state.availableCustomAgents.map((agent) => {
      const selected = agent.id === state.selectedCustomAgentId ? " (selected)" : "";
      const description = agent.description ? ` - ${agent.description}` : "";
      return `- ${agent.id}${selected} \u2014 ${agent.path}${description}`;
    }).join("\n") : "No Copilot custom agents were discovered in the project path."
  ].join("\n");
  await fs.writeFile(
    path.join(sessionDirectory, "SESSION.md"),
    ensureTrailingNewline(manifest),
    "utf8"
  );
}
async function listOrchestratorJobs(sessionDirectory) {
  const jobsRoot = path.join(sessionDirectory, ORCHESTRATOR_JOBS_DIRECTORY);
  if (!await pathExists(jobsRoot)) {
    return [];
  }
  const jobFiles = (await walkFiles(jobsRoot)).filter(
    (filePath) => path.basename(filePath) === ORCHESTRATOR_JOB_FILENAME
  );
  const jobs = await Promise.all(
    jobFiles.map((filePath) => readOrchestratorJob(filePath))
  );
  return jobs.sort(
    (left, right) => right.submittedAt.localeCompare(left.submittedAt)
  );
}
async function readOrchestratorJob(jobPath) {
  const jobDirectory = path.dirname(jobPath);
  const stored = await readStoredOrchestratorJob(jobPath);
  const completion = await readOrchestratorJobCompletion(jobDirectory);
  if (!completion) {
    return orchestratorJobSchema.parse({
      ...stored,
      jobDirectory
    });
  }
  return orchestratorJobSchema.parse({
    ...stored,
    jobDirectory,
    status: completion.exitCode === 0 ? "completed" : "failed",
    completedAt: completion.completedAt,
    exitCode: completion.exitCode
  });
}
async function readStoredOrchestratorJob(jobPath) {
  const raw = await fs.readFile(jobPath, "utf8");
  return JSON.parse(raw);
}
async function writeOrchestratorJob(jobDirectory, job) {
  await fs.writeFile(
    path.join(jobDirectory, ORCHESTRATOR_JOB_FILENAME),
    `${JSON.stringify(job, null, 2)}
`,
    "utf8"
  );
}
async function readOrchestratorJobCompletion(jobDirectory) {
  const raw = await readOptionalFile(
    path.join(jobDirectory, ORCHESTRATOR_JOB_DONE_FILENAME)
  );
  if (!raw) {
    return void 0;
  }
  return JSON.parse(raw);
}
async function writeOrchestratorSchedule(workspace, schedule) {
  const scheduleDirectory = resolveOrchestratorScheduleDirectory(
    workspace,
    schedule.scheduleId
  );
  await fs.mkdir(scheduleDirectory, { recursive: true });
  await fs.writeFile(
    resolveOrchestratorSchedulePath(workspace, schedule.scheduleId),
    `${JSON.stringify(schedule, null, 2)}
`,
    "utf8"
  );
}
async function readTerminalTail(sessionDirectory, maxLines = ORCHESTRATOR_SESSION_TAIL_LINE_LIMIT) {
  const logPath = path.join(sessionDirectory, ORCHESTRATOR_TERMINAL_LOG);
  try {
    const raw = await fs.readFile(logPath);
    const tail = sliceTerminalRangeByLines(raw, raw.length, maxLines);
    return {
      content: tail.chunk,
      size: raw.length
    };
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return { content: "", size: 0 };
    }
    throw error;
  }
}
function sliceTerminalRangeByLines(raw, endOffset, maxLines) {
  const normalizedMaxLines = Math.max(1, Math.floor(maxLines));
  const clampedEndOffset = Math.max(0, Math.min(raw.length, endOffset));
  if (clampedEndOffset === 0) {
    return {
      chunk: "",
      startOffset: 0,
      endOffset: 0,
      hasMoreBefore: false,
      lineCount: 0
    };
  }
  const effectiveEndOffset = raw[clampedEndOffset - 1] === 10 ? clampedEndOffset - 1 : clampedEndOffset;
  let newlineCount = 0;
  let startOffset = 0;
  for (let index = effectiveEndOffset - 1; index >= 0; index -= 1) {
    if (raw[index] !== 10) {
      continue;
    }
    newlineCount += 1;
    if (newlineCount === normalizedMaxLines) {
      startOffset = index + 1;
      break;
    }
  }
  const chunk = raw.subarray(startOffset, clampedEndOffset).toString("utf8");
  return {
    chunk,
    startOffset,
    endOffset: clampedEndOffset,
    hasMoreBefore: startOffset > 0,
    lineCount: countTerminalLines(chunk)
  };
}
function countTerminalLines(content) {
  if (!content) {
    return 0;
  }
  const normalized = content.endsWith("\n") ? content.slice(0, -1) : content;
  if (normalized.length === 0) {
    return 0;
  }
  return normalized.split("\n").length;
}
async function findOrchestratorStatePath(workspace, sessionId) {
  const historyRoot = orchestratorHistoryRoot(workspace);
  if (!await pathExists(historyRoot)) {
    return void 0;
  }
  const stateFiles = (await walkFiles(historyRoot)).filter(
    (filePath) => filePath.endsWith(
      `${path.sep}${sessionId}${path.sep}${ORCHESTRATOR_STATE_FILENAME}`
    )
  );
  if (stateFiles.length > 1) {
    throw new Error(`Multiple orchestrator sessions matched ${sessionId}.`);
  }
  return stateFiles[0];
}
async function findOrchestratorJobPath(workspace, sessionId, jobId) {
  const statePath = await findOrchestratorStatePath(workspace, sessionId);
  if (!statePath) {
    return void 0;
  }
  const jobPath = path.join(
    path.dirname(statePath),
    ORCHESTRATOR_JOBS_DIRECTORY,
    jobId,
    ORCHESTRATOR_JOB_FILENAME
  );
  return await pathExists(jobPath) ? jobPath : void 0;
}
function resolveOrchestratorScheduleDirectory(workspace, scheduleId) {
  return path.join(orchestratorSchedulesRoot(workspace), scheduleId);
}
function resolveOrchestratorSchedulePath(workspace, scheduleId) {
  return path.join(
    resolveOrchestratorScheduleDirectory(workspace, scheduleId),
    ORCHESTRATOR_SCHEDULE_FILENAME
  );
}
function humanizeStatus(status) {
  switch (status) {
    case "idle":
      return "Idle";
    case "running":
      return "Running";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "missing":
      return "Missing";
  }
  const unreachableStatus = status;
  return unreachableStatus;
}
function isNodeError(error) {
  return error instanceof Error;
}

// src/workspace.ts
import { mkdir } from "fs/promises";
import os from "os";
import path2 from "path";
async function resolveWorkspace(options = {}) {
  const storeRoot = await resolveStoreRoot(options.storeRoot);
  const copilotConfigDir = path2.resolve(
    options.copilotConfigDir ?? path2.join(os.homedir(), ".copilot")
  );
  return {
    storeRoot,
    agentsRoot: path2.join(storeRoot, "agents"),
    memoryRoot: path2.join(storeRoot, "memory"),
    skillsRoot: path2.join(storeRoot, "skills"),
    copilotConfigDir,
    copilotSkillsRoot: path2.join(copilotConfigDir, "skills")
  };
}
async function summarizeWorkspace(workspace) {
  const { pathExists: pathExists2 } = await import("./utils-YXWUHYDO.js");
  const { readDirNames: readDirNames2 } = await import("./utils-YXWUHYDO.js");
  const agentNames = await pathExists2(workspace.agentsRoot) ? await readDirNames2(workspace.agentsRoot) : [];
  return {
    storeRoot: workspace.storeRoot,
    copilotConfigDir: workspace.copilotConfigDir,
    storeSkillDirectory: workspace.skillsRoot,
    copilotSkillDirectory: workspace.copilotSkillsRoot,
    agentCount: agentNames.filter((name) => name !== "default").length
  };
}
async function resolveStoreRoot(explicitRoot) {
  const configuredRoot = [
    explicitRoot,
    process.env.CODING_AGENT_ORCHESTRATOR_STORE_ROOT,
    path2.join(os.homedir(), ".local", "share", "coding-agent-orchestrator")
  ].find((candidate) => Boolean(candidate));
  const storeRoot = path2.resolve(
    configuredRoot ?? path2.join(os.homedir(), ".local", "share", "coding-agent-orchestrator")
  );
  await Promise.all([
    mkdir(path2.join(storeRoot, "agents"), { recursive: true }),
    mkdir(path2.join(storeRoot, "memory"), { recursive: true }),
    mkdir(path2.join(storeRoot, "skills"), { recursive: true })
  ]);
  return storeRoot;
}
export {
  IMPLEMENTATION_ORCHESTRATOR_CUSTOM_AGENT_ID,
  ORCHESTRATOR_AGENT_ID,
  ORCHESTRATOR_SESSION_TAIL_LINE_LIMIT,
  ORCHESTRATOR_TERMINAL_LINE_LIMIT,
  accumulatePremiumUsageTotals,
  buildOrchestratorWindowName,
  compactTimestamp,
  createOrchestratorJob,
  createOrchestratorSchedule,
  createOrchestratorSession,
  deleteOrchestratorJob,
  deleteOrchestratorSchedule,
  deleteOrchestratorSession,
  discoverCopilotCustomAgents,
  displayTimestamp,
  ensureTrailingNewline,
  firstParagraph,
  getDefaultOrchestratorCustomAgentId,
  getOrchestratorSchedule,
  getOrchestratorSession,
  getOrchestratorTerminalSize,
  isoFromCompactTimestamp,
  listOrchestratorSchedules,
  listOrchestratorSessions,
  normalizeAgentId,
  orchestratorHistoryRoot,
  orchestratorSchedulesRoot,
  pathExists,
  readDirNames,
  readOptionalFile,
  readOrchestratorTerminalChunk,
  readOrchestratorTerminalHistoryChunk,
  resetOrchestratorTerminalLog,
  resolveWorkspace,
  slugify,
  summarizeWorkspace,
  toOrchestratorChatSummary,
  toPosixRelative,
  updateOrchestratorJob,
  updateOrchestratorSchedule,
  updateOrchestratorSession,
  walkFiles,
  writeOrchestratorJobCompletion
};
