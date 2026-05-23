import type {
  ModelDescriptor,
  OrchestratorCapabilities,
  OrchestratorExecutionMode,
  OrchestratorJob,
  OrchestratorSchedule,
  OrchestratorScheduleCreateRequest,
  OrchestratorScheduleUpdateRequest,
  OrchestratorSession,
  OrchestratorSessionCreateRequest,
  OrchestratorSessionUpdateRequest,
  OrchestratorWorkingTree,
  OrchestratorWorkingTreeDiff,
  OrchestratorWorkingTreeFile,
} from "@coding-agent-orchestrator/shared";
import * as RawAnsiModule from "ansi-to-react";
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { API_ROOT, api } from "../api";
import {
  getAdaptiveReconnectDelayMs,
  readReconnectCostHints,
} from "../mobile-reconnect";
import { findMatchingOrchestratorSessions } from "../orchestrator-duplicates";
import {
  clampOrchestratorTerminalHeight,
  DEFAULT_ORCHESTRATOR_TERMINAL_HEIGHT,
  MAX_ORCHESTRATOR_TERMINAL_HEIGHT,
  MIN_ORCHESTRATOR_TERMINAL_HEIGHT,
} from "../ui-preferences";
import { OrchestratorChangesPanel } from "./OrchestratorChangesPanel";
import { OrchestratorDiffModal } from "./OrchestratorDiffModal";
import {
  type OrchestratorScheduleDraft,
  OrchestratorScheduleForm,
} from "./OrchestratorScheduleModal";
import { SingleAttachmentPicker } from "./SingleAttachmentPicker";

interface OrchestratorPaneProps {
  capabilities?: OrchestratorCapabilities;
  session?: OrchestratorSession;
  schedules: OrchestratorSchedule[];
  models: ModelDescriptor[];
  defaultCliProvider?: string;
  defaultModelId: string;
  allSessions?: OrchestratorSession[];
  projectPathSuggestions: string[];
  pending: boolean;
  error?: string;
  onCreateSession: (request: OrchestratorSessionCreateRequest) => void;
  onUpdateSession: (request: OrchestratorSessionUpdateRequest) => void;
  onSelectSession?: (sessionId?: string) => void;
  onDeleteOlderDuplicate?: (sessionId: string) => void;
  onDelegate: (request: {
    prompt: string;
    attachment?: File;
    providerSessionId?: string;
  }) => void;
  onSendInput: (input: string, submit: boolean) => void;
  onCancelJob: () => void;
  onRestartSession: () => void;
  onRetryFailedJob?: (jobId: string) => void;
  onDeleteQueuedJob: (jobId: string) => void;
  onCreateSchedule: (request: OrchestratorScheduleCreateRequest) => void;
  onUpdateSchedule: (
    scheduleId: string,
    request: OrchestratorScheduleUpdateRequest
  ) => void;
  onDeleteSchedule: (scheduleId: string, sessionId: string) => void;
  onDeleteSession?: () => void;
  onSessionUpdate: (session: OrchestratorSession) => void;
  onSessionMissing?: (sessionId: string) => void;
  terminalOutputHeight?: number;
  onTerminalOutputHeightChange?: (height: number) => void;
}

type WorkspaceView =
  | "delegate"
  | "terminal"
  | "queue"
  | "changes"
  | "schedules"
  | "settings";

const TERMINAL_HISTORY_PAGE_LINE_LIMIT = 2_000;
const INITIAL_TERMINAL_TAIL_LINE_LIMIT = 200;
type FrequentTerminalCommand = {
  id: string;
  label: string;
  input: string;
  submit: boolean;
};
const FREQUENT_TERMINAL_COMMANDS: FrequentTerminalCommand[] = [
  {
    id: "git-add",
    label: "Git add",
    input: "git add .",
    submit: true,
  },
  {
    id: "git-commit-update",
    label: "Git ci -m update",
    input: 'git commit -m "update"',
    submit: true,
  },
  {
    id: "git-push",
    label: "Git push",
    input: "git push",
    submit: true,
  },
  {
    id: "ctrl-c",
    label: "Ctrl c",
    input: "\u0003",
    submit: false,
  },
  {
    id: "esc",
    label: "Esc",
    input: "\u001b",
    submit: false,
  },
];
type AnsiComponentProps = {
  children?: string;
  linkify?: boolean | "fuzzy";
  className?: string;
  useClasses?: boolean;
};

const Ansi = resolveAnsiComponent(RawAnsiModule);

function coerceExecutionMode(value: string): OrchestratorExecutionMode {
  if (value === "fleet" || value === "auto") {
    return value;
  }
  return "standard";
}

function executionModeLabel(mode?: OrchestratorExecutionMode): string {
  if (mode === "fleet") {
    return "Fleet";
  }
  if (mode === "auto") {
    return "Auto";
  }
  return "Standard";
}

function executionModeCommandHint(mode?: OrchestratorExecutionMode): string {
  if (mode === "fleet") {
    return `-p '/fleet ...'`;
  }
  if (mode === "auto") {
    return `--mode autopilot -p ...`;
  }
  return "-p ...";
}

function supportsProviderSessionResume(cliProvider?: string): boolean {
  return (
    cliProvider === "copilot" ||
    cliProvider === "gemini" ||
    cliProvider === "codex" ||
    cliProvider === "opencode" ||
    cliProvider === "antigravity"
  );
}

function providerSessionFieldNote(
  cliProvider?: string,
  orchestratorSessionId?: string
): string {
  if (cliProvider === "copilot") {
    return orchestratorSessionId
      ? "Set a default Copilot coding agent session ID only if future delegated jobs should keep resuming the same conversation."
      : "Optional existing Copilot coding agent session ID to resume after the orchestrator session is created.";
  }
  if (cliProvider === "gemini") {
    return "Paste an existing Gemini coding agent session ID to continue that conversation on delegated jobs.";
  }
  if (cliProvider === "codex") {
    return "Paste an existing Codex coding agent session ID or thread name to resume it on delegated jobs.";
  }
  if (cliProvider === "opencode") {
    return "Paste an existing OpenCode coding agent session ID to continue it on delegated jobs.";
  }
  if (cliProvider === "antigravity") {
    return "Paste an existing Google Antigravity conversation ID to continue that conversation on delegated jobs.";
  }
  return "Optional coding agent session ID for future delegated jobs.";
}

function delegatePromptPlaceholder(
  session: OrchestratorSession,
  activeJob?: OrchestratorJob
): string {
  const cliProvider = session.cliProvider ?? "copilot";
  if (activeJob) {
    return "Add the next task. It will wait for the current run to finish.";
  }
  if (cliProvider === "copilot") {
    return "Queue another async prompt for the Copilot CLI window.";
  }
  if (cliProvider === "gemini") {
    return "Queue another async prompt for the Gemini CLI window.";
  }
  if (cliProvider === "codex") {
    return "Queue another async prompt for the Codex CLI window.";
  }
  if (cliProvider === "opencode") {
    return "Queue another async prompt for the OpenCode CLI window.";
  }
  if (cliProvider === "antigravity") {
    return "Queue another async prompt for the Google Antigravity CLI window.";
  }
  return "Queue another async prompt for the selected CLI window.";
}

function buildDelegationCommandHint(
  session: OrchestratorSession,
  providerSessionId?: string
): string {
  const cliProvider = session.cliProvider ?? "copilot";
  const effectiveProviderSessionId =
    providerSessionId?.trim() || session.providerSessionId;
  if (cliProvider === "gemini") {
    return `gemini --model ${session.model}${effectiveProviderSessionId ? ` --resume ${effectiveProviderSessionId}` : ""} --yolo ${executionModeCommandHint()}`;
  }
  if (cliProvider === "codex") {
    return effectiveProviderSessionId
      ? `codex resume --model ${session.model} ${effectiveProviderSessionId} ...`
      : `codex --model ${session.model} --approval-mode full-auto ...`;
  }
  if (cliProvider === "opencode") {
    return `opencode run --model ${session.model}${effectiveProviderSessionId ? ` --session ${effectiveProviderSessionId}` : ""} -p ...`;
  }
  if (cliProvider === "antigravity") {
    return `agy${effectiveProviderSessionId ? ` --conversation ${effectiveProviderSessionId}` : ""} -p ...`;
  }
  const sessionFlag = effectiveProviderSessionId
    ? ` --resume ${effectiveProviderSessionId}`
    : "";
  return `copilot --model ${session.model}${session.selectedCustomAgentId ? ` --agent ${session.selectedCustomAgentId}` : ""}${session.executionMode === "auto" ? " --mode autopilot" : ""}${sessionFlag} --yolo ${executionModeCommandHint(session.executionMode)}`;
}

function normalizeProviderSessionId(
  providerSessionId: string | undefined
): string | undefined {
  const normalized = providerSessionId?.trim();
  return normalized ? normalized : undefined;
}

function isMissingOrchestratorSessionError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("orchestrator session not found:")
  );
}

function getJobProviderSessionTimestamp(job: OrchestratorJob): string {
  return job.completedAt ?? job.startedAt ?? job.submittedAt;
}

function getLatestKnownProviderSession(session?: OrchestratorSession): {
  providerSessionId: string;
  source: "saved-default" | "recent-job";
  job?: OrchestratorJob;
} | null {
  if (!session) {
    return null;
  }

  const jobsWithProviderSession = session.jobs
    .filter(
      (job): job is OrchestratorJob & { providerSessionId: string } =>
        !!normalizeProviderSessionId(job.providerSessionId)
    )
    .sort((left, right) =>
      getJobProviderSessionTimestamp(right).localeCompare(
        getJobProviderSessionTimestamp(left)
      )
    );

  const latestJob = jobsWithProviderSession[0];
  if (latestJob?.providerSessionId) {
    return {
      providerSessionId: latestJob.providerSessionId,
      source: "recent-job",
      job: latestJob,
    };
  }

  const savedProviderSessionId = normalizeProviderSessionId(
    session.providerSessionId
  );
  if (!savedProviderSessionId) {
    return null;
  }

  return {
    providerSessionId: savedProviderSessionId,
    source: "saved-default",
  };
}

function shouldStreamSession(session?: OrchestratorSession): boolean {
  if (!session) {
    return false;
  }
  if (session.status === "running" || session.activeJobId) {
    return true;
  }
  return session.jobs.some((job) => job.status === "running");
}

function preferredInitialWorkspaceView(): WorkspaceView {
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 860px)").matches
  ) {
    return "queue";
  }
  return "delegate";
}

