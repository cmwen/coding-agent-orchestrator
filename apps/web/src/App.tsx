import type {
  ModelDescriptor,
  OrchestratorCapabilities,
  OrchestratorSchedule,
  OrchestratorScheduleCreateRequest,
  OrchestratorScheduleUpdateRequest,
  OrchestratorSession,
  OrchestratorSessionCreateRequest,
  OrchestratorSessionUpdateRequest,
  WorkspaceSummary,
} from "@coding-agent-orchestrator/shared";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "./api";
import { toAttachmentUpload } from "./attachments";
import type { CommandPaletteItem } from "./command-palette";
import { CommandPalette } from "./components/CommandPalette";
import { DangerConfirmModal } from "./components/DangerConfirmModal";
import { OrchestratorPane } from "./components/OrchestratorPane";

const DEFAULT_MODEL_ID = "gpt-5-mini";
const SELECTED_SESSION_KEY = "coding-agent-orchestrator:selected-session";

const CLI_MODELS: ModelDescriptor[] = [
  {
    id: "auto",
    displayName: "Auto (Copilot chooses)",
    runtimeProvider: "copilot",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-5.4",
    displayName: "GPT-5.4",
    runtimeProvider: "copilot",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-5.3-codex",
    displayName: "GPT-5.3 Codex",
    runtimeProvider: "copilot",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-5.2-codex",
    displayName: "GPT-5.2 Codex",
    runtimeProvider: "copilot",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-5.2",
    displayName: "GPT-5.2",
    runtimeProvider: "copilot",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-5.4-mini",
    displayName: "GPT-5.4 Mini",
    runtimeProvider: "copilot",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-5-mini",
    displayName: "GPT-5 Mini",
    runtimeProvider: "copilot",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-4.1",
    displayName: "GPT-4.1",
    runtimeProvider: "copilot",
    supportedReasoningEfforts: [],
  },
  {
    id: "claude-sonnet-4.6",
    displayName: "Claude Sonnet 4.6",
    runtimeProvider: "copilot",
    supportedReasoningEfforts: [],
  },
  {
    id: "claude-sonnet-4.5",
    displayName: "Claude Sonnet 4.5",
    runtimeProvider: "copilot",
    supportedReasoningEfforts: [],
  },
  {
    id: "claude-haiku-4.5",
    displayName: "Claude Haiku 4.5",
    runtimeProvider: "copilot",
    supportedReasoningEfforts: [],
  },
  {
    id: "gemini-3.1-pro",
    displayName: "Gemini 3.1 Pro",
    runtimeProvider: "gemini",
    supportedReasoningEfforts: [],
  },
  {
    id: "gemini-3-pro",
    displayName: "Gemini 3 Pro",
    runtimeProvider: "gemini",
    supportedReasoningEfforts: [],
  },
  {
    id: "gemini-3-flash",
    displayName: "Gemini 3 Flash",
    runtimeProvider: "gemini",
    supportedReasoningEfforts: [],
  },
  {
    id: "gemini-2.5-pro",
    displayName: "Gemini 2.5 Pro",
    runtimeProvider: "gemini",
    supportedReasoningEfforts: [],
  },
  {
    id: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    runtimeProvider: "gemini",
    supportedReasoningEfforts: [],
  },
  {
    id: "gemini-2.0-flash",
    displayName: "Gemini 2.0 Flash",
    runtimeProvider: "gemini",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-5.5",
    displayName: "GPT-5.5",
    runtimeProvider: "codex",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-5.5-pro",
    displayName: "GPT-5.5 Pro",
    runtimeProvider: "codex",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-5.4",
    displayName: "GPT-5.4",
    runtimeProvider: "codex",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-5.4-mini",
    displayName: "GPT-5.4 Mini",
    runtimeProvider: "codex",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-5.4-nano",
    displayName: "GPT-5.4 Nano",
    runtimeProvider: "codex",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-5.3-codex",
    displayName: "GPT-5.3 Codex",
    runtimeProvider: "codex",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-5.2-codex",
    displayName: "GPT-5.2 Codex",
    runtimeProvider: "codex",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-5.2",
    displayName: "GPT-5.2",
    runtimeProvider: "codex",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-5",
    displayName: "GPT-5",
    runtimeProvider: "codex",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-5-mini",
    displayName: "GPT-5 Mini",
    runtimeProvider: "codex",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-4.1",
    displayName: "GPT-4.1",
    runtimeProvider: "codex",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-4.1-mini",
    displayName: "GPT-4.1 Mini",
    runtimeProvider: "codex",
    supportedReasoningEfforts: [],
  },
  {
    id: "gpt-4.1-nano",
    displayName: "GPT-4.1 Nano",
    runtimeProvider: "codex",
    supportedReasoningEfforts: [],
  },
  {
    id: "o3",
    displayName: "o3",
    runtimeProvider: "codex",
    supportedReasoningEfforts: [],
  },
  {
    id: "o4",
    displayName: "o4",
    runtimeProvider: "codex",
    supportedReasoningEfforts: [],
  },
  {
    id: "o4-mini",
    displayName: "o4-mini",
    runtimeProvider: "codex",
    supportedReasoningEfforts: [],
  },
  {
    id: "opencode-latest",
    displayName: "OpenCode Latest",
    runtimeProvider: "opencode",
    supportedReasoningEfforts: [],
  },
];

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceSummary>();
  const [capabilities, setCapabilities] = useState<OrchestratorCapabilities>();
  const [sessions, setSessions] = useState<OrchestratorSession[]>([]);
  const [schedules, setSchedules] = useState<OrchestratorSchedule[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<
    string | undefined
  >(() => localStorage.getItem(SELECTED_SESSION_KEY) ?? undefined);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("coding-agent-orchestrator:theme");
    if (saved === "light") return "light";
    return "dark";
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState<
    string | undefined
  >();
  const [removeSessionModalOpen, setRemoveSessionModalOpen] = useState(false);
  const [removingSessions, setRemovingSessions] = useState(false);
  const sessionNavRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) {
      return undefined;
    }
    return (
      sessions.find((session) => session.sessionId === selectedSessionId) ??
      sessions[0]
    );
  }, [selectedSessionId, sessions]);
  const projectPathSuggestions = useMemo(
    () =>
      [
        ...(capabilities?.recentProjectPaths ?? []),
        ...sessions.map((session) => session.projectPath),
      ].filter((value, index, all) => all.indexOf(value) === index),
    [capabilities?.recentProjectPaths, sessions]
  );
  const commandPaletteItems = useMemo(
    () =>
      buildOrchestratorCommandPaletteItems(
        sessions,
        selectedSession?.sessionId,
        theme
      ),
    [selectedSession?.sessionId, sessions, theme]
  );
  const pendingDeleteSession = useMemo(
    () =>
      pendingDeleteSessionId
        ? sessions.find(
            (session) => session.sessionId === pendingDeleteSessionId
          )
        : undefined,
    [pendingDeleteSessionId, sessions]
  );

  useEffect(() => {
    void refreshAll();
  }, []);

  useEffect(() => {
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.shiftKey &&
        !event.altKey &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setCommandPaletteOpen((current) => !current);
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown);
    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, []);

  useEffect(() => {
    if (selectedSession?.sessionId) {
      localStorage.setItem(SELECTED_SESSION_KEY, selectedSession.sessionId);
      return;
    }
    localStorage.removeItem(SELECTED_SESSION_KEY);
  }, [selectedSession?.sessionId]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("coding-agent-orchestrator:theme", theme);
  }, [theme]);

  useEffect(() => {
    if (
      pendingDeleteSessionId &&
      !sessions.some((session) => session.sessionId === pendingDeleteSessionId)
    ) {
      setPendingDeleteSessionId(undefined);
      setRemoveSessionModalOpen(false);
    }
  }, [pendingDeleteSessionId, sessions]);

  async function refreshAll() {
    setPending(true);
    setError(undefined);
    try {
      const [workspaceSummary, capabilitySummary, sessionList, scheduleList] =
        await Promise.all([
          api.getWorkspace(),
          api.getOrchestratorCapabilities(),
          api.listOrchestratorSessions(),
          api.listOrchestratorSchedules(),
        ]);
      setWorkspace(workspaceSummary);
      setCapabilities(capabilitySummary);
      setSessions(sessionList);
      setSchedules(scheduleList);
      if (
        selectedSessionId &&
        !sessionList.some((session) => session.sessionId === selectedSessionId)
      ) {
        setSelectedSessionId(sessionList[0]?.sessionId);
      }
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setPending(false);
    }
  }

  async function withRefresh<T>(
    operation: () => Promise<T>
  ): Promise<T | undefined> {
    setPending(true);
    setError(undefined);
    try {
      const result = await operation();
      await refreshAll();
      return result;
    } catch (operationError) {
      setError(errorMessage(operationError));
    } finally {
      setPending(false);
    }
  }

  function applySessionUpdate(session: OrchestratorSession) {
    setSessions((current) => {
      const without = current.filter(
        (candidate) => candidate.sessionId !== session.sessionId
      );
      return [session, ...without].sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt)
      );
    });
    setSelectedSessionId(session.sessionId);
  }

  function focusSessionNavButton(sessionId: string) {
    sessionNavRefs.current[sessionId]?.focus();
  }

  function handleSessionNavKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    sessionId: string
  ) {
    const sessionNavOrder = [
      "new-session",
      ...sessions.map((s) => s.sessionId),
    ];
    const currentIndex = sessionNavOrder.indexOf(sessionId);
    if (currentIndex < 0) {
      return;
    }

    const moveFocusToIndex = (index: number) => {
      const clampedIndex = Math.max(
        0,
        Math.min(sessionNavOrder.length - 1, index)
      );
      const nextSessionId = sessionNavOrder[clampedIndex];
      if (!nextSessionId) {
        return;
      }
      focusSessionNavButton(nextSessionId);
    };

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveFocusToIndex(currentIndex + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveFocusToIndex(currentIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        moveFocusToIndex(0);
        break;
      case "End":
        event.preventDefault();
        moveFocusToIndex(sessionNavOrder.length - 1);
        break;
      default:
        break;
    }
  }

  function handlePaletteSelect(item: CommandPaletteItem) {
    if (item.kind === "session") {
      setSelectedSessionId(item.sessionId);
      setCommandPaletteOpen(false);
      return;
    }

    if (item.kind === "agent") {
      setSelectedSessionId(undefined);
      setCommandPaletteOpen(false);
      return;
    }

    if (item.actionId === "new-session") {
      setSelectedSessionId(undefined);
    } else if (item.actionId === "open-settings") {
      setTheme((current) => (current === "dark" ? "light" : "dark"));
    } else if (item.actionId === "toggle-sidebar") {
      void refreshAll();
    } else if (item.actionId === "focus-composer") {
      window.requestAnimationFrame(() => {
        document
          .querySelector<HTMLTextAreaElement>(".orchestrator-main textarea")
          ?.focus();
      });
    }

    setCommandPaletteOpen(false);
  }

  function handleOpenRemoveSessionModal(sessionId: string) {
    setPendingDeleteSessionId(sessionId);
    setRemoveSessionModalOpen(true);
  }

  function handleCloseRemoveSessionModal() {
    setRemoveSessionModalOpen(false);
    setPendingDeleteSessionId(undefined);
  }

  async function handleConfirmRemoveSession() {
    if (!pendingDeleteSession) {
      return;
    }

    setRemovingSessions(true);
    const removedSessionId = await withRefresh(async () => {
      await api.deleteOrchestratorSession(pendingDeleteSession.sessionId);
      return pendingDeleteSession.sessionId;
    });
    setRemovingSessions(false);

    if (!removedSessionId) {
      return;
    }

    handleCloseRemoveSessionModal();
  }

  return (
    <main className="orchestrator-app-shell">
      <aside className="orchestrator-sidebar" aria-label="Sessions">
        <div className="orchestrator-brand">
          <div>
            <div className="eyebrow">Personal PWA</div>
            <h1>Coding Agent CLI Orchestrator</h1>
          </div>
          <div className="orchestrator-brand-actions">
            <button
              className="ghost-button orchestrator-icon-button"
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              className="ghost-button orchestrator-icon-button"
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              aria-label="Open command palette"
              aria-keyshortcuts="Control+K Meta+K"
              title="Open command palette (Cmd/Ctrl+K)"
            >
              <CommandIcon />
            </button>
            <button
              className="ghost-button orchestrator-icon-button"
              type="button"
              onClick={() => void refreshAll()}
              disabled={pending}
              aria-label="Refresh sessions"
              title="Refresh sessions"
            >
              <RefreshIcon />
            </button>
          </div>
        </div>
        <div className="orchestrator-sidebar-meta">
          <span>
            {capabilities?.tmuxInstalled ? "tmux ready" : "tmux missing"}
          </span>
          <span>{workspace?.storeRoot ?? "Loading store"}</span>
        </div>
        <div className="orchestrator-sidebar-section">
          <button
            ref={(element) => {
              sessionNavRefs.current["new-session"] = element;
            }}
            className={`orchestrator-session-link orchestrator-new-session-link ${
              !selectedSession ? "active" : ""
            }`}
            type="button"
            onClick={() => {
              setSelectedSessionId(undefined);
            }}
            onKeyDown={(event) => handleSessionNavKeyDown(event, "new-session")}
          >
            <span>New session</span>
            <small>Start a fresh tmux-backed workspace</small>
          </button>
        </div>
        <div className="orchestrator-session-list-meta">
          <span className="panel-caption">
            {sessions.length} saved session{sessions.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="orchestrator-session-list">
          {sessions.map((session) => (
            <div className="orchestrator-session-row" key={session.sessionId}>
              <button
                ref={(element) => {
                  sessionNavRefs.current[session.sessionId] = element;
                }}
                className={`orchestrator-session-link ${
                  session.sessionId === selectedSession?.sessionId
                    ? "active"
                    : ""
                }`}
                type="button"
                onClick={() => setSelectedSessionId(session.sessionId)}
                onKeyDown={(event) =>
                  handleSessionNavKeyDown(event, session.sessionId)
                }
              >
                <span>{session.title}</span>
                <small>
                  {session.status} ·{" "}
                  {new Date(session.updatedAt).toLocaleString()}
                </small>
              </button>
              <button
                type="button"
                className="ghost-button danger-button orchestrator-session-delete-button"
                aria-label={`Delete session: ${session.title}`}
                title={`Delete ${session.title}`}
                disabled={pending}
                onClick={() => handleOpenRemoveSessionModal(session.sessionId)}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className="orchestrator-main" aria-label="Orchestrator">
        <OrchestratorPane
          capabilities={capabilities}
          session={selectedSession}
          schedules={
            selectedSession
              ? schedules.filter(
                  (schedule) => schedule.sessionId === selectedSession.sessionId
                )
              : schedules
          }
          models={CLI_MODELS}
          defaultCliProvider={capabilities?.defaultCliProvider ?? "copilot"}
          defaultModelId={DEFAULT_MODEL_ID}
          allSessions={sessions}
          projectPathSuggestions={projectPathSuggestions}
          pending={pending}
          error={error}
          onCreateSession={(request: OrchestratorSessionCreateRequest) => {
            void withRefresh(async () => {
              const session = await api.createOrchestratorSession(request);
              applySessionUpdate(session);
            });
          }}
          onUpdateSession={(request: OrchestratorSessionUpdateRequest) => {
            if (!selectedSession) {
              return;
            }
            void withRefresh(async () => {
              const session = await api.updateOrchestratorSession(
                selectedSession.sessionId,
                request
              );
              applySessionUpdate(session);
            });
          }}
          onSelectSession={setSelectedSessionId}
          onDeleteOlderDuplicate={(sessionId) => {
            void withRefresh(async () => {
              await api.deleteOrchestratorSession(sessionId);
            });
          }}
          onDelegate={(request) => {
            if (!selectedSession) {
              return;
            }
            void withRefresh(async () => {
              const attachment = request.attachment
                ? await toAttachmentUpload(request.attachment)
                : undefined;
              const session = await api.delegateOrchestratorJob(
                selectedSession.sessionId,
                {
                  prompt: request.prompt,
                  providerSessionId: request.providerSessionId,
                  attachment,
                }
              );
              applySessionUpdate(session);
            });
          }}
          onSendInput={(input, submit) => {
            if (!selectedSession) {
              return;
            }
            void withRefresh(async () => {
              const session = await api.sendOrchestratorInput(
                selectedSession.sessionId,
                { input, submit }
              );
              applySessionUpdate(session);
            });
          }}
          onCancelJob={() => {
            if (!selectedSession) {
              return;
            }
            void withRefresh(async () => {
              const session = await api.cancelOrchestratorJob(
                selectedSession.sessionId
              );
              applySessionUpdate(session);
            });
          }}
          onRestartSession={() => {
            if (!selectedSession) {
              return;
            }
            void withRefresh(async () => {
              const session = await api.restartOrchestratorSession(
                selectedSession.sessionId
              );
              applySessionUpdate(session);
            });
          }}
          onRetryFailedJob={(jobId) => {
            if (!selectedSession) {
              return;
            }
            void withRefresh(async () => {
              const session = await api.retryOrchestratorJob(
                selectedSession.sessionId,
                jobId
              );
              applySessionUpdate(session);
            });
          }}
          onDeleteQueuedJob={(jobId) => {
            if (!selectedSession) {
              return;
            }
            void withRefresh(async () => {
              const session = await api.deleteOrchestratorJob(
                selectedSession.sessionId,
                jobId
              );
              applySessionUpdate(session);
            });
          }}
          onCreateSchedule={(request: OrchestratorScheduleCreateRequest) => {
            void withRefresh(async () => {
              await api.createOrchestratorSchedule(request);
            });
          }}
          onUpdateSchedule={(
            scheduleId: string,
            request: OrchestratorScheduleUpdateRequest
          ) => {
            void withRefresh(async () => {
              await api.updateOrchestratorSchedule(scheduleId, request);
            });
          }}
          onDeleteSchedule={(scheduleId: string) => {
            void withRefresh(async () => {
              await api.deleteOrchestratorSchedule(scheduleId);
            });
          }}
          onSessionUpdate={applySessionUpdate}
        />
      </section>

      <CommandPalette
        open={commandPaletteOpen}
        items={commandPaletteItems}
        onClose={() => setCommandPaletteOpen(false)}
        onSelect={handlePaletteSelect}
      />
      <DangerConfirmModal
        open={removeSessionModalOpen}
        title="Remove orchestrator session"
        description={
          pendingDeleteSession
            ? `This permanently removes "${pendingDeleteSession.title}" from the app.`
            : "This permanently removes the selected orchestrator session from the app."
        }
        warning={
          pendingDeleteSession
            ? `Session history, terminal output, and queued work for "${pendingDeleteSession.title}" will be deleted.`
            : "Session history, terminal output, and queued work for this session will be deleted."
        }
        acknowledgeLabel="I understand this session will be permanently removed."
        confirmLabel="Remove session"
        busy={removingSessions}
        busyLabel="Removing session..."
        details={
          pendingDeleteSession ? [pendingDeleteSession.title] : undefined
        }
        onClose={handleCloseRemoveSessionModal}
        onConfirm={() => void handleConfirmRemoveSession()}
      />
    </main>
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected runtime error.";
}

function buildOrchestratorCommandPaletteItems(
  sessions: OrchestratorSession[],
  selectedSessionId: string | undefined,
  theme: "dark" | "light"
): CommandPaletteItem[] {
  const actionItems: CommandPaletteItem[] = [
    {
      id: "action:new-session",
      kind: "action",
      actionId: "new-session",
      group: "Actions",
      label: "Start new session",
      description: "Begin a fresh tmux-backed session.",
      searchText: "new session create tmux orchestrator",
      active: false,
    },
    {
      id: "action:open-settings",
      kind: "action",
      actionId: "open-settings",
      group: "Actions",
      label: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
      description: "Toggle the application theme.",
      searchText: "theme appearance dark light mode settings",
      active: false,
    },
    {
      id: "action:focus-composer",
      kind: "action",
      actionId: "focus-composer",
      group: "Actions",
      label: "Focus prompt composer",
      description: "Move focus to the main prompt textarea.",
      searchText: "focus prompt composer textarea delegate input",
      active: false,
    },
    {
      id: "action:toggle-sidebar",
      kind: "action",
      actionId: "toggle-sidebar",
      group: "Actions",
      label: "Refresh sessions",
      description: "Reload sessions, schedules, and capabilities.",
      searchText: "refresh reload sessions schedules capabilities",
      active: false,
    },
  ];

  const sessionItems: CommandPaletteItem[] = sessions.map((session) => ({
    id: `session:orchestrator:${session.sessionId}`,
    kind: "session",
    group: "Chats",
    agentId: "orchestrator",
    sessionId: session.sessionId,
    label: session.title,
    description: `${session.status} - ${new Date(session.updatedAt).toLocaleString()}`,
    searchText:
      `${session.title} ${session.projectPath} ${session.status} ${session.sessionId}`.toLowerCase(),
    active: session.sessionId === selectedSessionId,
  }));

  return [
    ...actionItems,
    {
      id: "agent:orchestrator",
      kind: "agent",
      group: "Agents",
      agentId: "orchestrator",
      label: "CLI Orchestrator",
      description: "Show the new-session composer.",
      searchText: "orchestrator tmux agent create new session",
      active: !selectedSessionId,
    },
    ...sessionItems,
  ];
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.76 4.84 5.35 3.43 3.93 4.84l1.41 1.41 1.42-1.41Zm10.49 0 1.41-1.41 1.42 1.41-1.41 1.41-1.42-1.41ZM12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0-3h1.5v2.5H12V2Zm0 19.5h1.5V24H12v-2.5ZM2 10.5h2.5V12H2v-1.5Zm19.5 0H24V12h-2.5v-1.5ZM5.34 17.76l-1.41 1.41 1.42 1.4 1.41-1.4-1.42-1.41Zm13.32 0-1.41 1.41 1.41 1.4 1.41-1.4-1.41-1.41Z"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14.53 2.08A9.96 9.96 0 0 0 12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10c4.19 0 7.78-2.58 9.27-6.24A8.5 8.5 0 0 1 14.53 2.08Z"
      />
    </svg>
  );
}

function CommandIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 3a4 4 0 1 0 0 8h1v2H9a4 4 0 1 0 4 4v-1h2v1a4 4 0 1 0 4-4h-1v-2h1a4 4 0 1 0-4-4v1h-2V7a4 4 0 0 0-4-4Zm0 2a2 2 0 1 1 0 4h-1V7a2 2 0 0 1 1-2Zm8 0a2 2 0 1 1-2 2V5h2Zm-7 6h4v2h-4v-2Zm-3 4h1v2a2 2 0 1 1-1-2Zm10 0h2a2 2 0 1 1-2 2v-2Z"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 5a7 7 0 0 1 6.3 3.95L20 6.75V13h-6.25l2.76-2.76A4.99 4.99 0 0 0 7 12a5 5 0 0 0 8.66 3.41l1.42 1.42A7 7 0 1 1 12 5Z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h2v8H7V9Zm4 0h2v8h-2V9Zm4 0h2v8h-2V9ZM6 21a2 2 0 0 1-2-2V7h16v12a2 2 0 0 1-2 2H6Z"
      />
    </svg>
  );
}
