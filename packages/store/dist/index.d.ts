import * as zod_v4_core from 'zod/v4/core';
import * as zod from 'zod';
import { WorkspaceSummary, MasterBatch, MasterBatchItem, OrchestratorJob, AttachmentUpload, PremiumUsage, OrchestratorSchedule, OrchestratorSession, CopilotCustomAgent, OrchestratorExecutionMode, PremiumUsageTotals, OrchestratorSessionSummary, ChatSessionSummary } from '@coding-agent-orchestrator/shared';

interface ResolveWorkspaceOptions {
    storeRoot?: string;
    copilotConfigDir?: string;
}
interface OrchestratorWorkspace {
    storeRoot: string;
    agentsRoot: string;
    memoryRoot: string;
    skillsRoot: string;
    copilotConfigDir: string;
    copilotSkillsRoot: string;
}
declare function resolveWorkspace(options?: ResolveWorkspaceOptions): Promise<OrchestratorWorkspace>;
declare function summarizeWorkspace(workspace: OrchestratorWorkspace): Promise<WorkspaceSummary>;

declare const ORCHESTRATOR_AGENT_ID = "copilot-orchestrator";
declare const IMPLEMENTATION_ORCHESTRATOR_CUSTOM_AGENT_ID = "implementation-orchestrator";
declare const ORCHESTRATOR_TERMINAL_LINE_LIMIT = 2000;
declare const ORCHESTRATOR_SESSION_TAIL_LINE_LIMIT = 200;
interface StoredOrchestratorJobCompletion {
    exitCode: number;
    completedAt: string;
}
declare const storedOrchestratorSessionStateSchema: zod.ZodObject<{
    sessionId: zod.ZodString;
    agentId: zod.ZodString;
    role: zod.ZodOptional<zod.ZodEnum<{
        standard: "standard";
        master: "master";
    }>>;
    title: zod.ZodString;
    startedAt: zod.ZodString;
    updatedAt: zod.ZodString;
    summary: zod.ZodString;
    projectPath: zod.ZodString;
    projectPurpose: zod.ZodString;
    cliProvider: zod.ZodOptional<zod.ZodString>;
    model: zod.ZodDefault<zod.ZodString>;
    tmuxSessionName: zod.ZodString;
    tmuxWindowName: zod.ZodString;
    tmuxPaneId: zod.ZodString;
    status: zod.ZodEnum<{
        completed: "completed";
        failed: "failed";
        running: "running";
        idle: "idle";
        missing: "missing";
    }>;
    activeJobId: zod.ZodOptional<zod.ZodString>;
    lastJobId: zod.ZodOptional<zod.ZodString>;
    availableCustomAgents: zod.ZodDefault<zod.ZodArray<zod.ZodObject<{
        id: zod.ZodString;
        name: zod.ZodString;
        description: zod.ZodString;
        path: zod.ZodString;
    }, zod_v4_core.$strip>>>;
    selectedCustomAgentId: zod.ZodOptional<zod.ZodString>;
    providerSessionId: zod.ZodOptional<zod.ZodString>;
    executionMode: zod.ZodOptional<zod.ZodEnum<{
        standard: "standard";
        fleet: "fleet";
        auto: "auto";
    }>>;
    premiumUsage: zod.ZodOptional<zod.ZodObject<{
        chargedRequestCount: zod.ZodDefault<zod.ZodNumber>;
        premiumRequestUnits: zod.ZodDefault<zod.ZodNumber>;
        lastRecordedAt: zod.ZodOptional<zod.ZodString>;
        lastModel: zod.ZodOptional<zod.ZodString>;
    }, zod_v4_core.$strip>>;
}, zod_v4_core.$strip>;
type StoredOrchestratorSessionState = ReturnType<typeof storedOrchestratorSessionStateSchema.parse>;
interface CreateOrchestratorSessionInput {
    title?: string;
    sessionId?: string;
    startedAt?: string;
    projectPath: string;
    projectPurpose: string;
    role?: OrchestratorSession["role"];
    cliProvider?: string;
    model?: string;
    availableCustomAgents?: CopilotCustomAgent[];
    selectedCustomAgentId?: string;
    providerSessionId?: string;
    executionMode?: OrchestratorExecutionMode;
    tmuxSessionName: string;
    tmuxWindowName: string;
    tmuxPaneId: string;
    status?: OrchestratorSession["status"];
}
interface CreateOrchestratorJobInput {
    prompt?: string;
    promptPreview: string;
    promptMode: OrchestratorJob["promptMode"];
    promptPath?: string;
    outputPath?: string;
    attachment?: AttachmentUpload;
    customAgentId?: string;
    providerSessionId?: string;
    scheduleId?: string;
    masterBatchId?: string;
    masterItemId?: string;
    premiumUsage?: PremiumUsage;
    submittedAt?: string;
}
interface CreateMasterBatchInput {
    batchId?: string;
    createdAt?: string;
    completedAt?: string;
    status?: MasterBatch["status"];
    originalPrompt: string;
    attachmentId?: string;
    items?: Array<Omit<MasterBatchItem, "itemId" | "approval" | "status"> & Partial<Pick<MasterBatchItem, "itemId" | "approval" | "status">>>;
}
interface CreateOrchestratorScheduleInput {
    sessionId: string;
    title: string;
    prompt: string;
    frequency: OrchestratorSchedule["frequency"];
    timeOfDay: string;
    timezone: string;
    dayOfWeek?: OrchestratorSchedule["dayOfWeek"];
    dayOfMonth?: number;
    customAgentId?: string;
    emailTo?: string;
    enabled?: boolean;
    nextRunAt: string;
}
declare function listOrchestratorSessions(workspace: OrchestratorWorkspace): Promise<OrchestratorSessionSummary[]>;
declare function getOrchestratorSession(workspace: OrchestratorWorkspace, sessionId: string): Promise<OrchestratorSession>;
declare function createOrchestratorSession(workspace: OrchestratorWorkspace, input: CreateOrchestratorSessionInput): Promise<OrchestratorSessionSummary>;
declare function updateOrchestratorSession(workspace: OrchestratorWorkspace, sessionId: string, updates: Partial<Omit<StoredOrchestratorSessionState, "sessionId" | "agentId">>): Promise<OrchestratorSessionSummary>;
declare function deleteOrchestratorSession(workspace: OrchestratorWorkspace, sessionId: string): Promise<void>;
declare function createOrchestratorJob(workspace: OrchestratorWorkspace, sessionId: string, input: CreateOrchestratorJobInput): Promise<OrchestratorJob>;
declare function updateOrchestratorJob(workspace: OrchestratorWorkspace, sessionId: string, jobId: string, updates: Partial<OrchestratorJob>): Promise<OrchestratorJob>;
declare function deleteOrchestratorJob(workspace: OrchestratorWorkspace, sessionId: string, jobId: string): Promise<void>;
declare function writeOrchestratorJobCompletion(workspace: OrchestratorWorkspace, sessionId: string, jobId: string, completion: StoredOrchestratorJobCompletion): Promise<void>;
declare function listOrchestratorSchedules(workspace: OrchestratorWorkspace, options?: {
    sessionId?: string;
}): Promise<OrchestratorSchedule[]>;
declare function getOrchestratorSchedule(workspace: OrchestratorWorkspace, scheduleId: string): Promise<OrchestratorSchedule>;
declare function createOrchestratorSchedule(workspace: OrchestratorWorkspace, input: CreateOrchestratorScheduleInput): Promise<OrchestratorSchedule>;
declare function updateOrchestratorSchedule(workspace: OrchestratorWorkspace, scheduleId: string, updates: Partial<OrchestratorSchedule>): Promise<OrchestratorSchedule>;
declare function deleteOrchestratorSchedule(workspace: OrchestratorWorkspace, scheduleId: string): Promise<void>;
declare function findMasterSession(workspace: OrchestratorWorkspace): Promise<OrchestratorSessionSummary | undefined>;
declare function listMasterBatches(workspace: OrchestratorWorkspace, sessionId: string): Promise<MasterBatch[]>;
declare function getMasterBatch(workspace: OrchestratorWorkspace, sessionId: string, batchId: string): Promise<MasterBatch>;
declare function createMasterBatch(workspace: OrchestratorWorkspace, sessionId: string, input: CreateMasterBatchInput): Promise<MasterBatch>;
declare function updateMasterBatch(workspace: OrchestratorWorkspace, sessionId: string, batchId: string, updates: Partial<MasterBatch>): Promise<MasterBatch>;
declare function deleteMasterBatch(workspace: OrchestratorWorkspace, sessionId: string, batchId: string): Promise<void>;
declare function writeMasterBatchPlanMarkdown(workspace: OrchestratorWorkspace, sessionId: string, batchId: string, markdown: string): Promise<void>;
declare function writeMasterSessionContext(workspace: OrchestratorWorkspace, sessionId: string, markdown: string): Promise<void>;
declare function readOrchestratorTerminalChunk(workspace: OrchestratorWorkspace, sessionId: string, offset: number): Promise<{
    chunk: string;
    nextOffset: number;
}>;
declare function readOrchestratorTerminalHistoryChunk(workspace: OrchestratorWorkspace, sessionId: string, beforeOffset: number, maxLines?: number): Promise<{
    chunk: string;
    startOffset: number;
    endOffset: number;
    hasMoreBefore: boolean;
    lineCount: number;
}>;
declare function getOrchestratorTerminalSize(workspace: OrchestratorWorkspace, sessionId: string): Promise<number>;
declare function resetOrchestratorTerminalLog(workspace: OrchestratorWorkspace, sessionId: string): Promise<void>;
declare function toOrchestratorChatSummary(session: OrchestratorSessionSummary): ChatSessionSummary;
declare function accumulatePremiumUsageTotals(current: PremiumUsageTotals | undefined, usage: PremiumUsage | undefined): PremiumUsageTotals | undefined;
declare function orchestratorHistoryRoot(workspace: OrchestratorWorkspace): string;
declare function orchestratorSchedulesRoot(workspace: OrchestratorWorkspace): string;
declare function buildOrchestratorWindowName(title: string, projectPath: string, sessionId: string): string;
declare function discoverCopilotCustomAgents(projectPath: string): Promise<CopilotCustomAgent[]>;
declare function getDefaultOrchestratorCustomAgentId(agents: readonly CopilotCustomAgent[]): string | undefined;

