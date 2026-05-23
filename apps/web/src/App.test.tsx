// @vitest-environment jsdom

import type {
  OrchestratorCapabilities,
  OrchestratorSession,
  WorkspaceSummary,
} from "@coding-agent-orchestrator/shared";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const SELECTED_SESSION_KEY = "coding-agent-orchestrator:selected-session";

vi.mock("./components/OrchestratorPane", () => ({
  OrchestratorPane: ({
    session,
    onDeleteSession,
    onSessionMissing,
    onSessionUpdate,
  }: {
    session?: { sessionId: string };
    onDeleteSession?: () => void;
    onSessionMissing?: (sessionId: string) => void;
    onSessionUpdate?: (session: OrchestratorSession) => void;
  }) => (
    <div>
      <div data-testid="orchestrator-pane-mode">
        {session ? `existing:${session.sessionId}` : "new-session"}
      </div>
      {session ? (
        <button type="button" onClick={onDeleteSession}>
          Delete session
        </button>
      ) : null}
      <button type="button" onClick={() => onSessionMissing?.("session-1")}>
        Missing session
      </button>
      <button
        type="button"
        onClick={() =>
          onSessionUpdate?.({
            sessionId: "session-1",
            agentId: "copilot-orchestrator",
            title: "Existing session",
            startedAt: "2026-05-01T12:00:00Z",
            updatedAt: "2026-05-01T12:06:00Z",
            summary: "A previous session",
            projectPath: "/tmp/project",
            projectPurpose: "Existing work",
            cliProvider: "copilot",
            model: "gpt-5-mini",
            tmuxSessionName: "coding-agent-orchestrator-orchestrator",
            tmuxWindowName: "window-1",
            tmuxPaneId: "%1",
            status: "idle",
            activeJobId: undefined,
            lastJobId: undefined,
            availableCustomAgents: [],
            selectedCustomAgentId: undefined,
            executionMode: "standard",
            sessionDirectory: "/tmp/session-1",
            manifestPath: "/tmp/session-1/SESSION.md",
            jobs: [],
            terminalTail: "",
            logSize: 0,
          })
        }
      >
        Stale session update
      </button>
    </div>
  ),
}));

vi.mock("./components/CommandPalette", () => ({
  CommandPalette: () => null,
}));

const { deleteOrchestratorSession, sessionStore } = vi.hoisted(() => ({
  deleteOrchestratorSession: vi.fn(async () => ({ ok: true })),
  sessionStore: { current: [] as OrchestratorSession[] },
}));

vi.mock("./api", () => {
  const workspace: WorkspaceSummary = {
    storeRoot: "/tmp/store",
    copilotConfigDir: "/tmp/copilot",
    storeSkillDirectory: "/tmp/store-skills",
    copilotSkillDirectory: "/tmp/copilot-skills",
    agentCount: 1,
  };
  const capabilities: OrchestratorCapabilities = {
    available: true,
    defaultProjectPath: "/tmp/project",
    recentProjectPaths: ["/tmp/project"],
    tmuxInstalled: true,
    copilotInstalled: true,
    geminiInstalled: false,
    codexInstalled: false,
    opencodeInstalled: false,
    defaultCliProvider: "copilot",
    cliProviders: [
      {
        id: "copilot",
        displayName: "GitHub Copilot CLI",
        description: "Uses Copilot CLI",
        capabilities: {
          supportsCustomAgents: true,
          supportsExecutionMode: true,
        },
      },
    ],
    tmuxSessionName: "coding-agent-orchestrator-orchestrator",
  };
  return {
    api: {
      getWorkspace: vi.fn(async () => workspace),
      getOrchestratorCapabilities: vi.fn(async () => capabilities),
      listOrchestratorSessions: vi.fn(async () => sessionStore.current),
      listOrchestratorSchedules: vi.fn(async () => []),
      deleteOrchestratorSession,
    },
  };
});

afterEach(() => {
  cleanup();
  sessionStore.current = [
    {
      sessionId: "session-1",
      agentId: "copilot-orchestrator",
      title: "Existing session",
      startedAt: "2026-05-01T12:00:00Z",
      updatedAt: "2026-05-01T12:05:00Z",
      summary: "A previous session",
      projectPath: "/tmp/project",
      projectPurpose: "Existing work",
      cliProvider: "copilot",
      model: "gpt-5-mini",
      tmuxSessionName: "coding-agent-orchestrator-orchestrator",
      tmuxWindowName: "window-1",
      tmuxPaneId: "%1",
      status: "idle",
      activeJobId: undefined,
      lastJobId: undefined,
      availableCustomAgents: [],
      selectedCustomAgentId: undefined,
      executionMode: "standard",
      sessionDirectory: "/tmp/session-1",
      manifestPath: "/tmp/session-1/SESSION.md",
      jobs: [],
      terminalTail: "",
      logSize: 0,
    },
  ];
  localStorage.clear();
  vi.clearAllMocks();
});

