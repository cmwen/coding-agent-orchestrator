// @vitest-environment jsdom

import type {
  OrchestratorCapabilities,
  OrchestratorSession,
  WorkspaceSummary,
} from "@coding-agent-orchestrator/shared";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const SELECTED_SESSION_KEY = "coding-agent-orchestrator:selected-session";

vi.mock("./components/OrchestratorPane", () => ({
  OrchestratorPane: ({ session }: { session?: { sessionId: string } }) => (
    <div data-testid="orchestrator-pane-mode">
      {session ? `existing:${session.sessionId}` : "new-session"}
    </div>
  ),
}));

vi.mock("./components/CommandPalette", () => ({
  CommandPalette: () => null,
}));

const { deleteOrchestratorSession } = vi.hoisted(() => ({
  deleteOrchestratorSession: vi.fn(async () => ({ ok: true })),
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
  const sessions: OrchestratorSession[] = [
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

  return {
    api: {
      getWorkspace: vi.fn(async () => workspace),
      getOrchestratorCapabilities: vi.fn(async () => capabilities),
      listOrchestratorSessions: vi.fn(async () => sessions),
      listOrchestratorSchedules: vi.fn(async () => []),
      deleteOrchestratorSession,
    },
  };
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

describe("App", () => {
  it("switches to new-session mode when clicking New session", async () => {
    const user = userEvent.setup();
    localStorage.setItem(SELECTED_SESSION_KEY, "session-1");

    render(<App />);

    await waitFor(() =>
      expect(screen.getByTestId("orchestrator-pane-mode").textContent).toBe(
        "existing:session-1"
      )
    );

    await user.click(screen.getByRole("button", { name: /New session/i }));

    await waitFor(() =>
      expect(screen.getByTestId("orchestrator-pane-mode").textContent).toBe(
        "new-session"
      )
    );
  });

  it("removes an orchestrator session from its row action", async () => {
    const user = userEvent.setup();

    render(<App />);

    await waitFor(() =>
      expect(screen.getByTestId("orchestrator-pane-mode").textContent).toBe(
        "new-session"
      )
    );

    expect(
      screen.queryByRole("button", { name: "Remove selected" })
    ).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Delete session: Existing session" })
    );
    await user.click(
      screen.getByLabelText(
        /I understand this session will be permanently removed/i
      )
    );
    await user.click(screen.getByRole("button", { name: "Remove session" }));

    await waitFor(() =>
      expect(deleteOrchestratorSession).toHaveBeenCalledWith("session-1")
    );
  });
});