declare function slugify(value: string): string;
declare function normalizeAgentId(value: string): string;
declare function compactTimestamp(timestamp: string): string;
declare function isoFromCompactTimestamp(compact: string): string;
declare function displayTimestamp(timestamp: string): string;
declare function firstParagraph(markdown: string): string;
declare function toPosixRelative(root: string, target: string): string;
declare function ensureTrailingNewline(value: string): string;
declare function pathExists(targetPath: string): Promise<boolean>;
declare function readOptionalFile(targetPath: string): Promise<string | undefined>;
declare function readDirNames(root: string): Promise<string[]>;
declare function walkFiles(root: string): Promise<string[]>;

export { type CreateMasterBatchInput, type CreateOrchestratorJobInput, type CreateOrchestratorScheduleInput, type CreateOrchestratorSessionInput, IMPLEMENTATION_ORCHESTRATOR_CUSTOM_AGENT_ID, ORCHESTRATOR_AGENT_ID, ORCHESTRATOR_SESSION_TAIL_LINE_LIMIT, ORCHESTRATOR_TERMINAL_LINE_LIMIT, type OrchestratorWorkspace, type ResolveWorkspaceOptions, accumulatePremiumUsageTotals, buildOrchestratorWindowName, compactTimestamp, createMasterBatch, createOrchestratorJob, createOrchestratorSchedule, createOrchestratorSession, deleteMasterBatch, deleteOrchestratorJob, deleteOrchestratorSchedule, deleteOrchestratorSession, discoverCopilotCustomAgents, displayTimestamp, ensureTrailingNewline, findMasterSession, firstParagraph, getDefaultOrchestratorCustomAgentId, getMasterBatch, getOrchestratorSchedule, getOrchestratorSession, getOrchestratorTerminalSize, isoFromCompactTimestamp, listMasterBatches, listOrchestratorSchedules, listOrchestratorSessions, normalizeAgentId, orchestratorHistoryRoot, orchestratorSchedulesRoot, pathExists, readDirNames, readOptionalFile, readOrchestratorTerminalChunk, readOrchestratorTerminalHistoryChunk, resetOrchestratorTerminalLog, resolveWorkspace, slugify, summarizeWorkspace, toOrchestratorChatSummary, toPosixRelative, updateMasterBatch, updateOrchestratorJob, updateOrchestratorSchedule, updateOrchestratorSession, walkFiles, writeMasterBatchPlanMarkdown, writeMasterSessionContext, writeOrchestratorJobCompletion };
