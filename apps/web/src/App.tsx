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

  return (
    <main className="orchestrator-app-shell">
      <aside className="orchestrator-sidebar" aria-label="Sessions">
        <div className="orchestrator-brand">
          <div>
            <div className="eyebrow">Personal PWA</div>
            <h1>Coding Agent CLI Orchestrator</h1>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="ghost-button"
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              aria-label="Open command palette"
              aria-keyshortcuts="Control+K Meta+K"
              title="Open command palette (Cmd/Ctrl+K)"
            >
              Commands
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={() => void refreshAll()}
              disabled={pending}
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="orchestrator-sidebar-meta">
          <span>
            {capabilities?.tmuxInstalled ? "tmux ready" : "tmux missing"}
          </span>
          <span>{workspace?.storeRoot ?? "Loading store"}</span>
        </div>
        <button
          ref={(element) => {
            sessionNavRefs.current["new-session"] = element;
          }}
          className={`orchestrator-session-link ${
            !selectedSession ? "active" : ""
          }`}
          type="button"
          onClick={() => setSelectedSessionId(undefined)}
          onKeyDown={(event) => handleSessionNavKeyDown(event, "new-session")}
        >
          <span>New session</span>
          <small>Create a tmux-backed workspace</small>
        </button>
        <div className="orchestrator-session-list">
          {sessions.map((session) => (
            <button
              ref={(element) => {
                sessionNavRefs.current[session.sessionId] = element;
              }}
              className={`orchestrator-session-link ${
                session.sessionId === selectedSession?.sessionId ? "active" : ""
              }`}
              type="button"
              key={session.sessionId}
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
          onDeleteOlderDuplicates={(sessionIds) => {
            void withRefresh(async () => {
              await Promise.all(
                sessionIds.map((sessionId) =>
                  api.deleteOrchestratorSession(sessionId)
                )
              );
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
