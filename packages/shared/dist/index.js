// src/index.ts
import { z } from "zod";
var DEFAULT_CHAT_MODEL = "gpt-5-mini";
var DEFAULT_CHAT_PROVIDER = "copilot";
var DEFAULT_ORCHESTRATOR_CLI_PROVIDER = "copilot";
var chatProviderCapabilitiesSchema = z.object({
  supportsReasoningEffort: z.boolean().default(false),
  supportsSkills: z.boolean().default(false),
  supportsMcpServers: z.boolean().default(false)
});
var chatProviderDescriptorSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  capabilities: chatProviderCapabilitiesSchema
});
var orchestratorCliProviderCapabilitiesSchema = z.object({
  supportsCustomAgents: z.boolean().default(false),
  supportsExecutionMode: z.boolean().default(false)
});
var orchestratorCliProviderDescriptorSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  capabilities: orchestratorCliProviderCapabilitiesSchema
});
var reasoningEffortSchema = z.enum(["low", "medium", "high", "xhigh"]);
var localMcpServerSchema = z.object({
  type: z.enum(["local", "stdio"]).optional(),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  cwd: z.string().optional(),
  env: z.record(z.string(), z.string()).default({}),
  tools: z.array(z.string()).default(["*"]),
  timeout: z.number().int().positive().optional()
}).transform((value) => ({
  ...value,
  type: value.type ?? "stdio"
}));
var remoteMcpServerSchema = z.object({
  type: z.enum(["http", "sse"]).optional(),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).default({}),
  tools: z.array(z.string()).default(["*"]),
  timeout: z.number().int().positive().optional()
}).transform((value) => ({
  ...value,
  type: value.type ?? "http"
}));
var mcpServerConfigSchema = z.union([
  localMcpServerSchema,
  remoteMcpServerSchema
]);
var skillScopeSchema = z.enum([
  "copilot-global",
  "store-global",
  "agent-local"
]);
var skillDescriptorSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  scope: skillScopeSchema,
  path: z.string().min(1),
  sourceRoot: z.string().min(1)
});
var chatRuntimeConfigSchema = z.object({
  provider: z.string().min(1).default(DEFAULT_CHAT_PROVIDER),
  model: z.string().min(1).default(DEFAULT_CHAT_MODEL),
  reasoningEffort: reasoningEffortSchema.optional(),
  lmStudioEnableThinking: z.boolean().optional(),
  disabledSkills: z.array(z.string()).default([]),
  mcpServers: z.record(z.string(), mcpServerConfigSchema).default({})
});
var partialChatRuntimeConfigSchema = z.object({
  provider: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  reasoningEffort: reasoningEffortSchema.optional(),
  lmStudioEnableThinking: z.boolean().optional(),
  disabledSkills: z.array(z.string()).optional(),
  mcpServers: z.record(z.string(), mcpServerConfigSchema).optional()
});
function createDefaultChatRuntimeConfig() {
  return chatRuntimeConfigSchema.parse({});
}
function mergeChatRuntimeConfigs(baseConfig, overrideConfig) {
  const base = chatRuntimeConfigSchema.parse(baseConfig ?? {});
  const override = partialChatRuntimeConfigSchema.parse(overrideConfig ?? {});
  return chatRuntimeConfigSchema.parse({
    ...base,
    ...override,
    disabledSkills: override.disabledSkills ?? base.disabledSkills,
    mcpServers: override.mcpServers ? {
      ...base.mcpServers,
      ...override.mcpServers
    } : base.mcpServers
  });
}
function normalizeQuotaCounter(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return value;
  }
  return Math.max(0, value);
}
function normalizeQuotaRemainingPercentage(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return value;
  }
  const normalized = value > 1 ? value <= 100 ? value / 100 : 1 : Math.max(0, value);
  return Math.min(Math.max(normalized, 0), 1);
}
var quotaCounterSchema = z.preprocess(
  normalizeQuotaCounter,
  z.number().nonnegative()
);
var quotaRemainingPercentageSchema = z.preprocess(
  normalizeQuotaRemainingPercentage,
  z.number().min(0).max(1)
);
var llmQuotaSnapshotSchema = z.object({
  isUnlimitedEntitlement: z.boolean(),
  entitlementRequests: quotaCounterSchema,
  usedRequests: quotaCounterSchema,
  usageAllowedWithExhaustedQuota: z.boolean(),
  overage: quotaCounterSchema,
  overageAllowedWithExhaustedQuota: z.boolean(),
  remainingPercentage: quotaRemainingPercentageSchema,
  resetDate: z.string().min(1).optional()
});
var llmTokenDetailSchema = z.object({
  batchSize: z.number().nonnegative(),
  costPerBatch: z.number().nonnegative(),
  tokenCount: z.number().nonnegative(),
  tokenType: z.string().min(1)
});
var llmRequestStatsSchema = z.object({
  recordedAt: z.string().min(1),
  model: z.string().min(1),
  requestCount: z.number().int().positive().default(1),
  premiumRequestUnits: z.number().nonnegative().default(0),
  inputTokens: z.number().int().nonnegative().default(0),
  outputTokens: z.number().int().nonnegative().default(0),
  cacheReadTokens: z.number().int().nonnegative().default(0),
  cacheWriteTokens: z.number().int().nonnegative().default(0),
  cost: z.number().nonnegative().default(0),
  durationMs: z.number().nonnegative().default(0),
  reasoningEffort: z.string().min(1).optional(),
  initiator: z.string().min(1).optional(),
  interactionId: z.string().min(1).optional(),
  apiCallId: z.string().min(1).optional(),
  providerCallId: z.string().min(1).optional(),
  parentToolCallId: z.string().min(1).optional(),
  quotaSnapshots: z.record(z.string(), llmQuotaSnapshotSchema).default({}),
  tokenDetails: z.array(llmTokenDetailSchema).default([]),
  totalNanoAiu: z.number().nonnegative().optional()
});
var llmSessionStatsSchema = z.object({
  requestCount: z.number().int().nonnegative().default(0),
  premiumRequestUnits: z.number().nonnegative().default(0),
  inputTokens: z.number().int().nonnegative().default(0),
  outputTokens: z.number().int().nonnegative().default(0),
  cacheReadTokens: z.number().int().nonnegative().default(0),
  cacheWriteTokens: z.number().int().nonnegative().default(0),
  totalCost: z.number().nonnegative().default(0),
  totalDurationMs: z.number().nonnegative().default(0),
  totalNanoAiu: z.number().nonnegative().default(0),
  lastRecordedAt: z.string().min(1).optional(),
  lastModel: z.string().min(1).optional(),
  lastReasoningEffort: z.string().min(1).optional(),
  quotaSnapshots: z.record(z.string(), llmQuotaSnapshotSchema).default({})
});
var premiumUsageSchema = z.object({
  source: z.enum(["sdk", "tmux-estimate"]),
  model: z.string().min(1),
  premiumRequestUnits: z.number().nonnegative().default(0),
  billingMultiplier: z.number().nonnegative().optional(),
  recordedAt: z.string().min(1)
});
var premiumUsageTotalsSchema = z.object({
  chargedRequestCount: z.number().int().nonnegative().default(0),
  premiumRequestUnits: z.number().nonnegative().default(0),
  lastRecordedAt: z.string().min(1).optional(),
  lastModel: z.string().min(1).optional()
});
var modelDescriptorSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  runtimeProvider: z.string().min(1).default(DEFAULT_CHAT_PROVIDER),
  provider: z.string().optional(),
  premiumRequestMultiplier: z.number().nonnegative().optional(),
  supportedReasoningEfforts: z.array(reasoningEffortSchema).default([]),
  defaultReasoningEffort: reasoningEffortSchema.optional()
});
var modelCatalogSchema = z.object({
  defaultProvider: z.string().min(1).default(DEFAULT_CHAT_PROVIDER),
  providers: z.array(chatProviderDescriptorSchema).default([]),
  models: z.array(modelDescriptorSchema).default([])
});
var agentKindSchema = z.enum(["chat", "orchestrator", "schedule"]);
var agentSummarySchema = z.object({
  id: z.string().min(1),
  kind: agentKindSchema.default("chat"),
  title: z.string().min(1),
  description: z.string().min(1),
  combinedPrompt: z.string().min(1),
  agentPath: z.string().min(1),
  defaultSoulPath: z.string().min(1),
  soulPath: z.string().optional(),
  historyRoot: z.string().min(1),
  workingMemoryRoot: z.string().min(1),
  skillRoot: z.string().min(1),
  skillNames: z.array(z.string()),
  sessionCount: z.number().int().nonnegative(),
  runtimeConfig: chatRuntimeConfigSchema.optional()
});
var senderSchema = z.enum(["user", "assistant", "system", "tool"]);
var attachmentMediaTypeSchema = z.enum(["image", "text", "binary"]);
var attachmentUploadSchema = z.object({
  name: z.string().trim().min(1),
  contentType: z.string().trim().min(1),
  size: z.number().int().nonnegative(),
  base64Data: z.string().min(1)
});
var storedAttachmentSchema = z.object({
  attachmentId: z.string().min(1),
  name: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().nonnegative(),
  mediaType: attachmentMediaTypeSchema,
  relativePath: z.string().min(1)
});
var chatTurnSchema = z.object({
  messageId: z.string().min(1),
  sender: senderSchema,
  createdAt: z.string().min(1),
  bodyMarkdown: z.string(),
  thinkingMarkdown: z.string().optional(),
  relativePath: z.string().min(1),
  attachment: storedAttachmentSchema.optional()
});
var chatSessionSummarySchema = z.object({
  sessionId: z.string().min(1),
  agentId: z.string().min(1),
  title: z.string().min(1),
  startedAt: z.string().min(1),
  summary: z.string(),
  manifestPath: z.string().min(1),
  turnCount: z.number().int().nonnegative(),
  lastTurnAt: z.string().optional(),
  runtimeConfig: chatRuntimeConfigSchema.optional(),
  llmStats: llmSessionStatsSchema.optional(),
  premiumUsage: premiumUsageTotalsSchema.optional(),
  completionStatus: z.enum(["completed", "failed"]).optional()
});
var chatSessionSchema = chatSessionSummarySchema.extend({
  turns: z.array(chatTurnSchema)
});
var memoryEntrySchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1),
  path: z.string().min(1),
  scope: z.enum(["shared", "agent"]),
  agentId: z.string().optional(),
  tags: z.array(z.string()),
  topics: z.array(z.string()),
  updatedAt: z.string().optional()
});
var orchestratorJobStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "failed"
]);
var orchestratorSessionStatusSchema = z.enum([
  "idle",
  "running",
  "completed",
  "failed",
  "missing"
]);
var orchestratorPromptModeSchema = z.enum(["inline", "file"]);
var orchestratorExecutionModeSchema = z.enum([
  "standard",
  "fleet",
  "auto"
]);
var orchestratorWorkingTreeStateSchema = z.enum([
  "clean",
  "dirty",
  "non-git",
  "git-unavailable"
]);
var orchestratorWorkingTreeFileStatusSchema = z.enum([
  "modified",
  "added",
  "deleted",
  "renamed",
  "copied",
  "untracked",
  "unmerged"
]);
var orchestratorWorkingTreeFileSchema = z.object({
  path: z.string().min(1),
  previousPath: z.string().min(1).optional(),
  statusCode: z.string().length(2),
  stagedStatus: orchestratorWorkingTreeFileStatusSchema.optional(),
  unstagedStatus: orchestratorWorkingTreeFileStatusSchema.optional(),
  displayStatus: z.string().min(1),
  lineStats: z.object({
    added: z.number().int().nonnegative(),
    removed: z.number().int().nonnegative(),
    isBinary: z.boolean().default(false)
  }).optional()
});
var orchestratorWorkingTreeSchema = z.object({
  state: orchestratorWorkingTreeStateSchema,
  projectPath: z.string().min(1),
  repositoryRoot: z.string().min(1).optional(),
  files: z.array(orchestratorWorkingTreeFileSchema).default([]),
  message: z.string().min(1).optional()
});
var orchestratorWorkingTreeDiffStateSchema = z.enum([
  "ready",
  "empty",
  "non-git",
  "git-unavailable",
  "not-found"
]);
var orchestratorStructuredDiffLineSchema = z.object({
  kind: z.enum(["context", "add", "remove", "meta"]),
  content: z.string(),
  oldLineNumber: z.number().int().positive().optional(),
  newLineNumber: z.number().int().positive().optional()
});
var orchestratorStructuredDiffHunkSchema = z.object({
  header: z.string().min(1),
  lines: z.array(orchestratorStructuredDiffLineSchema).default([])
});
var orchestratorStructuredDiffSchema = z.object({
  oldPath: z.string().min(1).optional(),
  newPath: z.string().min(1).optional(),
  headerLines: z.array(z.string()).default([]),
  hunks: z.array(orchestratorStructuredDiffHunkSchema).default([]),
  isBinary: z.boolean().default(false),
  hasText: z.boolean().default(false)
});
var orchestratorWorkingTreeDiffSchema = z.object({
  state: orchestratorWorkingTreeDiffStateSchema,
  projectPath: z.string().min(1),
  repositoryRoot: z.string().min(1).optional(),
  path: z.string().min(1),
  diff: z.string(),
  structured: orchestratorStructuredDiffSchema.optional(),
  message: z.string().min(1).optional()
});
var orchestratorScheduleFrequencySchema = z.enum([
  "daily",
  "weekly",
  "monthly"
]);
var orchestratorScheduleDayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
]);
var copilotCustomAgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  path: z.string().min(1)
});
var orchestratorJobSchema = z.object({
  jobId: z.string().min(1),
  sessionId: z.string().min(1),
  scheduleId: z.string().min(1).optional(),
  providerSessionId: z.string().min(1).optional(),
  prompt: z.string().optional(),
  promptPreview: z.string().min(1),
  promptMode: orchestratorPromptModeSchema,
  promptPath: z.string().min(1).optional(),
  outputPath: z.string().min(1).optional(),
  attachment: storedAttachmentSchema.optional(),
  customAgentId: z.string().min(1).optional(),
  status: orchestratorJobStatusSchema,
  submittedAt: z.string().min(1),
  startedAt: z.string().min(1).optional(),
  completedAt: z.string().min(1).optional(),
  exitCode: z.number().int().optional(),
  premiumUsage: premiumUsageSchema.optional(),
  jobDirectory: z.string().min(1)
});
var orchestratorSessionSummarySchema = z.object({
  sessionId: z.string().min(1),
  agentId: z.string().min(1),
  title: z.string().min(1),
  startedAt: z.string().min(1),
  updatedAt: z.string().min(1),
  summary: z.string(),
  projectPath: z.string().min(1),
  projectPurpose: z.string().min(1),
  cliProvider: z.string().min(1).optional(),
  model: z.string().min(1).default(DEFAULT_CHAT_MODEL),
  tmuxSessionName: z.string().min(1),
  tmuxWindowName: z.string().min(1),
  tmuxPaneId: z.string().min(1),
  status: orchestratorSessionStatusSchema,
  activeJobId: z.string().min(1).optional(),
  lastJobId: z.string().min(1).optional(),
  availableCustomAgents: z.array(copilotCustomAgentSchema).default([]),
  selectedCustomAgentId: z.string().min(1).optional(),
  providerSessionId: z.string().min(1).optional(),
  executionMode: orchestratorExecutionModeSchema.optional(),
  premiumUsage: premiumUsageTotalsSchema.optional(),
  sessionDirectory: z.string().min(1),
  manifestPath: z.string().min(1)
});
var orchestratorSessionSchema = orchestratorSessionSummarySchema.extend({
  jobs: z.array(orchestratorJobSchema),
  terminalTail: z.string(),
  logSize: z.number().int().nonnegative(),
  systemNotice: z.string().min(1).optional()
});
var orchestratorCapabilitiesSchema = z.object({
  available: z.boolean(),
  defaultProjectPath: z.string().min(1),
  recentProjectPaths: z.array(z.string().min(1)).default([]),
  tmuxInstalled: z.boolean(),
  copilotInstalled: z.boolean(),
  geminiInstalled: z.boolean().optional(),
  codexInstalled: z.boolean().optional(),
  opencodeInstalled: z.boolean().optional(),
  defaultCliProvider: z.string().min(1).optional(),
  cliProviders: z.array(orchestratorCliProviderDescriptorSchema).optional(),
  tmuxSessionName: z.string().min(1),
  emailDeliveryAvailable: z.boolean().optional(),
  emailFromAddress: z.string().email().optional()
});
var orchestratorScheduleSchema = z.object({
  scheduleId: z.string().min(1),
  sessionId: z.string().min(1),
  title: z.string().min(1),
  prompt: z.string().min(1),
  frequency: orchestratorScheduleFrequencySchema,
  timeOfDay: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().min(1),
  dayOfWeek: orchestratorScheduleDayOfWeekSchema.optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  customAgentId: z.string().min(1).optional(),
  emailTo: z.string().email().optional(),
  enabled: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  nextRunAt: z.string().min(1),
  lastRunAt: z.string().min(1).optional(),
  lastJobId: z.string().min(1).optional(),
  lastJobStatus: orchestratorJobStatusSchema.optional(),
  lastCompletedAt: z.string().min(1).optional(),
  lastEmailAttemptAt: z.string().min(1).optional(),
  lastEmailAttemptJobId: z.string().min(1).optional(),
  lastEmailError: z.string().min(1).optional(),
  totalRuns: z.number().int().nonnegative().default(0),
  failedRuns: z.number().int().nonnegative().default(0)
});
var scheduleTaskRunStatusSchema = z.enum([
  "idle",
  "running",
  "completed",
  "failed"
]);
var scheduleTaskTargetKindSchema = z.enum(["chat", "orchestrator"]);
var scheduleTaskBaseSchema = z.object({
  scheduleId: z.string().min(1),
  targetKind: scheduleTaskTargetKindSchema.default("chat"),
  agentId: z.string().min(1).optional(),
  orchestratorSessionId: z.string().min(1).optional(),
  chatSessionId: z.string().min(1).optional(),
  title: z.string().min(1),
  prompt: z.string().min(1),
  frequency: orchestratorScheduleFrequencySchema,
  timeOfDay: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().min(1),
  dayOfWeek: orchestratorScheduleDayOfWeekSchema.optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  enabled: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  nextRunAt: z.string().min(1),
  lastRunAt: z.string().min(1).optional(),
  lastCompletedAt: z.string().min(1).optional(),
  lastRunStatus: scheduleTaskRunStatusSchema.default("idle"),
  lastError: z.string().min(1).optional(),
  totalRuns: z.number().int().nonnegative().default(0),
  failedRuns: z.number().int().nonnegative().default(0),
  runtimeConfig: chatRuntimeConfigSchema.optional()
});
var scheduleTaskSchema = scheduleTaskBaseSchema.superRefine(
  (task, context) => {
    if (task.targetKind === "chat") {
      if (!task.agentId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["agentId"],
          message: "Scheduled chat tasks require an agent id."
        });
      }
      if (!task.chatSessionId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["chatSessionId"],
          message: "Scheduled chat tasks require a backing chat session id."
        });
      }
      if (!task.runtimeConfig) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["runtimeConfig"],
          message: "Scheduled chat tasks require a runtime config."
        });
      }
      return;
    }
    if (!task.orchestratorSessionId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["orchestratorSessionId"],
        message: "Scheduled orchestrator tasks require a session id."
      });
    }
  }
);
var scheduleTaskCreateBaseSchema = z.object({
  targetKind: scheduleTaskTargetKindSchema.default("chat"),
  agentId: z.string().trim().min(1).optional(),
  orchestratorSessionId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1),
  prompt: z.string().trim().min(1),
  frequency: orchestratorScheduleFrequencySchema,
  timeOfDay: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().trim().min(1),
  dayOfWeek: orchestratorScheduleDayOfWeekSchema.optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  enabled: z.boolean().default(true),
  config: partialChatRuntimeConfigSchema.optional()
});
var scheduleTaskCreateSchema = scheduleTaskCreateBaseSchema.superRefine((request, context) => {
  if (request.targetKind === "chat") {
    if (!request.agentId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["agentId"],
        message: "Scheduled chat tasks require an agent id."
      });
    }
    return;
  }
  if (!request.orchestratorSessionId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["orchestratorSessionId"],
      message: "Scheduled orchestrator tasks require a session id."
    });
  }
});
var scheduleTaskUpdateBaseSchema = z.object({
  targetKind: scheduleTaskTargetKindSchema.default("chat"),
  agentId: z.string().trim().min(1).optional(),
  orchestratorSessionId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1),
  prompt: z.string().trim().min(1),
  frequency: orchestratorScheduleFrequencySchema,
  timeOfDay: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().trim().min(1),
  dayOfWeek: orchestratorScheduleDayOfWeekSchema.optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  enabled: z.boolean(),
  config: partialChatRuntimeConfigSchema.optional()
});
var scheduleTaskUpdateSchema = scheduleTaskUpdateBaseSchema.superRefine((request, context) => {
  if (request.targetKind === "chat") {
    if (!request.agentId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["agentId"],
        message: "Scheduled chat tasks require an agent id."
      });
    }
    return;
  }
  if (!request.orchestratorSessionId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["orchestratorSessionId"],
      message: "Scheduled orchestrator tasks require a session id."
    });
  }
});
var workspaceSummarySchema = z.object({
  storeRoot: z.string().min(1),
  copilotConfigDir: z.string().min(1),
  storeSkillDirectory: z.string().min(1),
  copilotSkillDirectory: z.string().min(1),
  agentCount: z.number().int().nonnegative()
});
var chatRequestSchema = z.object({
  sessionId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  prompt: z.string().default(""),
  config: partialChatRuntimeConfigSchema.optional(),
  attachment: attachmentUploadSchema.optional()
});
var chatResponseSchema = z.object({
  thread: chatSessionSchema,
  assistantTurn: chatTurnSchema
});
var assistantSnapshotEventSchema = z.object({
  type: z.literal("assistant_snapshot"),
  assistantText: z.string().optional(),
  thinkingText: z.string().optional()
}).refine(
  (event) => Boolean(event.assistantText?.trim() || event.thinkingText?.trim()),
  {
    message: "Assistant snapshots must include assistant or thinking text."
  }
);
var chatStreamEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("thread"),
    thread: chatSessionSchema
  }),
  assistantSnapshotEventSchema,
  z.object({
    type: z.literal("complete"),
    response: chatResponseSchema
  }),
  z.object({
    type: z.literal("error"),
    error: z.string().min(1)
  })
]);
var orchestratorSessionCreateSchema = z.object({
  title: z.string().min(1).optional(),
  projectPath: z.string().min(1),
  projectPurpose: z.string().min(1),
  cliProvider: z.string().min(1).optional(),
  model: z.string().min(1).default(DEFAULT_CHAT_MODEL),
  selectedCustomAgentId: z.string().trim().min(1).nullable().optional(),
  providerSessionId: z.string().trim().min(1).regex(/^[a-zA-Z0-9_\-.:.]+$/, "Invalid session ID format").optional(),
  executionMode: orchestratorExecutionModeSchema.optional(),
  prompt: z.string().min(1).optional()
});
var orchestratorSessionUpdateSchema = z.object({
  title: z.string().trim().min(1),
  cliProvider: z.string().trim().min(1).optional(),
  model: z.string().trim().min(1),
  selectedCustomAgentId: z.string().trim().min(1).nullable().optional(),
  providerSessionId: z.string().trim().min(1).regex(/^[a-zA-Z0-9_\-.:.]+$/, "Invalid session ID format").nullable().optional(),
  executionMode: orchestratorExecutionModeSchema.optional()
});
var orchestratorDelegateRequestSchema = z.object({
  prompt: z.string().default(""),
  customAgentId: z.string().trim().min(1).nullable().optional(),
  providerSessionId: z.string().trim().min(1).regex(/^[a-zA-Z0-9_\-.:.]+$/, "Invalid session ID format").optional(),
  attachment: attachmentUploadSchema.optional()
});
var orchestratorTerminalInputSchema = z.object({
  input: z.string(),
  submit: z.boolean().default(true)
});
var orchestratorTerminalHistoryChunkSchema = z.object({
  chunk: z.string(),
  startOffset: z.number().int().nonnegative(),
  endOffset: z.number().int().nonnegative(),
  hasMoreBefore: z.boolean(),
  lineCount: z.number().int().nonnegative()
});
var orchestratorScheduleCreateSchema = z.object({
  sessionId: z.string().min(1),
  title: z.string().trim().min(1),
  prompt: z.string().trim().min(1),
  frequency: orchestratorScheduleFrequencySchema,
  timeOfDay: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().trim().min(1),
  dayOfWeek: orchestratorScheduleDayOfWeekSchema.optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  customAgentId: z.string().trim().min(1).nullable().optional(),
  emailTo: z.string().trim().email().optional(),
  enabled: z.boolean().default(true)
});
var orchestratorScheduleUpdateSchema = z.object({
  title: z.string().trim().min(1),
  prompt: z.string().trim().min(1),
  frequency: orchestratorScheduleFrequencySchema,
  timeOfDay: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().trim().min(1),
  dayOfWeek: orchestratorScheduleDayOfWeekSchema.optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  customAgentId: z.string().trim().min(1).nullable().optional(),
  emailTo: z.string().trim().email().nullable().optional(),
  enabled: z.boolean()
});
var memoryAnalysisRequestSchema = z.object({
  config: partialChatRuntimeConfigSchema.optional(),
  model: z.string().trim().min(1).optional()
});
var memoryTierSchema = z.enum(["working", "short-term", "long-term"]);
var memoryAnalysisToolExecutionSchema = z.object({
  toolName: z.string().min(1),
  success: z.boolean(),
  content: z.string().optional(),
  memoryTier: memoryTierSchema.optional()
});
var memoryAnalysisTierSummarySchema = z.object({
  summary: z.string().default(""),
  items: z.array(z.string()).default([])
});
var memoryAnalysisEntryChangeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  path: z.string().min(1),
  status: z.enum(["added", "updated"]),
  tier: memoryTierSchema,
  updatedAt: z.string().optional()
});
var memoryAnalysisResponseSchema = z.object({
  markdown: z.string(),
  model: z.string().min(1),
  configuredMemorySkillNames: z.array(z.string()).default([]),
  enabledSkillNames: z.array(z.string()).default([]),
  loadedSkillNames: z.array(z.string()).default([]),
  invokedSkillNames: z.array(z.string()).default([]),
  toolExecutions: z.array(memoryAnalysisToolExecutionSchema).default([]),
  reportedLoadedSkills: z.boolean().default(false),
  analysisByTier: z.object({
    working: memoryAnalysisTierSummarySchema,
    shortTerm: memoryAnalysisTierSummarySchema,
    longTerm: memoryAnalysisTierSummarySchema
  }),
  memoryChanges: z.object({
    working: z.array(memoryAnalysisEntryChangeSchema).default([]),
    shortTerm: z.array(memoryAnalysisEntryChangeSchema).default([]),
    longTerm: z.array(memoryAnalysisEntryChangeSchema).default([])
  })
});
var apiErrorSchema = z.object({
  error: z.string().min(1)
});
function normalizeApiErrorMessage(body, status) {
  const trimmed = body.trim();
  if (!trimmed) {
    return `Request failed with status ${status}.`;
  }
  try {
    const parsed = JSON.parse(trimmed);
    const result = apiErrorSchema.safeParse(parsed);
    if (result.success) {
      return result.data.error;
    }
  } catch {
  }
  return trimmed;
}
async function readResponseErrorMessage(response) {
  return normalizeApiErrorMessage(await response.text(), response.status);
}
async function fetchJson(resource, init) {
  const response = await fetch(resource, init);
  if (!response.ok) {
    throw new Error(await readResponseErrorMessage(response));
  }
  return await response.json();
}
export {
  DEFAULT_CHAT_MODEL,
  DEFAULT_CHAT_PROVIDER,
  DEFAULT_ORCHESTRATOR_CLI_PROVIDER,
  agentKindSchema,
  agentSummarySchema,
  apiErrorSchema,
  attachmentMediaTypeSchema,
  attachmentUploadSchema,
  chatProviderCapabilitiesSchema,
  chatProviderDescriptorSchema,
  chatRequestSchema,
  chatResponseSchema,
  chatRuntimeConfigSchema,
  chatSessionSchema,
  chatSessionSummarySchema,
  chatStreamEventSchema,
  chatTurnSchema,
  copilotCustomAgentSchema,
  createDefaultChatRuntimeConfig,
  fetchJson,
  llmQuotaSnapshotSchema,
  llmRequestStatsSchema,
  llmSessionStatsSchema,
  llmTokenDetailSchema,
  mcpServerConfigSchema,
  memoryAnalysisEntryChangeSchema,
  memoryAnalysisRequestSchema,
  memoryAnalysisResponseSchema,
  memoryAnalysisTierSummarySchema,
  memoryAnalysisToolExecutionSchema,
  memoryEntrySchema,
  memoryTierSchema,
  mergeChatRuntimeConfigs,
  modelCatalogSchema,
  modelDescriptorSchema,
  normalizeApiErrorMessage,
  orchestratorCapabilitiesSchema,
  orchestratorCliProviderCapabilitiesSchema,
  orchestratorCliProviderDescriptorSchema,
  orchestratorDelegateRequestSchema,
  orchestratorExecutionModeSchema,
  orchestratorJobSchema,
  orchestratorJobStatusSchema,
  orchestratorPromptModeSchema,
  orchestratorScheduleCreateSchema,
  orchestratorScheduleDayOfWeekSchema,
  orchestratorScheduleFrequencySchema,
  orchestratorScheduleSchema,
  orchestratorScheduleUpdateSchema,
  orchestratorSessionCreateSchema,
  orchestratorSessionSchema,
  orchestratorSessionStatusSchema,
  orchestratorSessionSummarySchema,
  orchestratorSessionUpdateSchema,
  orchestratorStructuredDiffHunkSchema,
  orchestratorStructuredDiffLineSchema,
  orchestratorStructuredDiffSchema,
  orchestratorTerminalHistoryChunkSchema,
  orchestratorTerminalInputSchema,
  orchestratorWorkingTreeDiffSchema,
  orchestratorWorkingTreeDiffStateSchema,
  orchestratorWorkingTreeFileSchema,
  orchestratorWorkingTreeFileStatusSchema,
  orchestratorWorkingTreeSchema,
  orchestratorWorkingTreeStateSchema,
  partialChatRuntimeConfigSchema,
  premiumUsageSchema,
  premiumUsageTotalsSchema,
  readResponseErrorMessage,
  reasoningEffortSchema,
  scheduleTaskCreateSchema,
  scheduleTaskRunStatusSchema,
  scheduleTaskSchema,
  scheduleTaskTargetKindSchema,
  scheduleTaskUpdateSchema,
  senderSchema,
  skillDescriptorSchema,
  skillScopeSchema,
  storedAttachmentSchema,
  workspaceSummarySchema
};