export function OrchestratorPane(props: OrchestratorPaneProps) {
  const defaultCliProvider =
    props.defaultCliProvider ??
    props.capabilities?.defaultCliProvider ??
    "copilot";
  const [title, setTitle] = useState("");
  const [projectPath, setProjectPath] = useState(
    props.capabilities?.defaultProjectPath ?? ""
  );
  const [cliProvider, setCliProvider] = useState(defaultCliProvider);
  const [modelId, setModelId] = useState(props.defaultModelId);
  const [projectPurpose, setProjectPurpose] = useState("");
  const [initialPrompt, setInitialPrompt] = useState("");
  const [providerSessionId, setProviderSessionId] = useState("");
  const [delegatePrompt, setDelegatePrompt] = useState("");
  const [delegateProviderSessionId, setDelegateProviderSessionId] =
    useState("");
  const [delegateAttachment, setDelegateAttachment] = useState<
    File | undefined
  >();
  const [terminalInput, setTerminalInput] = useState("");
  const [
    selectedFrequentTerminalCommandId,
    setSelectedFrequentTerminalCommandId,
  ] = useState("");
  const [sessionTitle, setSessionTitle] = useState(props.session?.title ?? "");
  const [sessionCliProvider, setSessionCliProvider] = useState(
    props.session?.cliProvider ?? defaultCliProvider
  );
  const [sessionModelId, setSessionModelId] = useState(
    props.session?.model ?? props.defaultModelId
  );
  const [sessionCustomAgentId, setSessionCustomAgentId] = useState(
    props.session?.selectedCustomAgentId ?? ""
  );
  const [executionMode, setExecutionMode] = useState(
    props.session?.executionMode ?? "standard"
  );
  const [activeWorkspaceView, setActiveWorkspaceView] = useState<WorkspaceView>(
    () => preferredInitialWorkspaceView()
  );
  const [scheduleFormVisible, setScheduleFormVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<
    OrchestratorSchedule | undefined
  >();
  const [terminalOutput, setTerminalOutput] = useState(
    props.session?.terminalTail ?? ""
  );
  const [streamState, setStreamState] = useState<"idle" | "live" | "closed">(
    "idle"
  );
  const [terminalStartOffset, setTerminalStartOffset] = useState(() =>
    getTerminalTailStartOffset(props.session)
  );
  const [loadingMoreOutput, setLoadingMoreOutput] = useState(false);
  const [terminalHistoryError, setTerminalHistoryError] = useState<
    string | undefined
  >();
  const [workingTree, setWorkingTree] = useState<OrchestratorWorkingTree>();
  const [workingTreeLoading, setWorkingTreeLoading] = useState(false);
  const [workingTreeError, setWorkingTreeError] = useState<
    string | undefined
  >();
  const [selectedChangePath, setSelectedChangePath] = useState<
    string | undefined
  >();
  const [selectedChangeDiff, setSelectedChangeDiff] =
    useState<OrchestratorWorkingTreeDiff>();
  const [selectedChangeDiffLoading, setSelectedChangeDiffLoading] =
    useState(false);
  const [selectedChangeDiffError, setSelectedChangeDiffError] = useState<
    string | undefined
  >();
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [streamReconnectToken, setStreamReconnectToken] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const sessionUpdateRef = useRef(props.onSessionUpdate);
  const streamOffsetRef = useRef(props.session?.logSize ?? 0);
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);
  const streamReconnectAttemptRef = useRef(0);
  const workingTreeRequestRef = useRef(0);
  const changeDiffRequestRef = useRef(0);
  const pageVisibleRef = useRef(
    typeof document === "undefined"
      ? true
      : document.visibilityState !== "hidden"
  );
  const scrollBehaviorRef = useRef<"bottom" | "preserve">("bottom");
  const scrollSnapshotRef = useRef<{
    scrollTop: number;
    scrollHeight: number;
  } | null>(null);
  const changesPanelId = useId();
  const projectPathDatalistId = "orchestrator-project-paths";
  const availableCliProviders = props.capabilities?.cliProviders ?? [];
  const selectedCreateCliProvider = useMemo(
    () =>
      availableCliProviders.find((provider) => provider.id === cliProvider) ??
      availableCliProviders[0],
    [availableCliProviders, cliProvider]
  );
  const selectedSavedSessionCliProvider = useMemo(
    () =>
      availableCliProviders.find(
        (provider) => provider.id === (props.session?.cliProvider ?? "")
      ) ?? availableCliProviders[0],
    [availableCliProviders, props.session?.cliProvider]
  );
  const selectedSessionDraftCliProvider = useMemo(
    () =>
      availableCliProviders.find(
        (provider) => provider.id === sessionCliProvider
      ) ?? availableCliProviders[0],
    [availableCliProviders, sessionCliProvider]
  );
  const modelOptions = useMemo(() => {
    const activeCliProvider = props.session ? sessionCliProvider : cliProvider;
    const providerModels = props.models.filter(
      (model) => model.runtimeProvider === activeCliProvider
    );
    if (providerModels.length > 0) {
      return providerModels;
    }
    return [
      {
        id: props.session?.model ?? props.defaultModelId,
        displayName: props.session?.model ?? props.defaultModelId,
        runtimeProvider: activeCliProvider,
        supportedReasoningEfforts: [],
      },
    ];
  }, [
    cliProvider,
    props.defaultModelId,
    props.models,
    props.session,
    props.session?.model,
    sessionCliProvider,
  ]);
  const streamEnabled = useMemo(
    () => shouldStreamSession(props.session),
    [props.session]
  );
  const selectedNewSessionModel = useMemo(
    () => modelOptions.find((model) => model.id === modelId),
    [modelId, modelOptions]
  );
  const selectedSavedSessionModel = useMemo(() => {
    const currentSessionModel = props.session?.model;
    if (!currentSessionModel) {
      return undefined;
    }
    return modelOptions.find((model) => model.id === currentSessionModel);
  }, [modelOptions, props.session?.model]);
  const selectedSessionDraftModel = useMemo(() => {
    if (!props.session) {
      return undefined;
    }
    return modelOptions.find((model) => model.id === sessionModelId);
  }, [modelOptions, props.session, sessionModelId]);
  const selectedSavedCustomAgent = useMemo(
    () =>
      props.session?.availableCustomAgents.find(
        (agent) => agent.id === props.session?.selectedCustomAgentId
      ),
    [props.session]
  );
  const selectedSessionDraftCustomAgent = useMemo(
    () =>
      props.session?.availableCustomAgents.find(
        (agent) => agent.id === sessionCustomAgentId
      ),
    [props.session, sessionCustomAgentId]
  );
  const activeJob = useMemo(
    () => props.session?.jobs.find((job) => job.status === "running"),
    [props.session?.jobs]
  );
  const queuedJobs = useMemo(
    () =>
      [...(props.session?.jobs ?? [])]
        .filter((job) => job.status === "queued")
        .sort((left, right) =>
          left.submittedAt.localeCompare(right.submittedAt)
        ),
    [props.session?.jobs]
  );
  const recentCompletedJobs = useMemo(
    () =>
      (props.session?.jobs ?? [])
        .filter((job) => job.status === "completed" || job.status === "failed")
        .slice(0, 4),
    [props.session?.jobs]
  );
  const visibleJobs = useMemo(
    () => [
      ...(activeJob ? [activeJob] : []),
      ...queuedJobs,
      ...recentCompletedJobs,
    ],
    [activeJob, queuedJobs, recentCompletedJobs]
  );
  const completedJobCount = props.session?.jobs.filter(
    (job) => job.status === "completed"
  ).length;
  const failedJobCount = props.session?.jobs.filter(
    (job) => job.status === "failed"
  ).length;
  const enabledScheduleCount = props.schedules.filter(
    (schedule) => schedule.enabled
  ).length;
  const isCompactWorkspace = preferredInitialWorkspaceView() === "queue";
  const delegateButtonLabel = activeJob
    ? "Queue next prompt"
    : "Delegate prompt";
  const delegateButtonCompactLabel = activeJob ? "Queue next" : "Delegate";
  const workspaceViews: Array<{ id: WorkspaceView; label: string }> = [
    { id: "delegate", label: "Delegate" },
    { id: "terminal", label: "Terminal" },
    { id: "queue", label: "Queue" },
    { id: "changes", label: "Changes" },
    { id: "schedules", label: "Schedules" },
    { id: "settings", label: "Settings" },
  ];
  const queuePanelId = props.session
    ? `${props.session.sessionId}-task-queue`
    : "orchestrator-task-queue";
  const scheduleSectionId = props.session
    ? `${props.session.sessionId}-schedules`
    : "orchestrator-schedules";
  const runningJobs = activeJob ? [activeJob] : [];
  const failedJobs = recentCompletedJobs.filter(
    (job) => job.status === "failed"
  );
  const completedJobsBoard = useMemo(
    () =>
      (props.session?.jobs ?? [])
        .filter((job) => job.status === "completed")
        .slice(0, 2),
    [props.session?.jobs]
  );
  const queueBoardSections: Array<{
    label: string;
    status: string;
    items: OrchestratorJob[];
  }> = [
    { label: "Running", status: "running", items: runningJobs },
    { label: "Queued", status: "queued", items: queuedJobs },
    { label: "Failed", status: "failed", items: failedJobs },
    { label: "Completed", status: "completed", items: completedJobsBoard },
  ];
  const mobileQueueSessions = useMemo(
    () => (props.allSessions ?? []).slice(0, 6),
    [props.allSessions]
  );
  const duplicateComparisonSessions = useMemo(
    () =>
      props.session
        ? [
            props.session,
            ...(props.allSessions ?? []).filter(
              (session) => session.sessionId !== props.session?.sessionId
            ),
          ]
        : (props.allSessions ?? []),
    [props.allSessions, props.session]
  );
  const matchingSessions = useMemo(
    () =>
      findMatchingOrchestratorSessions(duplicateComparisonSessions, {
        projectPath: props.session?.projectPath ?? projectPath,
        projectPurpose: props.session?.projectPurpose ?? projectPurpose,
      }),
    [
      duplicateComparisonSessions,
      projectPath,
      projectPurpose,
      props.session?.projectPath,
      props.session?.projectPurpose,
    ]
  );
  const latestMatchingSession = matchingSessions[0];
  const olderMatchingSessions = latestMatchingSession
    ? matchingSessions.filter(
        (session) => session.sessionId !== latestMatchingSession.sessionId
      )
    : [];
  const latestMatchingProviderSession = getLatestKnownProviderSession(
    latestMatchingSession
  );
  const hasCreateDuplicate = !props.session && matchingSessions.length > 0;
  const selectedSessionHasDuplicates =
    !!props.session && matchingSessions.length > 1;
  const selectedSessionIsLatestDuplicate =
    !!props.session &&
    latestMatchingSession?.sessionId === props.session.sessionId &&
    olderMatchingSessions.length > 0;
  const latestOtherDuplicate =
    props.session &&
    latestMatchingSession?.sessionId !== props.session.sessionId
      ? latestMatchingSession
      : undefined;
  const latestKnownProviderSession = getLatestKnownProviderSession(
    props.session
  );
  const savedProviderSessionId = normalizeProviderSessionId(
    props.session?.providerSessionId
  );

  useEffect(() => {
    const defaultProjectPath = props.capabilities?.defaultProjectPath;
    if (defaultProjectPath) {
      setProjectPath((current) =>
        current.trim().length > 0 ? current : defaultProjectPath
      );
    }
  }, [props.capabilities?.defaultProjectPath]);

  useEffect(() => {
    setCliProvider((current) =>
      current.trim().length > 0 ? current : defaultCliProvider
    );
  }, [defaultCliProvider]);

  useEffect(() => {
    const fallbackModelId = modelOptions[0]?.id ?? props.defaultModelId;
    if (!fallbackModelId) {
      return;
    }
    setModelId((current) => {
      if (
        current.trim().length > 0 &&
        modelOptions.some((model) => model.id === current)
      ) {
        return current;
      }
      return fallbackModelId;
    });
  }, [props.defaultModelId, modelOptions]);

  useEffect(() => {
    setDelegatePrompt("");
    setDelegateProviderSessionId("");
    setDelegateAttachment(undefined);
    setTerminalInput("");
    setSelectedFrequentTerminalCommandId("");
    scrollBehaviorRef.current = "bottom";
    setTerminalOutput(props.session?.terminalTail ?? "");
    setTerminalStartOffset(getTerminalTailStartOffset(props.session));
    setLoadingMoreOutput(false);
    setTerminalHistoryError(undefined);
    setScheduleFormVisible(false);
    setEditingSchedule(undefined);
    setWorkingTree(undefined);
    setWorkingTreeLoading(false);
    setWorkingTreeError(undefined);
    setSelectedChangePath(undefined);
    setSelectedChangeDiff(undefined);
    setSelectedChangeDiffLoading(false);
    setSelectedChangeDiffError(undefined);
    setDiffModalOpen(false);
    setActiveWorkspaceView(preferredInitialWorkspaceView());
  }, [props.session?.sessionId]);

  useEffect(() => {
    if (!props.session) {
      setSessionTitle("");
      setSessionCliProvider(defaultCliProvider);
      setSessionModelId(props.defaultModelId);
      setSessionCustomAgentId("");
      setExecutionMode("standard");
      return;
    }
    setSessionTitle(props.session.title);
    setSessionCliProvider(props.session.cliProvider ?? defaultCliProvider);
    setSessionModelId(props.session.model);
    setSessionCustomAgentId(props.session.selectedCustomAgentId ?? "");
    setExecutionMode(props.session.executionMode ?? "standard");
  }, [
    defaultCliProvider,
    props.defaultModelId,
    props.session?.cliProvider,
    props.session?.executionMode,
    props.session?.selectedCustomAgentId,
    props.session?.model,
    props.session?.sessionId,
    props.session?.title,
  ]);

  useEffect(() => {
    const terminalTail = props.session?.terminalTail;
    if (!terminalTail) {
      return;
    }
    setTerminalOutput((current) => {
      if (current.length === 0 || terminalTail.length > current.length) {
        scrollBehaviorRef.current = "bottom";
        return terminalTail;
      }
      return current;
    });
  }, [props.session?.terminalTail, props.session?.logSize]);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) {
      return;
    }
    if (scrollBehaviorRef.current === "preserve" && scrollSnapshotRef.current) {
      terminal.scrollTop =
        scrollSnapshotRef.current.scrollTop +
        (terminal.scrollHeight - scrollSnapshotRef.current.scrollHeight);
    } else {
      terminal.scrollTop = terminal.scrollHeight;
    }
    scrollBehaviorRef.current = "bottom";
    scrollSnapshotRef.current = null;
  }, [terminalOutput]);

  useEffect(() => {
    if (activeWorkspaceView !== "terminal") {
      return;
    }
    scrollBehaviorRef.current = "bottom";
    window.requestAnimationFrame(() => {
      const terminal = terminalRef.current;
      if (!terminal) {
        return;
      }
      terminal.scrollTop = terminal.scrollHeight;
    });
  }, [activeWorkspaceView]);

  useEffect(() => {
    sessionUpdateRef.current = props.onSessionUpdate;
  }, [props.onSessionUpdate]);

  useEffect(() => {
    if (!props.session) {
      return;
    }

    const sessionId = props.session.sessionId;
    const requestId = workingTreeRequestRef.current + 1;
    workingTreeRequestRef.current = requestId;
    setWorkingTreeLoading(true);
    setWorkingTreeError(undefined);

    void api
      .getOrchestratorSessionChanges(sessionId)
      .then((response) => {
        if (workingTreeRequestRef.current !== requestId) {
          return;
        }
        setWorkingTree(response);
        setSelectedChangePath((current) =>
          current && response.files.some((file) => file.path === current)
            ? current
            : undefined
        );
        setSelectedChangeDiff((current) =>
          current && response.files.some((file) => file.path === current.path)
            ? current
            : undefined
        );
        setSelectedChangeDiffError(undefined);
      })
      .catch((error) => {
        if (workingTreeRequestRef.current !== requestId) {
          return;
        }
        if (isMissingOrchestratorSessionError(error)) {
          props.onSessionMissing?.(sessionId);
          return;
        }
        setWorkingTree(undefined);
        setWorkingTreeError(
          error instanceof Error
            ? error.message
            : "Failed to load uncommitted changes."
        );
      })
      .finally(() => {
        if (workingTreeRequestRef.current === requestId) {
          setWorkingTreeLoading(false);
        }
      });
  }, [
    props.onSessionMissing,
    props.session?.sessionId,
    props.session?.updatedAt,
  ]);

  useEffect(() => {
    streamOffsetRef.current = props.session?.logSize ?? 0;
    streamReconnectAttemptRef.current = 0;
  }, [props.session?.sessionId]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current !== undefined) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
    };
  }, []);

  useEffect(() => {
    const reconnectNow = () => {
      if (!props.session || streamState !== "closed") {
        return;
      }
      if (reconnectTimeoutRef.current !== undefined) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
      streamReconnectAttemptRef.current = 0;
      setStreamReconnectToken((current) => current + 1);
    };
    const handleVisibilityChange = () => {
      pageVisibleRef.current = document.visibilityState !== "hidden";
      if (pageVisibleRef.current) {
        reconnectNow();
      }
    };
    const handleOnline = () => {
      reconnectNow();
    };

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [props.session, streamState]);

  useEffect(() => {
    if (!props.session) {
      setStreamState("idle");
      return;
    }
    if (!streamEnabled) {
      setStreamState("idle");
      return;
    }
    if (typeof EventSource === "undefined") {
      setStreamState("closed");
      return;
    }

    const eventSource = new EventSource(
      `${API_ROOT}/api/orchestrator/sessions/${props.session.sessionId}/stream?offset=${streamOffsetRef.current}`
    );
    const handleOutput = (event: MessageEvent<string>) => {
      streamReconnectAttemptRef.current = 0;
      const payload = JSON.parse(event.data) as {
        chunk: string;
        nextOffset: number;
      };
      streamOffsetRef.current = payload.nextOffset;
      if (payload.chunk.length > 0) {
        scrollBehaviorRef.current = "bottom";
        setTerminalOutput((current) => `${current}${payload.chunk}`);
      }
    };
    const handleHeartbeat = (event: MessageEvent<string>) => {
      streamReconnectAttemptRef.current = 0;
      const payload = JSON.parse(event.data) as {
        offset: number;
      };
      streamOffsetRef.current = payload.offset;
    };
    const handleSession = (event: MessageEvent<string>) => {
      streamReconnectAttemptRef.current = 0;
      const payload = JSON.parse(event.data) as OrchestratorSession;
      sessionUpdateRef.current(payload);
    };
    const handleError = () => {
      eventSource.close();
      setStreamState("closed");
      if (reconnectTimeoutRef.current !== undefined) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      const delayMs = getAdaptiveReconnectDelayMs({
        ...readReconnectCostHints(),
        attempt: streamReconnectAttemptRef.current,
        pageVisible: pageVisibleRef.current,
      });
      streamReconnectAttemptRef.current += 1;
      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = undefined;
        setStreamReconnectToken((current) => current + 1);
      }, delayMs);
    };

    setStreamState("live");
    eventSource.addEventListener("output", handleOutput as EventListener);
    eventSource.addEventListener("heartbeat", handleHeartbeat as EventListener);
    eventSource.addEventListener("session", handleSession as EventListener);
    eventSource.onerror = handleError;
    return () => {
      if (reconnectTimeoutRef.current !== undefined) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
      eventSource.removeEventListener("output", handleOutput as EventListener);
      eventSource.removeEventListener(
        "heartbeat",
        handleHeartbeat as EventListener
      );
      eventSource.removeEventListener(
        "session",
        handleSession as EventListener
      );
      eventSource.close();
      setStreamState("closed");
    };
  }, [props.session?.sessionId, streamEnabled, streamReconnectToken]);

  const canLoadMoreOutput = !!props.session && terminalStartOffset > 0;
  const visibleWorkingTreeFiles = workingTree?.files ?? [];
  const selectedWorkingTreeFile = visibleWorkingTreeFiles.find(
    (file) => file.path === selectedChangePath
  );

  useEffect(() => {
    if (
      !selectedChangePath ||
      visibleWorkingTreeFiles.some((file) => file.path === selectedChangePath)
    ) {
      return;
    }
    setDiffModalOpen(false);
    setSelectedChangePath(undefined);
    setSelectedChangeDiff(undefined);
    setSelectedChangeDiffLoading(false);
    setSelectedChangeDiffError(undefined);
  }, [selectedChangePath, visibleWorkingTreeFiles]);

  async function handleSelectChangedFile(file: OrchestratorWorkingTreeFile) {
    if (!props.session) {
      return;
    }

    const sessionId = props.session.sessionId;
    const requestId = changeDiffRequestRef.current + 1;
    changeDiffRequestRef.current = requestId;
    setSelectedChangePath(file.path);
    setSelectedChangeDiff(undefined);
    setSelectedChangeDiffLoading(true);
    setSelectedChangeDiffError(undefined);
    setDiffModalOpen(true);

    try {
      const diff = await api.getOrchestratorSessionChangeDiff(
        sessionId,
        file.path
      );
      if (changeDiffRequestRef.current !== requestId) {
        return;
      }
      setSelectedChangeDiff(diff);
    } catch (error) {
      if (changeDiffRequestRef.current !== requestId) {
        return;
      }
      if (isMissingOrchestratorSessionError(error)) {
        props.onSessionMissing?.(sessionId);
        return;
      }
      setSelectedChangeDiff(undefined);
      setSelectedChangeDiffError(
        error instanceof Error ? error.message : "Failed to load the file diff."
      );
    } finally {
      if (changeDiffRequestRef.current === requestId) {
        setSelectedChangeDiffLoading(false);
      }
    }
  }

  function handleCloseDiffModal() {
    changeDiffRequestRef.current += 1;
    setDiffModalOpen(false);
    setSelectedChangePath(undefined);
    setSelectedChangeDiff(undefined);
    setSelectedChangeDiffLoading(false);
    setSelectedChangeDiffError(undefined);
  }

  async function handleLoadMoreOutput() {
    if (!props.session || loadingMoreOutput || terminalStartOffset <= 0) {
      return;
    }

    const sessionId = props.session.sessionId;
    setLoadingMoreOutput(true);
    setTerminalHistoryError(undefined);

    try {
      const terminal = terminalRef.current;
      if (terminal) {
        scrollSnapshotRef.current = {
          scrollTop: terminal.scrollTop,
          scrollHeight: terminal.scrollHeight,
        };
        scrollBehaviorRef.current = "preserve";
      }
      const historyChunk = await api.getOrchestratorTerminalHistory(
        sessionId,
        terminalStartOffset
      );
      if (historyChunk.chunk.length > 0) {
        setTerminalOutput((current) => `${historyChunk.chunk}${current}`);
      } else {
        scrollBehaviorRef.current = "bottom";
        scrollSnapshotRef.current = null;
      }
      setTerminalStartOffset(historyChunk.startOffset);
    } catch (error) {
      if (isMissingOrchestratorSessionError(error)) {
        props.onSessionMissing?.(sessionId);
        return;
      }
      scrollBehaviorRef.current = "bottom";
      scrollSnapshotRef.current = null;
      setTerminalHistoryError(
        error instanceof Error
          ? error.message
          : "Failed to load older tmux output."
      );
    } finally {
      setLoadingMoreOutput(false);
    }
  }

  const capabilityMessage = useMemo(() => {
    if (!props.capabilities) {
      return "Loading orchestrator capabilities…";
    }
    if (props.capabilities.available) {
      const providerNames = (props.capabilities.cliProviders ?? [])
        .map((provider) => provider.displayName)
        .join(" or ");
      return props.capabilities.emailDeliveryAvailable
        ? `tmux session ${props.capabilities.tmuxSessionName} is ready for ${providerNames} delegation and runtime email delivery is configured.`
        : `tmux session ${props.capabilities.tmuxSessionName} is ready for ${providerNames} delegation.`;
    }
    if (!props.capabilities.tmuxInstalled) {
      return "tmux is not available on this machine.";
    }
    const installedCLIs = [
      props.capabilities.copilotInstalled && "copilot",
      props.capabilities.geminiInstalled && "gemini",
      props.capabilities.codexInstalled && "codex",
      props.capabilities.opencodeInstalled && "opencode",
      props.capabilities.antigravityInstalled && "antigravity",
    ].filter(Boolean);
    if (installedCLIs.length === 0) {
      return "No supported CLI tools (copilot, gemini, codex, opencode, or antigravity) are available on this machine.";
    }
    const missingCLIs = [
      !props.capabilities.copilotInstalled && "copilot",
      !props.capabilities.geminiInstalled && "gemini",
      !props.capabilities.codexInstalled && "codex",
      !props.capabilities.opencodeInstalled && "opencode",
      !props.capabilities.antigravityInstalled && "antigravity",
    ].filter(Boolean);
    if (missingCLIs.length === 1) {
      return `The \`${missingCLIs[0]}\` CLI is not available on this machine.`;
    }
    if (missingCLIs.length > 1) {
      return `The following CLIs are not available on this machine: ${missingCLIs.map((cli) => `\`${cli}\``).join(", ")}.`;
    }
    return "The orchestrator feature is unavailable.";
  }, [props.capabilities]);
  const sessionDetailsDirty =
    !!props.session &&
    (sessionTitle.trim() !== props.session.title ||
      sessionCliProvider !== props.session.cliProvider ||
      sessionModelId !== props.session.model ||
      sessionCustomAgentId !== (props.session.selectedCustomAgentId ?? "") ||
      executionMode !== props.session.executionMode);
  const canSaveSessionDetails =
    !!props.session &&
    !props.pending &&
    sessionTitle.trim().length > 0 &&
    sessionModelId.trim().length > 0 &&
    sessionDetailsDirty;
  const dirtyFileCount =
    workingTree?.state === "dirty" ? visibleWorkingTreeFiles.length : 0;
  const settingsPanelId = props.session
    ? `${props.session.sessionId}-session-settings`
    : "orchestrator-session-settings";
  const terminalOutputStyle = {
    "--terminal-output-height": `${props.terminalOutputHeight ?? DEFAULT_ORCHESTRATOR_TERMINAL_HEIGHT}px`,
  } as CSSProperties;
  const selectedFrequentTerminalCommand = useMemo(
    () =>
      FREQUENT_TERMINAL_COMMANDS.find(
        (command) => command.id === selectedFrequentTerminalCommandId
      ),
    [selectedFrequentTerminalCommandId]
  );

  function handleSelectWorkspaceView(view: WorkspaceView) {
    setActiveWorkspaceView(view);
  }

  function handleSendFrequentTerminalCommand() {
    if (!selectedFrequentTerminalCommand) {
      return;
    }
    props.onSendInput(
      selectedFrequentTerminalCommand.input,
      selectedFrequentTerminalCommand.submit
    );
    setSelectedFrequentTerminalCommandId("");
  }

  function handleOpenCreateSchedule() {
    setActiveWorkspaceView("schedules");
    setEditingSchedule(undefined);
    setScheduleFormVisible(true);
  }

  function handleEditSchedule(schedule: OrchestratorSchedule) {
    setActiveWorkspaceView("schedules");
    setEditingSchedule(schedule);
    setScheduleFormVisible(true);
  }

  function handleSaveSchedule(draft: OrchestratorScheduleDraft) {
    if (!props.session) {
      return;
    }
    if (editingSchedule) {
      props.onUpdateSchedule(editingSchedule.scheduleId, {
        title: draft.title,
        prompt: draft.prompt,
        frequency: draft.frequency,
        timeOfDay: draft.timeOfDay,
        timezone: draft.timezone,
        dayOfWeek: draft.dayOfWeek,
        dayOfMonth: draft.dayOfMonth,
        customAgentId: draft.customAgentId ?? null,
        emailTo: draft.emailTo ?? null,
        enabled: draft.enabled,
      });
    } else {
      props.onCreateSchedule({
        sessionId: props.session.sessionId,
        title: draft.title,
        prompt: draft.prompt,
        frequency: draft.frequency,
        timeOfDay: draft.timeOfDay,
        timezone: draft.timezone,
        dayOfWeek: draft.dayOfWeek,
        dayOfMonth: draft.dayOfMonth,
        customAgentId: draft.customAgentId ?? null,
        emailTo: draft.emailTo,
        enabled: draft.enabled,
      });
    }
    setScheduleFormVisible(false);
    setEditingSchedule(undefined);
  }

  if (!props.session) {
    return (
      <section className="orchestrator-pane">
        <nav
          className="orchestrator-workspace-nav create-mode"
          aria-label="Workspace views"
        >
          <button type="button" className="workspace-tab is-active">
            Session setup
          </button>
          <button type="button" className="workspace-tab" disabled>
            Queue board
          </button>
          <button type="button" className="workspace-tab" disabled>
            Terminal
          </button>
          <button type="button" className="workspace-tab" disabled>
            Changes
          </button>
          <button type="button" className="workspace-tab" disabled>
            Settings
          </button>
        </nav>
        <div className="orchestrator-intro settings-card">
          <div>
            <div className="eyebrow">Async delegation</div>
            <h3>Create an orchestrator session</h3>
            <p>
              Queue work into a tmux window that runs a supported CLI provider
              with your chosen model, then monitor the terminal output here.
            </p>
          </div>
          <div className="field-note">{capabilityMessage}</div>
        </div>

        <div className="settings-card orchestrator-form">
          <label className="field-group">
            <span>CLI provider</span>
            <select
              value={cliProvider}
              onChange={(event) => {
                setCliProvider(event.target.value);
                setExecutionMode("standard");
              }}
            >
              {availableCliProviders.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.displayName}
                </option>
              ))}
            </select>
            {selectedCreateCliProvider?.description ? (
              <small className="field-note">
                {selectedCreateCliProvider.description}
              </small>
            ) : null}
          </label>
          <label className="field-group">
            <span>Session title</span>
            <input
              data-autofocus="true"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional label for this delegation session"
            />
          </label>
          <label className="field-group">
            <span>Project path</span>
            <input
              value={projectPath}
              onChange={(event) => setProjectPath(event.target.value)}
              placeholder="/absolute/path/to/project"
              spellCheck={false}
              list={
                props.projectPathSuggestions.length > 0
                  ? projectPathDatalistId
                  : undefined
              }
            />
            {props.projectPathSuggestions.length > 0 ? (
              <small className="field-note">
                Suggestions include the default path and recent orchestrator
                sessions.
              </small>
            ) : null}
          </label>
          {props.projectPathSuggestions.length > 0 ? (
            <datalist id={projectPathDatalistId}>
              {props.projectPathSuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          ) : null}
          <label className="field-group">
            <span>Model</span>
            <select
              value={modelId}
              onChange={(event) => setModelId(event.target.value)}
            >
              {modelOptions.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.displayName}
                </option>
              ))}
            </select>
            <small className="field-note">
              This becomes the default model for prompts delegated in this
              orchestrator session.
            </small>
          </label>
          <label className="field-group">
            <span>Project purpose</span>
            <textarea
              value={projectPurpose}
              onChange={(event) => setProjectPurpose(event.target.value)}
              rows={4}
              placeholder="What is this project for, and what should the delegated CLI session keep in mind?"
            />
          </label>
          {hasCreateDuplicate && latestMatchingSession ? (
            <div className="field-note" role="status">
              A matching orchestrator session already exists from{" "}
              {formatTimestamp(
                latestMatchingSession.updatedAt ??
                  latestMatchingSession.startedAt
              )}
              . Open it to keep working in one place, or create another session
              anyway.
              {latestMatchingProviderSession ? (
                <>
                  {" "}
                  Latest coding agent session ID:{" "}
                  <code>{latestMatchingProviderSession.providerSessionId}</code>
                  .
                </>
              ) : null}
              {props.onSelectSession ? (
                <>
                  {" "}
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() =>
                      props.onSelectSession?.(latestMatchingSession.sessionId)
                    }
                  >
                    Open latest existing session
                  </button>
                </>
              ) : null}
              {latestMatchingProviderSession ? (
                <>
                  {" "}
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() =>
                      setProviderSessionId(
                        latestMatchingProviderSession.providerSessionId
                      )
                    }
                    disabled={
                      providerSessionId.trim() ===
                      latestMatchingProviderSession.providerSessionId
                    }
                  >
                    Continue with previous session ID
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
          <label className="field-group">
            <span>Execution mode</span>
            <select
              value={executionMode}
              disabled={
                !selectedCreateCliProvider?.capabilities.supportsExecutionMode
              }
              onChange={(event) =>
                setExecutionMode(coerceExecutionMode(event.target.value))
              }
            >
              <option value="standard">Standard</option>
              {selectedCreateCliProvider?.capabilities.supportsExecutionMode ? (
                <>
                  <option value="fleet">Fleet</option>
                  <option value="auto">Auto</option>
                </>
              ) : null}
            </select>
            <small className="field-note">
              {selectedCreateCliProvider?.capabilities.supportsExecutionMode
                ? 'Fleet runs delegated Copilot CLI jobs with `-p "/fleet ..."` for explicit parallelization, while Auto starts Copilot with `--mode autopilot`.'
                : `${
                    selectedCreateCliProvider?.displayName ?? "This provider"
                  } only supports standard delegated runs.`}
            </small>
          </label>
          <label className="field-group">
            <span>Initial prompt</span>
            <textarea
              value={initialPrompt}
              onChange={(event) => setInitialPrompt(event.target.value)}
              rows={6}
              placeholder="Optional first task to queue as soon as the session is created."
            />
          </label>
          {supportsProviderSessionResume(cliProvider) ? (
            <label className="field-group">
              <span>Coding agent session ID</span>
              <input
                value={providerSessionId}
                onChange={(event) => setProviderSessionId(event.target.value)}
                placeholder="Optional existing coding agent session ID"
                autoComplete="off"
              />
              <small className="field-note">
                {providerSessionFieldNote(cliProvider)}
              </small>
            </label>
          ) : null}
          {props.error ? (
            <div className="error-row" role="alert">
              {props.error}
            </div>
          ) : null}
          <div className="composer-footer">
            <div className="composer-meta">
              <span>
                Provider:{" "}
                {selectedCreateCliProvider?.displayName ?? cliProvider}
              </span>
              <span>
                Model: {selectedNewSessionModel?.displayName ?? modelId}
              </span>
              {supportsProviderSessionResume(cliProvider) ? (
                <span>
                  Coding agent session ID:{" "}
                  {providerSessionId.trim() || "not set"}
                </span>
              ) : null}
              <span>Mode: {executionModeLabel(executionMode)}</span>
              <span>tmux-backed</span>
              <span>Async only</span>
            </div>
            <button
              type="button"
              className="primary-button"
              disabled={
                props.pending ||
                !projectPath.trim() ||
                !projectPurpose.trim() ||
                !modelId.trim() ||
                !props.capabilities?.available
              }
              onClick={() =>
                props.onCreateSession({
                  title: title.trim() || undefined,
                  projectPath: projectPath.trim(),
                  projectPurpose: projectPurpose.trim(),
                  cliProvider,
                  model: modelId,
                  providerSessionId: providerSessionId.trim() || undefined,
                  executionMode,
                  prompt: initialPrompt.trim() || undefined,
                })
              }
            >
              {props.pending ? "Creating..." : "Create session"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="orchestrator-pane orchestrator-console">
      <div className="settings-card orchestrator-session-strip">
        <div className="orchestrator-session-strip-header">
          <div className="orchestrator-session-overview">
            <div className="eyebrow">Orchestrator session</div>
            <div className="orchestrator-session-heading">
              <strong>{props.session.title}</strong>
              <span className="scope-chip">{props.session.status}</span>
            </div>
            <div className="panel-caption">{props.session.projectPurpose}</div>
            {selectedSessionHasDuplicates ? (
              <div className="field-note" role="status">
                {selectedSessionIsLatestDuplicate
                  ? `${olderMatchingSessions.length} older matching session${
                      olderMatchingSessions.length === 1 ? "" : "s"
                    } still use this same project path and purpose.`
                  : `A newer matching session was updated ${formatTimestamp(
                      latestOtherDuplicate?.updatedAt ??
                        latestOtherDuplicate?.startedAt ??
                        props.session.updatedAt
                    )}.`}
                {latestOtherDuplicate && props.onSelectSession ? (
                  <>
                    {" "}
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() =>
                        props.onSelectSession?.(latestOtherDuplicate.sessionId)
                      }
                    >
                      Open latest duplicate
                    </button>
                  </>
                ) : null}
                {selectedSessionIsLatestDuplicate &&
                olderMatchingSessions.length === 1 &&
                props.onDeleteOlderDuplicate ? (
                  <>
                    {" "}
                    <button
                      type="button"
                      className="ghost-button danger-button"
                      onClick={() =>
                        props.onDeleteOlderDuplicate?.(
                          olderMatchingSessions[0]?.sessionId ?? ""
                        )
                      }
                    >
                      Remove older duplicate
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
            <div className="orchestrator-session-path">
              <code>{props.session.projectPath}</code>
            </div>
            <div className="orchestrator-session-meta">
              <span>
                Provider:{" "}
                {selectedSavedSessionCliProvider?.displayName ??
                  props.session.cliProvider}
              </span>
              <span>
                Model:{" "}
                {selectedSavedSessionModel?.displayName ?? props.session.model}
              </span>
              {latestKnownProviderSession ? (
                <span>
                  {`Latest coding agent session ID: ${latestKnownProviderSession.providerSessionId}`}
                </span>
              ) : null}
              {savedProviderSessionId &&
              latestKnownProviderSession?.providerSessionId !==
                savedProviderSessionId ? (
                <span>
                  {`Saved default coding agent session ID: ${savedProviderSessionId}`}
                </span>
              ) : null}
              <span>
                {props.session.jobs.length} delegated job
                {props.session.jobs.length === 1 ? "" : "s"}
              </span>
              {queuedJobs.length > 0 ? (
                <span>
                  {queuedJobs.length} queued task
                  {queuedJobs.length === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
          </div>
          <div className="orchestrator-session-actions" aria-live="polite">
            <div className="runtime-control orchestrator-changes-control">
              <button
                type="button"
                className={
                  activeWorkspaceView === "changes"
                    ? "toolbar-chip orchestrator-changes-trigger open"
                    : "toolbar-chip orchestrator-changes-trigger"
                }
                aria-controls={changesPanelId}
                onClick={() => handleSelectWorkspaceView("changes")}
              >
                <span className="orchestrator-changes-trigger-topline">
                  <span className="toolbar-chip-label">Local changes</span>
                  <span className="orchestrator-changes-trigger-badge">
                    {dirtyFileCount}
                  </span>
                </span>
                <strong>
                  {workingTreeLoading
                    ? "Loading changes…"
                    : workingTree?.state === "dirty"
                      ? `${dirtyFileCount} changed`
                      : workingTree?.state === "clean"
                        ? "Working tree clean"
                        : "Change details"}
                </strong>
                <small>
                  {workingTreeError ??
                    workingTree?.message ??
                    (workingTree?.state === "dirty"
                      ? "Open to inspect changed files."
                      : "Open for repository status.")}
                </small>
              </button>
            </div>
            <button
              type="button"
              className="ghost-button"
              aria-label={
                activeWorkspaceView === "settings"
                  ? "Hide settings"
                  : "Session settings"
              }
              aria-expanded={activeWorkspaceView === "settings"}
              aria-controls={settingsPanelId}
              onClick={() =>
                handleSelectWorkspaceView(
                  activeWorkspaceView === "settings" ? "delegate" : "settings"
                )
              }
            >
              <ButtonContent
                icon={<SettingsIcon />}
                label={
                  activeWorkspaceView === "settings"
                    ? "Hide settings"
                    : "Session settings"
                }
                compactLabel="Settings"
              />
            </button>
            {props.session.activeJobId ? (
              <button
                type="button"
                className="ghost-button"
                aria-label={props.pending ? "Cancelling..." : "Cancel job"}
                disabled={props.pending}
                onClick={props.onCancelJob}
              >
                <ButtonContent
                  icon={<CancelIcon />}
                  label={props.pending ? "Cancelling..." : "Cancel job"}
                  compactLabel={props.pending ? "Cancelling..." : "Cancel"}
                />
              </button>
            ) : null}
            {props.onDeleteSession ? (
              <button
                type="button"
                className="ghost-button danger-button"
                aria-label={`Open delete dialog for ${props.session.title}`}
                disabled={props.pending}
                onClick={props.onDeleteSession}
              >
                Delete session
              </button>
            ) : null}
          </div>
        </div>
        <OrchestratorDiffModal
          open={diffModalOpen}
          file={selectedWorkingTreeFile}
          diff={selectedChangeDiff}
          loading={selectedChangeDiffLoading}
          error={selectedChangeDiffError}
          onClose={handleCloseDiffModal}
        />
        <nav
          className="orchestrator-workspace-nav"
          aria-label="Workspace views"
        >
          {workspaceViews.map((view) => {
            const isActive = activeWorkspaceView === view.id;
            const isQueueView = view.id === "queue";
            return (
              <button
                key={view.id}
                type="button"
                className={
                  isActive ? "workspace-tab is-active" : "workspace-tab"
                }
                data-workspace-target={view.id}
                aria-label={
                  isQueueView && isActive && !isCompactWorkspace
                    ? "Hide task queue"
                    : undefined
                }
                aria-controls={isQueueView ? queuePanelId : undefined}
                aria-expanded={isQueueView ? isActive : undefined}
                onClick={() =>
                  isQueueView && isActive && !isCompactWorkspace
                    ? handleSelectWorkspaceView("delegate")
                    : handleSelectWorkspaceView(view.id)
                }
              >
                {view.label}
              </button>
            );
          })}
        </nav>
        <div className="orchestrator-workspace-board">
          <div
            id={settingsPanelId}
            className={`collapsible-region orchestrator-settings-panel-shell orchestrator-workspace-panel orchestrator-board-card orchestrator-board-card-settings ${
              activeWorkspaceView === "settings" ? "is-active" : ""
            }`}
            data-mobile-visible={activeWorkspaceView === "settings"}
            data-state={activeWorkspaceView === "settings" ? "open" : "closed"}
            aria-hidden={activeWorkspaceView !== "settings"}
            hidden={activeWorkspaceView !== "settings"}
          >
            <div className="collapsible-region-inner orchestrator-settings-panel">
              <div className="eyebrow">Session settings</div>
              <div className="orchestrator-settings-grid">
                <label className="field-group">
                  <span>Project name</span>
                  <input
                    value={sessionTitle}
                    onChange={(event) => setSessionTitle(event.target.value)}
                    placeholder="Name this orchestrator session"
                  />
                </label>
                <label className="field-group">
                  <span>CLI provider</span>
                  <select
                    value={sessionCliProvider}
                    onChange={(event) => {
                      setSessionCliProvider(event.target.value);
                      setSessionCustomAgentId("");
                      setExecutionMode("standard");
                    }}
                  >
                    {availableCliProviders.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.displayName}
                      </option>
                    ))}
                  </select>
                  {selectedSessionDraftCliProvider?.description ? (
                    <small className="field-note">
                      {selectedSessionDraftCliProvider.description}
                    </small>
                  ) : null}
                </label>
                <label className="field-group">
                  <span>Model</span>
                  <select
                    value={sessionModelId}
                    onChange={(event) => setSessionModelId(event.target.value)}
                  >
                    {modelOptions.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.displayName}
                      </option>
                    ))}
                  </select>
                  <small className="field-note">
                    Running jobs keep their current command. New delegated
                    prompts use the saved model.
                  </small>
                </label>
                <label className="field-group">
                  <span>Custom agent</span>
                  <select
                    value={sessionCustomAgentId}
                    onChange={(event) =>
                      setSessionCustomAgentId(event.target.value)
                    }
                    disabled={
                      props.session.availableCustomAgents.length === 0 ||
                      !selectedSessionDraftCliProvider?.capabilities
                        .supportsCustomAgents
                    }
                  >
                    <option value="">No custom agent</option>
                    {props.session.availableCustomAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                  <small className="field-note">
                    {!selectedSessionDraftCliProvider?.capabilities
                      .supportsCustomAgents
                      ? `${
                          selectedSessionDraftCliProvider?.displayName ??
                          "This provider"
                        } does not support Copilot custom agents.`
                      : props.session.availableCustomAgents.length > 0
                        ? "The selected custom agent is passed to future delegated Copilot CLI runs."
                        : "No `.agent.md` files were discovered in the project path when this session was created."}
                  </small>
                </label>
              </div>
              <div className="panel-caption">
                Saved runtime: {props.session.tmuxSessionName}:
                {props.session.tmuxWindowName} • {props.session.tmuxPaneId}
              </div>
              <div className="orchestrator-settings-overview">
                <article className="orchestrator-settings-overview-card">
                  <span className="eyebrow">Session defaults</span>
                  <strong>
                    {selectedSessionDraftCliProvider?.displayName ??
                      sessionCliProvider}
                    {" · "}
                    {selectedSessionDraftModel?.displayName ?? sessionModelId}
                  </strong>
                  <p className="panel-caption">
                    {savedProviderSessionId
                      ? `Default coding agent session ID ${savedProviderSessionId}`
                      : providerSessionFieldNote(
                          props.session.cliProvider,
                          props.session.sessionId
                        )}
                  </p>
                </article>
                <article className="orchestrator-settings-overview-card">
                  <span className="eyebrow">Automations</span>
                  <strong>
                    {enabledScheduleCount} active /{" "}
                    {props.schedules.length - enabledScheduleCount} paused
                  </strong>
                  <div className="orchestrator-settings-overview-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => handleSelectWorkspaceView("schedules")}
                    >
                      Open schedules
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={handleOpenCreateSchedule}
                      disabled={props.pending}
                    >
                      New schedule
                    </button>
                  </div>
                </article>
              </div>
              <div className="composer-footer">
                <div className="composer-meta">
                  <span>
                    Provider:{" "}
                    {selectedSessionDraftCliProvider?.displayName ??
                      sessionCliProvider}
                  </span>
                  <span>
                    Model:{" "}
                    {selectedSessionDraftModel?.displayName ?? sessionModelId}
                  </span>
                  <span>
                    Custom agent:{" "}
                    {selectedSessionDraftCustomAgent?.name ?? "None"}
                  </span>
                  <span>Mode: {executionModeLabel(executionMode)}</span>
                  <span>Applies to future delegated jobs</span>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  aria-label="Save details"
                  disabled={!canSaveSessionDetails}
                  onClick={() => {
                    setActiveWorkspaceView("delegate");
                    props.onUpdateSession({
                      title: sessionTitle.trim(),
                      cliProvider: sessionCliProvider,
                      model: sessionModelId,
                      selectedCustomAgentId: sessionCustomAgentId || null,
                      executionMode,
                    });
                  }}
                >
                  <ButtonContent
                    icon={<SaveIcon />}
                    label="Save details"
                    compactLabel="Save"
                  />
                </button>
              </div>
              {props.onDeleteSession ? (
                <div className="orchestrator-session-danger">
                  <div>
                    <strong>Delete session</strong>
                    <p className="panel-caption">
                      Permanently remove this session, including terminal output
                      and queued work.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ghost-button danger-button"
                    aria-label={`Open delete dialog for ${props.session.title}`}
                    disabled={props.pending}
                    onClick={props.onDeleteSession}
                  >
                    Delete session
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div
          id={changesPanelId}
          className={`settings-card orchestrator-changes-panel-workspace orchestrator-workspace-panel orchestrator-board-card orchestrator-board-card-changes ${
            activeWorkspaceView === "changes" ? "is-active" : ""
          }`}
          data-mobile-visible={activeWorkspaceView === "changes"}
          hidden={activeWorkspaceView !== "changes"}
        >
          <OrchestratorChangesPanel
            workingTree={workingTree}
            loading={workingTreeLoading}
            error={workingTreeError}
            selectedPath={selectedChangePath}
            onSelectFile={(file) => void handleSelectChangedFile(file)}
          />
        </div>

        <div
          id={queuePanelId}
          className={`settings-card orchestrator-job-stack orchestrator-workspace-panel orchestrator-board-card orchestrator-board-card-queue ${
            activeWorkspaceView === "queue" ? "is-active" : ""
          }`}
          data-mobile-visible={activeWorkspaceView === "queue"}
          aria-hidden={activeWorkspaceView !== "queue"}
          hidden={activeWorkspaceView !== "queue"}
        >
          <div className="orchestrator-job-stack-header">
            <div className="orchestrator-job-stack-toggle-copy">
              <span className="eyebrow">Task queue</span>
              <strong>
                {activeJob
                  ? "Current run plus any queued follow-up work"
                  : "Most recent delegated tasks"}
              </strong>
            </div>
            <div className="orchestrator-job-stack-stats">
              <span className="orchestrator-job-counter">
                {activeJob ? 1 : 0} running
              </span>
              <span className="orchestrator-job-counter">
                {queuedJobs.length} queued
              </span>
              <span className="orchestrator-job-counter">
                {completedJobCount ?? 0} completed
              </span>
              <span className="orchestrator-job-counter">
                {failedJobCount ?? 0} failed
              </span>
            </div>
          </div>
          <div className="orchestrator-mobile-queue-board">
            <section className="orchestrator-mobile-queue-overview">
              <div className="orchestrator-mobile-queue-summary">
                <div className="orchestrator-mobile-queue-board-header">
                  <div>
                    <span className="eyebrow">Queue</span>
                    <strong>{props.session.title}</strong>
                  </div>
                  <span className="scope-chip">{props.session.status}</span>
                </div>
                <p className="panel-caption">{props.session.projectPurpose}</p>
                <div className="orchestrator-mobile-queue-meta">
                  <span>{props.session.projectPath}</span>
                  <span>
                    {selectedSavedSessionCliProvider?.displayName ??
                      props.session.cliProvider}
                    {" · "}
                    {selectedSavedSessionModel?.displayName ??
                      props.session.model}
                  </span>
                  <span>
                    {queuedJobs.length} queued • {failedJobCount ?? 0} failed •{" "}
                    {enabledScheduleCount} scheduled
                  </span>
                  <span>
                    {latestKnownProviderSession
                      ? `Session ID ${latestKnownProviderSession.providerSessionId}`
                      : "Starts fresh by default"}
                  </span>
                </div>
                <div className="orchestrator-mobile-queue-actions">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => handleSelectWorkspaceView("delegate")}
                  >
                    Delegate next
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => handleSelectWorkspaceView("terminal")}
                  >
                    Open terminal
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => handleSelectWorkspaceView("changes")}
                  >
                    Review changes
                  </button>
                </div>
              </div>
              <div className="orchestrator-mobile-session-switcher">
                <div className="orchestrator-mobile-session-switcher-header">
                  <div>
                    <span className="eyebrow">Switch session</span>
                    <strong>Jump between active workspaces</strong>
                  </div>
                  {props.onSelectSession ? (
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => props.onSelectSession?.(undefined)}
                    >
                      New
                    </button>
                  ) : null}
                </div>
                <div className="orchestrator-mobile-session-switcher-list">
                  {mobileQueueSessions.map((session) => (
                    <button
                      key={session.sessionId}
                      type="button"
                      className={
                        session.sessionId === props.session?.sessionId
                          ? "orchestrator-mobile-session-chip is-active"
                          : "orchestrator-mobile-session-chip"
                      }
                      onClick={() => props.onSelectSession?.(session.sessionId)}
                    >
                      <strong>{session.title}</strong>
                      <span>{session.status}</span>
                      <small>
                        {session.jobs.filter((job) => job.status === "queued")
                          .length || 0}{" "}
                        queued
                      </small>
                    </button>
                  ))}
                </div>
              </div>
            </section>
            <div className="orchestrator-queue-lanes">
              {queueBoardSections.map(({ label, status, items }) => (
                <div
                  key={label}
                  className="orchestrator-queue-lane"
                  data-status={status}
                >
                  <div className="orchestrator-queue-lane-header">
                    <strong>{label}</strong>
                    <span
                      className="orchestrator-job-counter"
                      data-status={status}
                    >
                      {items.length}
                    </span>
                  </div>
                  {items.length > 0 ? (
                    <div className="orchestrator-queue-lane-list">
                      {items.slice(0, 2).map((item) => (
                        <div
                          key={item.jobId}
                          className="orchestrator-queue-board-card"
                        >
                          <strong>
                            {label}: {item.promptPreview}
                          </strong>
                          <span>{describeJobProgress(item)}</span>
                          <div className="orchestrator-queue-board-actions">
                            {item.status === "queued" ? (
                              <button
                                type="button"
                                className="ghost-button danger-button queued-job-delete-button"
                                onClick={() =>
                                  props.onDeleteQueuedJob(item.jobId)
                                }
                                disabled={props.pending}
                              >
                                Quick delete
                              </button>
                            ) : item.status === "failed" &&
                              canRetryJob(item) ? (
                              <button
                                type="button"
                                className="ghost-button"
                                onClick={() =>
                                  props.onRetryFailedJob?.(item.jobId)
                                }
                                disabled={
                                  props.pending || !props.onRetryFailedJob
                                }
                              >
                                Quick retry
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="ghost-button"
                                onClick={() =>
                                  handleSelectWorkspaceView(
                                    item.status === "running"
                                      ? "terminal"
                                      : "queue"
                                  )
                                }
                              >
                                Open
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="panel-caption">
                      No {label.toLowerCase()} items.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="orchestrator-job-stack-panel">
            {visibleJobs.length > 0 ? (
              <div className="orchestrator-job-list">
                {visibleJobs.map((job) => (
                  <article
                    key={job.jobId}
                    className={`orchestrator-job-item orchestrator-job-item-${job.status}`}
                  >
                    <div className="orchestrator-job-row">
                      <div className="orchestrator-job-title">
                        <span className="scope-chip">
                          {humanizeJobStatus(job.status)}
                        </span>
                        <strong>{job.promptPreview}</strong>
                        {job.masterBatchId ? (
                          <span
                            className="scope-chip orchestrator-master-origin-chip"
                            title={`Master batch ${job.masterBatchId}${job.masterItemId ? ` · item ${job.masterItemId}` : ""}`}
                          >
                            Dispatched from master
                          </span>
                        ) : null}
                        {job.providerSessionId ? (
                          <span
                            className="panel-caption orchestrator-job-session-id"
                            title={job.providerSessionId}
                          >
                            Coding agent session ID: {job.providerSessionId}
                          </span>
                        ) : null}
                        {job.attachment ? (
                          <span className="panel-caption">
                            {job.attachment.name}
                          </span>
                        ) : null}
                      </div>
                      <span className="panel-caption">
                        {formatJobTimestamp(job)}
                      </span>
                    </div>
                    <div className="orchestrator-job-row">
                      <span className="panel-caption">
                        {describeJobProgress(job)}
                      </span>
                      <span className="orchestrator-job-actions">
                        <span className="panel-caption">
                          {job.promptMode === "file"
                            ? "Prompt file"
                            : "Inline prompt"}
                        </span>
                        {job.status === "failed" && canRetryJob(job) ? (
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => props.onRetryFailedJob?.(job.jobId)}
                            disabled={props.pending || !props.onRetryFailedJob}
                          >
                            Retry
                          </button>
                        ) : null}
                        {job.status !== "queued" &&
                        job.providerSessionId &&
                        supportsProviderSessionResume(
                          props.session?.cliProvider
                        ) ? (
                          <button
                            type="button"
                            className="ghost-button"
                            aria-label={`Continue task: ${job.promptPreview}`}
                            onClick={() =>
                              setDelegateProviderSessionId(
                                job.providerSessionId ?? ""
                              )
                            }
                            disabled={props.pending}
                          >
                            Continue
                          </button>
                        ) : null}
                        {job.status === "queued" ? (
                          <button
                            type="button"
                            className="ghost-button danger-button queued-job-delete-button"
                            onClick={() => props.onDeleteQueuedJob(job.jobId)}
                            disabled={props.pending}
                          >
                            Remove
                          </button>
                        ) : null}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="panel-caption">
                Delegated prompts appear here so you can see what is running,
                what is queued, and what already finished.
              </div>
            )}
          </div>
        </div>

        <div
          className={`settings-card orchestrator-schedule-stack orchestrator-workspace-panel orchestrator-board-card orchestrator-board-card-schedules ${
            activeWorkspaceView === "schedules" ? "is-active" : ""
          }`}
          data-mobile-visible={activeWorkspaceView === "schedules"}
          hidden={activeWorkspaceView !== "schedules"}
        >
          <div className="orchestrator-job-stack-header">
            <div className="orchestrator-job-stack-toggle-copy">
              <span className="eyebrow">Recurring schedules</span>
              <strong>
                Automate prompts for this session and optionally email the
                captured output.
              </strong>
            </div>
            <div className="orchestrator-job-stack-stats">
              <span className="orchestrator-job-counter">
                {enabledScheduleCount} active
              </span>
              <span className="orchestrator-job-counter">
                {props.schedules.length - enabledScheduleCount} paused
              </span>
              {!scheduleFormVisible && (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={handleOpenCreateSchedule}
                  disabled={props.pending}
                >
                  Create schedule
                </button>
              )}
            </div>
          </div>
          <div id={scheduleSectionId} className="orchestrator-job-stack-panel">
            {scheduleFormVisible ? (
              <OrchestratorScheduleForm
                key={editingSchedule?.scheduleId ?? "new"}
                pending={props.pending}
                schedule={editingSchedule}
                availableCustomAgents={props.session.availableCustomAgents}
                emailDeliveryAvailable={
                  !!props.capabilities?.emailDeliveryAvailable
                }
                emailFromAddress={props.capabilities?.emailFromAddress}
                onCancel={() => {
                  setScheduleFormVisible(false);
                  setEditingSchedule(undefined);
                }}
                onSave={handleSaveSchedule}
              />
            ) : props.schedules.length > 0 ? (
              <div className="orchestrator-job-list">
                {props.schedules.map((schedule) => (
                  <article
                    key={schedule.scheduleId}
                    className={`orchestrator-job-item orchestrator-schedule-item ${schedule.enabled ? "orchestrator-schedule-item-enabled" : "orchestrator-schedule-item-paused"}`}
                  >
                    <div className="orchestrator-job-row">
                      <div className="orchestrator-job-title">
                        <span className="scope-chip">
                          {schedule.enabled ? "Active" : "Paused"}
                        </span>
                        <strong>{schedule.title}</strong>
                      </div>
                      <span className="panel-caption">
                        Next run {formatTimestamp(schedule.nextRunAt)}
                      </span>
                    </div>
                    <div className="panel-caption orchestrator-schedule-summary">
                      {describeSchedule(schedule)}
                    </div>
                    <div className="panel-caption orchestrator-schedule-prompt">
                      {schedule.prompt}
                    </div>
                    <div className="orchestrator-job-row">
                      <span className="panel-caption">
                        {schedule.emailTo
                          ? `Emails ${schedule.emailTo}`
                          : "In-app only"}
                        {" • "}
                        {schedule.totalRuns} total run
                        {schedule.totalRuns === 1 ? "" : "s"}
                        {schedule.failedRuns > 0
                          ? ` • ${schedule.failedRuns} failed`
                          : ""}
                        {schedule.lastJobStatus
                          ? ` • Last status ${humanizeJobStatus(schedule.lastJobStatus)}`
                          : ""}
                      </span>
                      <span className="orchestrator-job-actions">
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() =>
                            props.onUpdateSchedule(schedule.scheduleId, {
                              title: schedule.title,
                              prompt: schedule.prompt,
                              frequency: schedule.frequency,
                              timeOfDay: schedule.timeOfDay,
                              timezone: schedule.timezone,
                              dayOfWeek: schedule.dayOfWeek,
                              dayOfMonth: schedule.dayOfMonth,
                              customAgentId: schedule.customAgentId ?? null,
                              emailTo: schedule.emailTo ?? null,
                              enabled: !schedule.enabled,
                            })
                          }
                          disabled={props.pending}
                        >
                          {schedule.enabled ? "Pause" : "Resume"}
                        </button>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => handleEditSchedule(schedule)}
                          disabled={props.pending}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="ghost-button danger-button"
                          onClick={() =>
                            props.onDeleteSchedule(
                              schedule.scheduleId,
                              schedule.sessionId
                            )
                          }
                          disabled={props.pending}
                        >
                          Delete
                        </button>
                      </span>
                    </div>
                    {schedule.lastEmailError ? (
                      <div className="panel-caption orchestrator-schedule-error">
                        Last email attempt failed: {schedule.lastEmailError}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="panel-caption">
                Create a recurring prompt for routines like a morning news
                summary, a scheduled code review, or a daily status email.
              </div>
            )}
          </div>
        </div>

        <div
          className={`terminal-shell orchestrator-workspace-panel orchestrator-board-card orchestrator-board-card-terminal ${
            activeWorkspaceView === "terminal" ? "is-active" : ""
          }`}
          data-mobile-visible={activeWorkspaceView === "terminal"}
          hidden={activeWorkspaceView !== "terminal"}
        >
          <div className="terminal-toolbar">
            <div>
              <strong>tmux output</strong>
              <div className="panel-caption">
                {props.session.tmuxSessionName}:{props.session.tmuxWindowName} •{" "}
                {props.session.tmuxPaneId}
              </div>
            </div>
            <div className="terminal-toolbar-actions">
              <span className="panel-caption orchestrator-toolbar-status">
                Primary workspace
              </span>
              {canLoadMoreOutput ? (
                <button
                  type="button"
                  className="ghost-button"
                  aria-label={
                    loadingMoreOutput
                      ? "Loading older output"
                      : "Load 2k more lines"
                  }
                  disabled={props.pending || loadingMoreOutput}
                  onClick={() => void handleLoadMoreOutput()}
                >
                  <ButtonContent
                    icon={<ScrollIcon />}
                    label={
                      loadingMoreOutput ? "Loading..." : "Load 2k more lines"
                    }
                    compactLabel="Load more"
                  />
                </button>
              ) : null}
              <button
                type="button"
                className="ghost-button"
                aria-label="Start a new tmux session"
                disabled={props.pending}
                onClick={props.onRestartSession}
              >
                <ButtonContent
                  icon={<RestartIcon />}
                  label="New tmux session"
                  compactLabel="New tmux"
                />
              </button>
            </div>
          </div>
          <div className="terminal-toolbar-note field-note">
            {canLoadMoreOutput
              ? `Showing the latest ${INITIAL_TERMINAL_TAIL_LINE_LIMIT.toLocaleString()} lines. Load more to prepend older tmux output in ${TERMINAL_HISTORY_PAGE_LINE_LIMIT.toLocaleString()}-line pages.`
              : "Showing all tmux output currently saved for this pane."}{" "}
            Starting a new tmux session closes the current pane. Previous tmux
            output will no longer be available here.
          </div>
          {props.session.systemNotice ? (
            <div className="terminal-toolbar-note field-note" role="status">
              {props.session.systemNotice}
            </div>
          ) : null}
          {terminalHistoryError ? (
            <div className="terminal-toolbar-note">
              <div className="inline-error-banner" role="alert">
                {terminalHistoryError}
              </div>
            </div>
          ) : null}
          <div
            className="terminal-output"
            ref={terminalRef}
            style={terminalOutputStyle}
          >
            <Ansi linkify={false}>
              {terminalOutput ||
                "[coding-agent-orchestrator] Waiting for tmux output...\n"}
            </Ansi>
          </div>
          <div className="terminal-resize-footer">
            <TerminalResizeHandle
              height={
                props.terminalOutputHeight ??
                DEFAULT_ORCHESTRATOR_TERMINAL_HEIGHT
              }
              onHeightChange={props.onTerminalOutputHeightChange}
            />
            <span className="panel-caption">
              Drag or use arrow keys to resize the tmux output and keep the
              terminal controls in view.
            </span>
          </div>
          <div className="settings-card">
            <div className="terminal-frequent-command-row">
              <label className="field-group grow">
                <span>Frequent commands</span>
                <select
                  value={selectedFrequentTerminalCommandId}
                  onChange={(event) =>
                    setSelectedFrequentTerminalCommandId(event.target.value)
                  }
                >
                  <option value="">Select a command</option>
                  {FREQUENT_TERMINAL_COMMANDS.map((command) => (
                    <option key={command.id} value={command.id}>
                      {command.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="ghost-button"
                aria-label="Send selected frequent command"
                disabled={props.pending || !selectedFrequentTerminalCommand}
                onClick={handleSendFrequentTerminalCommand}
              >
                <ButtonContent
                  icon={<SendIcon />}
                  label="Send command"
                  compactLabel="Send"
                />
              </button>
            </div>
            <label className="field-group grow">
              <span>Send raw terminal input</span>
              <textarea
                className="orchestrator-terminal-input"
                value={terminalInput}
                onChange={(event) => setTerminalInput(event.target.value)}
                rows={4}
                placeholder="Send text directly into the tmux pane."
              />
            </label>
            <div className="composer-footer">
              <div className="composer-meta">
                <span>Enter submits</span>
              </div>
              <div className="header-button-row">
                <button
                  type="button"
                  className="ghost-button"
                  aria-label="Send text only"
                  disabled={props.pending || !terminalInput.trim()}
                  onClick={() => {
                    props.onSendInput(terminalInput, false);
                    setTerminalInput("");
                  }}
                >
                  <ButtonContent
                    icon={<SendIcon />}
                    label="Send text only"
                    compactLabel="Send"
                  />
                </button>
                <button
                  type="button"
                  className="primary-button"
                  aria-label="Send and press Enter"
                  disabled={props.pending || !terminalInput.trim()}
                  onClick={() => {
                    props.onSendInput(terminalInput, true);
                    setTerminalInput("");
                  }}
                >
                  <ButtonContent
                    icon={<EnterIcon />}
                    label="Send and press Enter"
                    compactLabel="Send + Enter"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {props.error ? (
          <div className="error-row" role="alert">
            {props.error}
          </div>
        ) : null}

        <div
          className={`orchestrator-control-grid orchestrator-workspace-panel orchestrator-board-card orchestrator-board-card-delegate ${
            activeWorkspaceView === "delegate" ? "is-active" : ""
          }`}
          data-mobile-visible={activeWorkspaceView === "delegate"}
          hidden={activeWorkspaceView !== "delegate"}
        >
          <div className="settings-card orchestrator-primary-action">
            <label className="field-group grow">
              <span>Delegate a CLI task</span>
              <SingleAttachmentPicker
                file={delegateAttachment}
                pending={props.pending}
                onChange={setDelegateAttachment}
              />
              <textarea
                className="orchestrator-delegate-input"
                value={delegatePrompt}
                onChange={(event) => setDelegatePrompt(event.target.value)}
                rows={5}
                placeholder={delegatePromptPlaceholder(
                  props.session,
                  activeJob
                )}
              />
            </label>
            {supportsProviderSessionResume(props.session.cliProvider) ? (
              <label className="field-group">
                <span>Continue from previous session ID</span>
                <input
                  value={delegateProviderSessionId}
                  onChange={(event) =>
                    setDelegateProviderSessionId(event.target.value)
                  }
                  placeholder="Leave blank to start a fresh task session"
                  autoComplete="off"
                />
                <small className="field-note">
                  {delegateProviderSessionId.trim()
                    ? "Used only for this delegated task."
                    : "Leave blank to always start a fresh coding agent session."}
                </small>
              </label>
            ) : null}
            <div className="composer-footer orchestrator-delegate-footer">
              <div className="composer-meta">
                <span className="orchestrator-command-hint">
                  Uses{" "}
                  <code>
                    {buildDelegationCommandHint(
                      props.session,
                      delegateProviderSessionId
                    )}
                  </code>
                </span>
                <span>
                  Custom agent: {selectedSavedCustomAgent?.name ?? "None"}
                </span>
                {delegateProviderSessionId.trim() ? (
                  <span>
                    Next task resumes coding agent session{" "}
                    {delegateProviderSessionId.trim()}
                  </span>
                ) : supportsProviderSessionResume(props.session.cliProvider) ? (
                  <span>
                    {props.session.cliProvider === "copilot"
                      ? "Blank starts a fresh Copilot task session."
                      : props.session.cliProvider === "antigravity"
                        ? "Blank starts a fresh Google Antigravity conversation."
                        : "Set a coding agent session ID to continue an existing conversation."}
                  </span>
                ) : null}
                <span>
                  {activeJob
                    ? `${queuedJobs.length} already queued • starts automatically when the pane is free`
                    : "Starts immediately in the current tmux pane"}
                </span>
              </div>
              <button
                type="button"
                className="primary-button"
                aria-label={props.pending ? "Queueing..." : delegateButtonLabel}
                disabled={
                  props.pending ||
                  (!delegatePrompt.trim() && !delegateAttachment)
                }
                onClick={() => {
                  props.onDelegate({
                    prompt: delegatePrompt.trim(),
                    attachment: delegateAttachment,
                    providerSessionId:
                      delegateProviderSessionId.trim() || undefined,
                  });
                  setDelegatePrompt("");
                  setDelegateProviderSessionId("");
                  setDelegateAttachment(undefined);
                }}
              >
                <ButtonContent
                  icon={<DelegateIcon />}
                  label={props.pending ? "Queueing..." : delegateButtonLabel}
                  compactLabel={
                    props.pending ? "Queueing..." : delegateButtonCompactLabel
                  }
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <nav
        className="orchestrator-mobile-nav"
        aria-label="Mobile workspace views"
      >
        <button
          type="button"
          className={
            activeWorkspaceView === "queue"
              ? "mobile-workspace-tab is-active"
              : "mobile-workspace-tab"
          }
          data-workspace-target="queue"
          onClick={() => handleSelectWorkspaceView("queue")}
        >
          <span className="mobile-nav-icon" aria-hidden="true">
            <QueueIcon />
          </span>
          Queue
        </button>
        <button
          type="button"
          className={
            activeWorkspaceView === "delegate"
              ? "mobile-workspace-tab is-active"
              : "mobile-workspace-tab"
          }
          data-workspace-target="delegate"
          onClick={() => handleSelectWorkspaceView("delegate")}
        >
          <span className="mobile-nav-icon" aria-hidden="true">
            <DelegateIcon />
          </span>
          Delegate
        </button>
        <button
          type="button"
          className={
            activeWorkspaceView === "terminal"
              ? "mobile-workspace-tab is-active"
              : "mobile-workspace-tab"
          }
          data-workspace-target="terminal"
          onClick={() => handleSelectWorkspaceView("terminal")}
        >
          <span className="mobile-nav-icon" aria-hidden="true">
            <TerminalIcon />
          </span>
          Terminal
        </button>
        <button
          type="button"
          className={
            activeWorkspaceView === "changes"
              ? "mobile-workspace-tab is-active"
              : "mobile-workspace-tab"
          }
          data-workspace-target="changes"
          onClick={() => handleSelectWorkspaceView("changes")}
        >
          <span className="mobile-nav-icon" aria-hidden="true">
            <ChangesIcon />
          </span>
          Changes
        </button>
        <button
          type="button"
          className={
            activeWorkspaceView === "settings"
              ? "mobile-workspace-tab is-active"
              : "mobile-workspace-tab"
          }
          data-workspace-target="settings"
          onClick={() => handleSelectWorkspaceView("settings")}
        >
          <span className="mobile-nav-icon" aria-hidden="true">
            <SettingsIcon />
          </span>
          Settings
        </button>
      </nav>
    </section>
  );
}

function getTerminalTailStartOffset(session?: OrchestratorSession): number {
  if (!session) {
    return 0;
  }

  return Math.max(
    0,
    session.logSize - new TextEncoder().encode(session.terminalTail).length
  );
}

function resolveAnsiComponent(
  moduleExport: unknown
): (props: AnsiComponentProps) => ReactNode {
  if (typeof moduleExport === "function") {
    return moduleExport as (props: AnsiComponentProps) => ReactNode;
  }
  if (!moduleExport || typeof moduleExport !== "object") {
    throw new Error("ansi-to-react did not export a React component.");
  }

  const levelOneDefault =
    "default" in moduleExport ? moduleExport.default : undefined;
  if (typeof levelOneDefault === "function") {
    return levelOneDefault as (props: AnsiComponentProps) => ReactNode;
  }
  if (
    levelOneDefault &&
    typeof levelOneDefault === "object" &&
    "default" in levelOneDefault &&
    typeof levelOneDefault.default === "function"
  ) {
    return levelOneDefault.default as (props: AnsiComponentProps) => ReactNode;
  }

  throw new Error("ansi-to-react did not export a React component.");
}

function ButtonContent(props: {
  icon: ReactNode;
  label: string;
  compactLabel?: string;
}) {
  return (
    <span className="orchestrator-action-content">
      <span className="orchestrator-button-icon" aria-hidden="true">
        {props.icon}
      </span>
      <span className="orchestrator-button-label">{props.label}</span>
      {props.compactLabel ? (
        <span className="orchestrator-button-label-compact" aria-hidden="true">
          {props.compactLabel}
        </span>
      ) : null}
    </span>
  );
}

function TerminalResizeHandle(props: {
  height: number;
  onHeightChange?: (height: number) => void;
}) {
  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    const onHeightChange = props.onHeightChange;
    if (!onHeightChange) {
      return;
    }

    event.preventDefault();
    const element = event.currentTarget;
    const startY = event.clientY;
    const startHeight = props.height;
    element.setPointerCapture(event.pointerId);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      onHeightChange(
        clampOrchestratorTerminalHeight(
          startHeight + moveEvent.clientY - startY
        )
      );
    };
    const handlePointerFinish = (finishEvent: PointerEvent) => {
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerup", handlePointerFinish);
      element.removeEventListener("pointercancel", handlePointerFinish);
      if (element.hasPointerCapture(finishEvent.pointerId)) {
        element.releasePointerCapture(finishEvent.pointerId);
      }
    };

    element.addEventListener("pointermove", handlePointerMove);
    element.addEventListener("pointerup", handlePointerFinish);
    element.addEventListener("pointercancel", handlePointerFinish);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    const onHeightChange = props.onHeightChange;
    if (!onHeightChange) {
      return;
    }

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        onHeightChange(clampOrchestratorTerminalHeight(props.height - 24));
        break;
      case "ArrowDown":
        event.preventDefault();
        onHeightChange(clampOrchestratorTerminalHeight(props.height + 24));
        break;
      case "Home":
        event.preventDefault();
        onHeightChange(MIN_ORCHESTRATOR_TERMINAL_HEIGHT);
        break;
      case "End":
        event.preventDefault();
        onHeightChange(MAX_ORCHESTRATOR_TERMINAL_HEIGHT);
        break;
      default:
        break;
    }
  }

  return (
    <button
      type="button"
      className="terminal-resize-handle"
      aria-label="Resize tmux output"
      title="Drag to resize. Use arrow keys to resize when focused. Double-click to reset."
      disabled={!props.onHeightChange}
      onDoubleClick={() =>
        props.onHeightChange?.(DEFAULT_ORCHESTRATOR_TERMINAL_HEIGHT)
      }
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
    />
  );
}

function humanizeJobStatus(status: OrchestratorJob["status"]): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "running":
      return "Running";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
  }
}

function describeJobProgress(job: OrchestratorJob): string {
  switch (job.status) {
    case "queued":
      return `Queued ${formatTimestamp(job.submittedAt)}`;
    case "running":
      return `Started ${formatTimestamp(job.startedAt ?? job.submittedAt)}`;
    case "completed":
      return `Finished ${formatTimestamp(job.completedAt ?? job.submittedAt)}`;
    case "failed":
      return `Failed ${formatTimestamp(job.completedAt ?? job.submittedAt)}`;
  }
}

function describeSchedule(schedule: OrchestratorSchedule): string {
  const base =
    schedule.frequency === "daily"
      ? `Every day at ${schedule.timeOfDay}`
      : schedule.frequency === "weekly"
        ? `Every ${humanizeDayOfWeek(schedule.dayOfWeek)} at ${schedule.timeOfDay}`
        : `Every month on day ${schedule.dayOfMonth ?? 1} at ${schedule.timeOfDay}`;
  return `${base} (${schedule.timezone})`;
}

function formatJobTimestamp(job: OrchestratorJob): string {
  switch (job.status) {
    case "queued":
      return `Submitted ${formatTimestamp(job.submittedAt)}`;
    case "running":
      return `Running since ${formatTimestamp(job.startedAt ?? job.submittedAt)}`;
    case "completed":
      return `Completed ${formatTimestamp(job.completedAt ?? job.submittedAt)}`;
    case "failed":
      return `Failed ${formatTimestamp(job.completedAt ?? job.submittedAt)}`;
  }
}

function formatTimestamp(timestamp: string): string {
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) {
    return timestamp;
  }
  return value.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function canRetryJob(job: OrchestratorJob): boolean {
  return (
    typeof job.prompt === "string" ||
    typeof job.promptPath === "string" ||
    typeof job.attachment !== "undefined"
  );
}

function humanizeDayOfWeek(day: OrchestratorSchedule["dayOfWeek"]): string {
  if (!day) {
    return "Monday";
  }
  return `${day.slice(0, 1).toUpperCase()}${day.slice(1)}`;
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.32 7.32 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.23-1.13.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64L4.86 10.7c-.05.31-.08.64-.08.97s.03.65.08.97l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.5.39 1.05.71 1.63.94l.36 2.54c.04.24.25.42.49.42h3.8c.24 0 .45-.18.49-.42l.36-2.54c.58-.23 1.13-.55 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.02-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"
      />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v3A1.5 1.5 0 0 1 18.5 10h-13A1.5 1.5 0 0 1 4 8.5v-3Zm0 10A1.5 1.5 0 0 1 5.5 14h13a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-3Z"
      />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm1.9 3.4L8.5 11l-2.6 2.6L7.3 15 11.3 11 7.3 7 5.9 8.4ZM12 15h6v-2h-6v2Z"
      />
    </svg>
  );
}

function ChangesIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 3h10v2H7V3Zm0 6h10v2H7V9Zm0 6h6v2H7v-2Zm10.59-1.41L20 16l-5 5-3-3 1.41-1.41L15 18.17l3.59-3.58Z"
      />
    </svg>
  );
}

function CancelIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.5A9.5 9.5 0 1 0 21.5 12 9.51 9.51 0 0 0 12 2.5Zm4.15 12.24-1.41 1.41L12 13.41l-2.74 2.74-1.41-1.41L10.59 12 7.85 9.26l1.41-1.41L12 10.59l2.74-2.74 1.41 1.41L13.41 12Z"
      />
    </svg>
  );
}

function DelegateIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path fill="currentColor" d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path fill="currentColor" d="M3 20.5v-7l8-1.5-8-1.5v-7L21 12 3 20.5Z" />
    </svg>
  );
}

function EnterIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19 4h-2v8H7.83l2.58-2.59L9 8l-5 5 5 5 1.41-1.41L7.83 14H19V4Z"
      />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17 3H5a2 2 0 0 0-2 2v14.01A1.99 1.99 0 0 0 5 21h14a2 2 0 0 0 2-1.99V7Zm-5 16a3 3 0 1 1 3-3 3 3 0 0 1-3 3Zm3-10H5V5h10Z"
      />
    </svg>
  );
}

function RestartIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 5a7 7 0 1 1-6.71 9h2.1A5 5 0 1 0 8.46 8.46L11 11H4V4l3.04 3.04A6.97 6.97 0 0 1 12 5Z"
      />
    </svg>
  );
}

function ScrollIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 3h7a5 5 0 0 1 0 10H9v4.17l1.59-1.58L12 17l-4 4-4-4 1.41-1.41L7 17.17V3Zm2 8h5a3 3 0 1 0 0-6H9v6Z"
      />
    </svg>
  );
}