sessionStore.current = [
  {
    sessionId: "session-1",
    agentId: "copilot-orchestrator",
    title: "Existing session",
    startedAt: "2026-05-01T12:00:00Z",
    updatedAt: "2026-05-01T12:05:00Z",
    summary: "A previous session",
    projectPath: "/tmp/project",
    projectPurpose: "Existing work",
    cliProvider: "copilot",
    model: "gpt-5-mini",
    tmuxSessionName: "coding-agent-orchestrator-orchestrator",
    tmuxWindowName: "window-1",
    tmuxPaneId: "%1",
    status: "idle",
    activeJobId: undefined,
    lastJobId: undefined,
    availableCustomAgents: [],
    selectedCustomAgentId: undefined,
    executionMode: "standard",
    sessionDirectory: "/tmp/session-1",
    manifestPath: "/tmp/session-1/SESSION.md",
    jobs: [],
    terminalTail: "",
    logSize: 0,
  },
];

describe("App", () => {
  it("switches to new-session mode when clicking New session", async () => {
    const user = userEvent.setup();
    localStorage.setItem(SELECTED_SESSION_KEY, "session-1");

    render(<App />);

    await waitFor(() =>
      expect(
        screen.getByTestId("orchestrator-pane-mode").textContent
      ).toContain("existing:session-1")
    );

    await user.click(screen.getByRole("button", { name: /New session/i }));

    await waitFor(() =>
      expect(screen.getByTestId("orchestrator-pane-mode").textContent).toBe(
        "new-session"
      )
    );
  });

  it("removes an orchestrator session after confirming in the modal", async () => {
    const user = userEvent.setup();

    render(<App />);

    await waitFor(() =>
      expect(screen.getByTestId("orchestrator-pane-mode").textContent).toBe(
        "new-session"
      )
    );

    await user.click(
      await screen.findByRole("button", { name: /Existing session/i })
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("orchestrator-pane-mode").textContent
      ).toContain("existing:session-1")
    );

    await user.click(screen.getByRole("button", { name: "Delete session" }));

    const dialog = screen.getByRole("dialog", {
      name: "Delete session",
    });
    expect(
      within(dialog).queryByRole("checkbox", {
        name: /I understand this session will be permanently removed/i,
      })
    ).toBeNull();

    await user.click(
      within(dialog).getByRole("button", { name: "Delete session" })
    );

    await waitFor(() =>
      expect(deleteOrchestratorSession).toHaveBeenCalledWith("session-1")
    );
  });

  it("drops a missing session and ignores stale session updates", async () => {
    const user = userEvent.setup();
    localStorage.setItem(SELECTED_SESSION_KEY, "session-1");

    render(<App />);

    await waitFor(() =>
      expect(
        screen.getByTestId("orchestrator-pane-mode").textContent
      ).toContain("existing:session-1")
    );

    sessionStore.current = [];

    await user.click(screen.getByRole("button", { name: "Missing session" }));

    await waitFor(() =>
      expect(screen.getByTestId("orchestrator-pane-mode").textContent).toBe(
        "new-session"
      )
    );

    await user.click(
      screen.getByRole("button", { name: "Stale session update" })
    );

    await waitFor(() =>
      expect(screen.getByTestId("orchestrator-pane-mode").textContent).toBe(
        "new-session"
      )
    );
  });

  it("pins the master session above standard sessions", async () => {
    sessionStore.current = [
      {
        sessionId: "master-session",
        agentId: "copilot-orchestrator",
        role: "master",
        title: "Master Session",
        startedAt: "2026-05-01T11:00:00Z",
        updatedAt: "2026-05-01T12:10:00Z",
        summary: "Coordinate the workspace",
        projectPath: "/tmp/master",
        projectPurpose: "Coordinate the workspace",
        cliProvider: "copilot",
        model: "gpt-5-mini",
        tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        tmuxWindowName: "master-window",
        tmuxPaneId: "%99",
        status: "idle",
        activeJobId: undefined,
        lastJobId: undefined,
        availableCustomAgents: [],
        selectedCustomAgentId: undefined,
        executionMode: "standard",
        sessionDirectory: "/tmp/master-session",
        manifestPath: "/tmp/master-session/SESSION.md",
        jobs: [],
        terminalTail: "",
        logSize: 0,
      },
      ...sessionStore.current,
    ];

    render(<App />);

    await waitFor(() =>
      expect(
        screen.getByTestId("orchestrator-pane-mode").textContent
      ).toContain("new-session")
    );

    expect(
      screen.getByRole("button", { name: /Master Session/i })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Existing session/i })
    ).toBeTruthy();
  });
});
