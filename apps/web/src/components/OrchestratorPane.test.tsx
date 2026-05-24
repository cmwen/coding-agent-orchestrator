// @vitest-environment jsdom

import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrchestratorPane } from "./OrchestratorPane";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function openDesktopWorkspaceView(
  user: ReturnType<typeof userEvent.setup>,
  view:
    | "delegate"
    | "terminal"
    | "queue"
    | "changes"
    | "files"
    | "schedules"
    | "settings"
) {
  const button = document.querySelector<HTMLButtonElement>(
    `.orchestrator-workspace-nav [data-workspace-target="${view}"]`
  );
  expect(button).toBeTruthy();
  await user.click(button ?? document.body);
}

describe("OrchestratorPane", () => {
  it("submits a new orchestrator session request", async () => {
    const user = userEvent.setup();
    const onCreateSession = vi.fn();

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: ["/tmp/another-project"],
          tmuxInstalled: true,
          copilotInstalled: true,
          geminiInstalled: false,
          defaultCliProvider: "copilot",
          cliProviders: [
            {
              id: "copilot",
              displayName: "GitHub Copilot CLI",
              description: "Uses the installed copilot CLI.",
              capabilities: {
                supportsCustomAgents: true,
                supportsExecutionMode: true,
              },
            },
          ],
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
          {
            id: "claude-sonnet-4.6",
            displayName: "Claude Sonnet 4.6",
            runtimeProvider: "copilot",
            provider: "Anthropic",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project", "/tmp/another-project"]}
        pending={false}
        onCreateSession={onCreateSession}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await user.type(
      screen.getByLabelText("Project purpose"),
      "Repair the login redirect"
    );
    await user.type(
      screen.getByLabelText("Initial prompt"),
      "Investigate the broken redirect flow."
    );
    await user.selectOptions(
      screen.getByDisplayValue("GPT-5"),
      "claude-sonnet-4.6"
    );
    await user.click(screen.getByRole("button", { name: "Create session" }));

    expect(onCreateSession).toHaveBeenCalledWith({
      title: undefined,
      projectPath: "/tmp/project",
      projectPurpose: "Repair the login redirect",
      cliProvider: "copilot",
      model: "claude-sonnet-4.6",
      providerSessionId: undefined,
      executionMode: "standard",
      prompt: "Investigate the broken redirect flow.",
    });
  });

  it("surfaces a matching session in the create form and can open it", async () => {
    const user = userEvent.setup();
    const onSelectSession = vi.fn();

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project/",
          recentProjectPaths: [],
          tmuxInstalled: true,
          copilotInstalled: true,
          geminiInstalled: false,
          defaultCliProvider: "copilot",
          cliProviders: [
            {
              id: "copilot",
              displayName: "GitHub Copilot CLI",
              description: "Uses the installed copilot CLI.",
              capabilities: {
                supportsCustomAgents: true,
                supportsExecutionMode: true,
              },
            },
          ],
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        allSessions={[
          {
            sessionId: "older-match",
            agentId: "copilot-orchestrator",
            title: "Ship a coordinated implementation",
            startedAt: "2026-04-02T12:00:00Z",
            updatedAt: "2026-04-02T12:10:00Z",
            summary: "Ship a coordinated implementation",
            projectPath: "/tmp/project",
            projectPurpose: "Ship a coordinated implementation",
            cliProvider: "copilot",
            model: "gpt-5",
            tmuxSessionName: "coding-agent-orchestrator-orchestrator",
            tmuxWindowName: "tmp-old",
            tmuxPaneId: "%41",
            status: "completed",
            activeJobId: undefined,
            lastJobId: undefined,
            availableCustomAgents: [],
            selectedCustomAgentId: undefined,
            executionMode: "fleet",
            sessionDirectory: "/tmp/older-match",
            manifestPath:
              "agents/copilot-orchestrator/history/2026-04/older-match/SESSION.md",
            jobs: [],
            terminalTail: "",
            logSize: 0,
          },
          {
            sessionId: "latest-match",
            agentId: "copilot-orchestrator",
            title: "Ship a coordinated implementation",
            startedAt: "2026-04-03T12:00:00Z",
            updatedAt: "2026-04-03T12:10:00Z",
            summary: "Ship a coordinated implementation",
            projectPath: "/tmp/project/",
            projectPurpose: "Ship a coordinated implementation ",
            cliProvider: "copilot",
            model: "gpt-5",
            tmuxSessionName: "coding-agent-orchestrator-orchestrator",
            tmuxWindowName: "tmp-new",
            tmuxPaneId: "%42",
            status: "idle",
            activeJobId: undefined,
            lastJobId: undefined,
            availableCustomAgents: [],
            selectedCustomAgentId: undefined,
            executionMode: "fleet",
            sessionDirectory: "/tmp/latest-match",
            manifestPath:
              "agents/copilot-orchestrator/history/2026-04/latest-match/SESSION.md",
            jobs: [],
            terminalTail: "",
            logSize: 0,
          },
        ]}
        projectPathSuggestions={["/tmp/project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onSelectSession={onSelectSession}
        onDeleteOlderDuplicate={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await user.type(
      screen.getByLabelText("Project purpose"),
      "Ship a coordinated implementation"
    );

    expect(
      screen.getByText(/A matching orchestrator session already exists/i)
    ).toBeTruthy();

    await user.click(
      screen.getByRole("button", { name: "Open latest existing session" })
    );

    expect(onSelectSession).toHaveBeenCalledWith("latest-match");
  });

  it("lets users continue with the previous coding agent session ID from a matching session", async () => {
    const user = userEvent.setup();

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project/",
          recentProjectPaths: [],
          tmuxInstalled: true,
          copilotInstalled: true,
          geminiInstalled: false,
          defaultCliProvider: "copilot",
          cliProviders: [
            {
              id: "copilot",
              displayName: "GitHub Copilot CLI",
              description: "Uses the installed copilot CLI.",
              capabilities: {
                supportsCustomAgents: true,
                supportsExecutionMode: true,
              },
            },
          ],
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        allSessions={[
          {
            sessionId: "latest-match",
            agentId: "copilot-orchestrator",
            title: "Ship a coordinated implementation",
            startedAt: "2026-04-03T12:00:00Z",
            updatedAt: "2026-04-03T12:10:00Z",
            summary: "Ship a coordinated implementation",
            projectPath: "/tmp/project/",
            projectPurpose: "Ship a coordinated implementation ",
            cliProvider: "copilot",
            model: "gpt-5",
            tmuxSessionName: "coding-agent-orchestrator-orchestrator",
            tmuxWindowName: "tmp-new",
            tmuxPaneId: "%42",
            status: "idle",
            activeJobId: undefined,
            lastJobId: "job-2",
            availableCustomAgents: [],
            selectedCustomAgentId: undefined,
            executionMode: "fleet",
            sessionDirectory: "/tmp/latest-match",
            manifestPath:
              "agents/copilot-orchestrator/history/2026-04/latest-match/SESSION.md",
            jobs: [
              {
                jobId: "job-2",
                sessionId: "latest-match",
                providerSessionId: "copilot-session-123",
                promptPreview: "Ship the coordinated implementation",
                promptMode: "inline",
                status: "completed",
                submittedAt: "2026-04-03T12:08:00Z",
                startedAt: "2026-04-03T12:08:10Z",
                completedAt: "2026-04-03T12:10:00Z",
                jobDirectory: "/tmp/latest-match/job-2",
              },
            ],
            terminalTail: "",
            logSize: 0,
          },
        ]}
        projectPathSuggestions={["/tmp/project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onSelectSession={() => undefined}
        onDeleteOlderDuplicate={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await user.type(
      screen.getByLabelText("Project purpose"),
      "Ship a coordinated implementation"
    );

    expect(screen.getByText(/Latest coding agent session ID:/i)).toBeTruthy();

    await user.click(
      screen.getByRole("button", {
        name: "Continue with previous session ID",
      })
    );

    expect(screen.getByDisplayValue("copilot-session-123")).toBeTruthy();
    expect(
      (
        screen.getByPlaceholderText(
          "Optional existing coding agent session ID"
        ) as HTMLInputElement
      ).value
    ).toBe("copilot-session-123");
  });

  it("shows Antigravity continuation hints when that provider is selected", async () => {
    const user = userEvent.setup();

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project/",
          recentProjectPaths: [],
          tmuxInstalled: true,
          copilotInstalled: false,
          geminiInstalled: false,
          codexInstalled: false,
          opencodeInstalled: false,
          antigravityInstalled: true,
          defaultCliProvider: "antigravity",
          cliProviders: [
            {
              id: "antigravity",
              displayName: "Google Antigravity CLI",
              description: "Uses the installed Antigravity CLI.",
              capabilities: {
                supportsCustomAgents: false,
                supportsExecutionMode: false,
              },
            },
          ],
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        models={[
          {
            id: "antigravity-lite",
            displayName: "Antigravity Lite",
            runtimeProvider: "antigravity",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="antigravity-lite"
        projectPathSuggestions={["/tmp/project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await user.type(
      screen.getByLabelText("Project purpose"),
      "Repair the login redirect"
    );

    expect(
      screen.getByText(
        /Paste an existing Google Antigravity conversation ID to continue that conversation on delegated jobs\./i
      )
    ).toBeTruthy();
    expect(
      screen.getByPlaceholderText("Optional existing coding agent session ID")
    ).toBeTruthy();
  });

  it("lets users update the saved session title and model", async () => {
    const user = userEvent.setup();
    const onUpdateSession = vi.fn();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: ["/tmp/another-project"],
          tmuxInstalled: true,
          copilotInstalled: true,
          geminiInstalled: false,
          defaultCliProvider: "copilot",
          cliProviders: [
            {
              id: "copilot",
              displayName: "GitHub Copilot CLI",
              description: "Uses the installed copilot CLI.",
              capabilities: {
                supportsCustomAgents: true,
                supportsExecutionMode: true,
              },
            },
          ],
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "idle",
          activeJobId: undefined,
          lastJobId: undefined,
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          executionMode: "standard",
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [],
          terminalTail: "",
          logSize: 0,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
          {
            id: "claude-sonnet-4.6",
            displayName: "Claude Sonnet 4.6",
            runtimeProvider: "copilot",
            provider: "Anthropic",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project", "/tmp/another-project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={onUpdateSession}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    const settingsToggle = screen.getByRole("button", {
      name: /session settings/i,
    });
    const settingsPanelId = settingsToggle.getAttribute("aria-controls");
    expect(settingsPanelId).toBeTruthy();
    const settingsPanel = settingsPanelId
      ? document.getElementById(settingsPanelId)
      : undefined;
    expect(settingsPanel?.getAttribute("aria-hidden")).toBe("true");

    await user.click(settingsToggle);
    await user.clear(screen.getByLabelText("Project name"));
    await user.type(screen.getByLabelText("Project name"), "Payments platform");
    await user.selectOptions(
      screen.getAllByRole("combobox")[1] ?? document.body,
      "claude-sonnet-4.6"
    );
    await user.click(screen.getByRole("button", { name: "Save details" }));

    expect(onUpdateSession).toHaveBeenCalledWith({
      title: "Payments platform",
      cliProvider: "copilot",
      model: "claude-sonnet-4.6",
      selectedCustomAgentId: null,
      executionMode: "standard",
    });
    expect(settingsPanel?.getAttribute("aria-hidden")).toBe("true");
  });

  it("shows session deletion inside session details", async () => {
    const user = userEvent.setup();
    const onDeleteSession = vi.fn();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: ["/tmp/another-project"],
          tmuxInstalled: true,
          copilotInstalled: true,
          geminiInstalled: false,
          defaultCliProvider: "copilot",
          cliProviders: [
            {
              id: "copilot",
              displayName: "GitHub Copilot CLI",
              description: "Uses the installed copilot CLI.",
              capabilities: {
                supportsCustomAgents: true,
                supportsExecutionMode: true,
              },
            },
          ],
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "idle",
          activeJobId: undefined,
          lastJobId: undefined,
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          executionMode: "standard",
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [],
          terminalTail: "",
          logSize: 0,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project", "/tmp/another-project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onDeleteSession={onDeleteSession}
        onSessionUpdate={() => undefined}
      />
    );

    await user.click(
      screen.getByRole("button", {
        name: "Open delete dialog for Repo support",
      })
    );

    expect(onDeleteSession).toHaveBeenCalledTimes(1);
  });

  it("notifies the app when the selected session is missing", async () => {
    const onSessionMissing = vi.fn();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              error: "Orchestrator session not found: session-1",
            }),
            {
              status: 404,
              headers: { "content-type": "application/json" },
            }
          )
      )
    );

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: ["/tmp/another-project"],
          tmuxInstalled: true,
          copilotInstalled: true,
          geminiInstalled: false,
          defaultCliProvider: "copilot",
          cliProviders: [
            {
              id: "copilot",
              displayName: "GitHub Copilot CLI",
              description: "Uses the installed copilot CLI.",
              capabilities: {
                supportsCustomAgents: true,
                supportsExecutionMode: true,
              },
            },
          ],
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "session-1",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "idle",
          activeJobId: undefined,
          lastJobId: undefined,
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          executionMode: "standard",
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [],
          terminalTail: "",
          logSize: 0,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project", "/tmp/another-project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
        onSessionMissing={onSessionMissing}
      />
    );

    await waitFor(() =>
      expect(onSessionMissing).toHaveBeenCalledWith("session-1")
    );
    expect(
      screen.queryByText("Orchestrator session not found: session-1")
    ).toBeNull();
  });

  it("shows the latest coding agent session ID on the session overview", () => {
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: ["/tmp/another-project"],
          tmuxInstalled: true,
          copilotInstalled: true,
          geminiInstalled: false,
          defaultCliProvider: "copilot",
          cliProviders: [
            {
              id: "copilot",
              displayName: "GitHub Copilot CLI",
              description: "Uses the installed copilot CLI.",
              capabilities: {
                supportsCustomAgents: true,
                supportsExecutionMode: true,
              },
            },
          ],
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          cliProvider: "copilot",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "completed",
          activeJobId: undefined,
          lastJobId: "job-1",
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          executionMode: "standard",
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [
            {
              jobId: "job-1",
              sessionId: "2026-03-20-repo-support",
              providerSessionId: "copilot-session-123",
              promptPreview: "Implement the migration",
              promptMode: "inline",
              status: "completed",
              submittedAt: "2026-03-20T12:00:00Z",
              startedAt: "2026-03-20T12:00:10Z",
              completedAt: "2026-03-20T12:05:00Z",
              jobDirectory: "/tmp/session/job-1",
            },
          ],
          terminalTail: "",
          logSize: 0,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project", "/tmp/another-project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    expect(
      screen.getByText("Latest coding agent session ID: copilot-session-123")
    ).toBeTruthy();
  });

  it("lets users save a discovered custom agent for future delegated jobs", async () => {
    const user = userEvent.setup();
    const onUpdateSession = vi.fn();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: ["/tmp/another-project"],
          tmuxInstalled: true,
          copilotInstalled: true,
          geminiInstalled: false,
          defaultCliProvider: "copilot",
          cliProviders: [
            {
              id: "copilot",
              displayName: "GitHub Copilot CLI",
              description: "Uses the installed copilot CLI.",
              capabilities: {
                supportsCustomAgents: true,
                supportsExecutionMode: true,
              },
            },
          ],
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "idle",
          activeJobId: undefined,
          lastJobId: undefined,
          availableCustomAgents: [
            {
              id: "reviewer",
              name: "PR Reviewer",
              description: "Reviews pull requests.",
              path: ".github/agents/reviewer.agent.md",
            },
          ],
          selectedCustomAgentId: undefined,
          executionMode: "standard",
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [],
          terminalTail: "",
          logSize: 0,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project", "/tmp/another-project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={onUpdateSession}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await user.click(screen.getByRole("button", { name: /session settings/i }));
    await user.selectOptions(
      screen.getAllByRole("combobox")[2] ?? document.body,
      "reviewer"
    );
    await user.click(screen.getByRole("button", { name: "Save details" }));

    expect(onUpdateSession).toHaveBeenCalledWith({
      title: "Repo support",
      cliProvider: "copilot",
      model: "gpt-5",
      selectedCustomAgentId: "reviewer",
      executionMode: "standard",
    });
  });

  it("offers to remove a single older duplicate session from the latest saved session", async () => {
    const user = userEvent.setup();
    const onDeleteOlderDuplicate = vi.fn();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: [],
          tmuxInstalled: true,
          copilotInstalled: true,
          geminiInstalled: false,
          defaultCliProvider: "copilot",
          cliProviders: [
            {
              id: "copilot",
              displayName: "GitHub Copilot CLI",
              description: "Uses the installed copilot CLI.",
              capabilities: {
                supportsCustomAgents: true,
                supportsExecutionMode: true,
              },
            },
          ],
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "latest-match",
          agentId: "copilot-orchestrator",
          title: "Ship a coordinated implementation",
          startedAt: "2026-04-03T12:00:00Z",
          updatedAt: "2026-04-03T12:10:00Z",
          summary: "Ship a coordinated implementation",
          projectPath: "/tmp/project",
          projectPurpose: "Ship a coordinated implementation",
          cliProvider: "copilot",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "tmp-new",
          tmuxPaneId: "%42",
          status: "idle",
          activeJobId: undefined,
          lastJobId: undefined,
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          executionMode: "fleet",
          sessionDirectory: "/tmp/latest-match",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-04/latest-match/SESSION.md",
          jobs: [],
          terminalTail: "",
          logSize: 0,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        allSessions={[
          {
            sessionId: "older-match",
            agentId: "copilot-orchestrator",
            title: "Ship a coordinated implementation",
            startedAt: "2026-04-02T12:00:00Z",
            updatedAt: "2026-04-02T12:10:00Z",
            summary: "Ship a coordinated implementation",
            projectPath: "/tmp/project/",
            projectPurpose: "Ship a coordinated implementation ",
            cliProvider: "copilot",
            model: "gpt-5",
            tmuxSessionName: "coding-agent-orchestrator-orchestrator",
            tmuxWindowName: "tmp-old",
            tmuxPaneId: "%41",
            status: "completed",
            activeJobId: undefined,
            lastJobId: undefined,
            availableCustomAgents: [],
            selectedCustomAgentId: undefined,
            executionMode: "fleet",
            sessionDirectory: "/tmp/older-match",
            manifestPath:
              "agents/copilot-orchestrator/history/2026-04/older-match/SESSION.md",
            jobs: [],
            terminalTail: "",
            logSize: 0,
          },
        ]}
        projectPathSuggestions={["/tmp/project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onSelectSession={() => undefined}
        onDeleteOlderDuplicate={onDeleteOlderDuplicate}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Remove older duplicate" })
    );

    expect(onDeleteOlderDuplicate).toHaveBeenCalledWith("older-match");
  });

  it("does not show execution mode in session settings", async () => {
    const user = userEvent.setup();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: ["/tmp/another-project"],
          tmuxInstalled: true,
          copilotInstalled: true,
          geminiInstalled: false,
          defaultCliProvider: "copilot",
          cliProviders: [
            {
              id: "copilot",
              displayName: "GitHub Copilot CLI",
              description: "Uses the installed copilot CLI.",
              capabilities: {
                supportsCustomAgents: true,
                supportsExecutionMode: true,
              },
            },
          ],
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "idle",
          activeJobId: undefined,
          lastJobId: undefined,
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          executionMode: "standard",
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [],
          terminalTail: "",
          logSize: 0,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project", "/tmp/another-project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await user.click(screen.getByRole("button", { name: /session settings/i }));
    expect(screen.queryByText("Execution mode")).toBeNull();
    expect(screen.getAllByText("Mode: Standard").length).toBeGreaterThan(0);
  });

  it("sends one attached file with a delegated prompt", async () => {
    const user = userEvent.setup();
    const onDelegate = vi.fn();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: ["/tmp/another-project"],
          tmuxInstalled: true,
          copilotInstalled: true,
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "idle",
          activeJobId: undefined,
          lastJobId: undefined,
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [],
          terminalTail: "",
          logSize: 0,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project", "/tmp/another-project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={onDelegate}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await user.type(
      screen.getByPlaceholderText(
        "Queue another async prompt for the Copilot CLI window."
      ),
      "Inspect the attached image."
    );
    await user.upload(
      screen.getByLabelText("Attach file"),
      new File([Uint8Array.from([137, 80, 78, 71])], "asset.png", {
        type: "image/png",
      })
    );
    await user.click(screen.getByRole("button", { name: "Delegate prompt" }));

    expect(onDelegate).toHaveBeenCalledWith({
      prompt: "Inspect the attached image.",
      attachment: expect.any(File),
      providerSessionId: undefined,
    });
  });

  it("lets users continue a prior task session for the next delegated prompt only", async () => {
    const user = userEvent.setup();
    const onDelegate = vi.fn();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: ["/tmp/another-project"],
          tmuxInstalled: true,
          copilotInstalled: true,
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          cliProvider: "copilot",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "completed",
          activeJobId: undefined,
          lastJobId: "job-1",
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          executionMode: "standard",
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [
            {
              jobId: "job-1",
              sessionId: "2026-03-20-repo-support",
              providerSessionId: "copilot-session-123",
              promptPreview: "Implement the migration",
              promptMode: "inline",
              status: "completed",
              submittedAt: "2026-03-20T12:00:00Z",
              startedAt: "2026-03-20T12:00:10Z",
              completedAt: "2026-03-20T12:05:00Z",
              jobDirectory: "/tmp/session/job-1",
            },
          ],
          terminalTail: "",
          logSize: 0,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project", "/tmp/another-project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={onDelegate}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await openDesktopWorkspaceView(user, "queue");
    await user.click(
      screen.getByRole("button", {
        name: "Continue task: Implement the migration",
      })
    );
    await openDesktopWorkspaceView(user, "delegate");
    expect(screen.getByDisplayValue("copilot-session-123")).toBeTruthy();

    await user.type(
      screen.getByPlaceholderText(
        "Queue another async prompt for the Copilot CLI window."
      ),
      "Refine the migration plan."
    );
    await user.click(screen.getByRole("button", { name: "Delegate prompt" }));

    expect(onDelegate).toHaveBeenCalledWith({
      prompt: "Refine the migration plan.",
      attachment: undefined,
      providerSessionId: "copilot-session-123",
    });
    expect(
      (
        screen.getByPlaceholderText(
          "Leave blank to start a fresh task session"
        ) as HTMLInputElement
      ).value
    ).toBe("");
  });

  it("shows a mobile queue switcher and supports the new-session shortcut", async () => {
    const user = userEvent.setup();
    const onSelectSession = vi.fn();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query === "(max-width: 860px)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: ["/tmp/another-project"],
          tmuxInstalled: true,
          copilotInstalled: true,
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          cliProviders: [
            {
              id: "copilot",
              displayName: "GitHub Copilot CLI",
              description: "Uses the installed copilot CLI.",
              capabilities: {
                supportsCustomAgents: true,
                supportsExecutionMode: true,
              },
            },
          ],
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          cliProvider: "copilot",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "running",
          activeJobId: undefined,
          lastJobId: undefined,
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          executionMode: "standard",
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [],
          terminalTail: "",
          logSize: 0,
        }}
        allSessions={[
          {
            sessionId: "2026-03-20-repo-support",
            agentId: "copilot-orchestrator",
            title: "Repo support",
            startedAt: "2026-03-20T12:00:00Z",
            updatedAt: "2026-03-20T12:05:00Z",
            summary: "Handle runtime support work",
            projectPath: "/tmp/project",
            projectPurpose: "Handle runtime support work",
            cliProvider: "copilot",
            model: "gpt-5",
            tmuxSessionName: "coding-agent-orchestrator-orchestrator",
            tmuxWindowName: "project-repo-support-0001",
            tmuxPaneId: "%42",
            status: "running",
            activeJobId: undefined,
            lastJobId: undefined,
            availableCustomAgents: [],
            selectedCustomAgentId: undefined,
            executionMode: "standard",
            sessionDirectory: "/tmp/session",
            manifestPath:
              "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
            jobs: [],
            terminalTail: "",
            logSize: 0,
          },
          {
            sessionId: "docs-cleanup",
            agentId: "copilot-orchestrator",
            title: "Docs cleanup",
            startedAt: "2026-03-19T12:00:00Z",
            updatedAt: "2026-03-19T12:05:00Z",
            summary: "Clean up docs",
            projectPath: "/tmp/docs",
            projectPurpose: "Clean up docs",
            cliProvider: "copilot",
            model: "gpt-5",
            tmuxSessionName: "coding-agent-orchestrator-orchestrator",
            tmuxWindowName: "docs-cleanup",
            tmuxPaneId: "%43",
            status: "completed",
            activeJobId: undefined,
            lastJobId: undefined,
            availableCustomAgents: [],
            selectedCustomAgentId: undefined,
            executionMode: "standard",
            sessionDirectory: "/tmp/docs-session",
            manifestPath:
              "agents/copilot-orchestrator/history/2026-03/docs-cleanup/SESSION.md",
            jobs: [],
            terminalTail: "",
            logSize: 0,
          },
        ]}
        schedules={[]}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project", "/tmp/docs"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onSelectSession={onSelectSession}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    const desktopNav = screen.getByRole("navigation", {
      name: "Workspace views",
    });
    expect(
      within(desktopNav).getByRole("button", { name: "Queue" })
    ).toBeTruthy();

    const mobileNav = screen.getByRole("navigation", {
      name: "Mobile workspace views",
    });
    expect(
      within(mobileNav).getByRole("button", { name: "Queue" })
    ).toBeTruthy();
    expect(
      within(mobileNav).queryByRole("button", { name: "Home" })
    ).toBeNull();
    expect(screen.getByText("Switch session")).toBeTruthy();
    const sessionSwitcher = screen
      .getByText("Switch session")
      .closest(".orchestrator-mobile-session-switcher");
    expect(sessionSwitcher).toBeTruthy();
    const switcher = within(sessionSwitcher as HTMLElement);

    await user.click(switcher.getByRole("button", { name: "New" }));
    expect(onSelectSession).toHaveBeenCalledWith(undefined);

    await user.click(switcher.getByRole("button", { name: /Docs cleanup/ }));
    expect(onSelectSession).toHaveBeenCalledWith("docs-cleanup");
  });

  it("creates a recurring schedule from the orchestrator session view", async () => {
    const user = userEvent.setup();
    const onCreateSchedule = vi.fn();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: ["/tmp/another-project"],
          tmuxInstalled: true,
          copilotInstalled: true,
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          emailDeliveryAvailable: true,
          emailFromAddress: "bot@example.com",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "idle",
          activeJobId: undefined,
          lastJobId: undefined,
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [],
          terminalTail: "",
          logSize: 0,
        }}
        schedules={[]}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project", "/tmp/another-project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        onCreateSchedule={onCreateSchedule}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await openDesktopWorkspaceView(user, "schedules");
    await user.click(screen.getByRole("button", { name: "Create schedule" }));
    await user.type(
      screen.getByLabelText("Schedule title"),
      "Daily XYZ digest"
    );
    await user.type(
      screen.getByPlaceholderText(
        "Summarize the latest news from XYZ, highlight the top five updates, and end with a short executive summary."
      ),
      "Summarize the latest XYZ news and email me the result."
    );
    await user.type(
      screen.getByPlaceholderText("name@example.com"),
      "person@example.com"
    );
    await user.click(
      screen.getAllByRole("button", { name: "Create schedule" }).at(-1) ??
        document.body
    );

    expect(onCreateSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "2026-03-20-repo-support",
        title: "Daily XYZ digest",
        prompt: "Summarize the latest XYZ news and email me the result.",
        frequency: "daily",
        timeOfDay: "08:00",
        dayOfWeek: undefined,
        dayOfMonth: undefined,
        customAgentId: null,
        emailTo: "person@example.com",
        enabled: true,
      })
    );
  });

  it("reconnects the terminal stream from the latest offset after errors", async () => {
    vi.useFakeTimers();
    try {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "visible",
      });
      const instances: MockEventSource[] = [];
      class MockEventSource {
        readonly listeners = new Map<
          string,
          Array<(event: MessageEvent<string>) => void>
        >();
        readonly close = vi.fn();
        onerror: (() => void) | null = null;

        constructor(public readonly url: string) {
          instances.push(this);
        }

        addEventListener = vi.fn(
          (type: string, listener: (event: MessageEvent<string>) => void) => {
            const listeners = this.listeners.get(type) ?? [];
            listeners.push(listener);
            this.listeners.set(type, listeners);
          }
        );

        removeEventListener = vi.fn(
          (type: string, listener: (event: MessageEvent<string>) => void) => {
            const listeners = this.listeners.get(type) ?? [];
            this.listeners.set(
              type,
              listeners.filter((candidate) => candidate !== listener)
            );
          }
        );

        emit(type: string, payload: unknown) {
          for (const listener of this.listeners.get(type) ?? []) {
            listener({
              data: JSON.stringify(payload),
            } as MessageEvent<string>);
          }
        }
      }
      vi.stubGlobal(
        "EventSource",
        MockEventSource as unknown as typeof EventSource
      );

      render(
        <OrchestratorPane
          capabilities={{
            available: true,
            defaultProjectPath: "/tmp/project",
            recentProjectPaths: ["/tmp/another-project"],
            tmuxInstalled: true,
            copilotInstalled: true,
            tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          }}
          session={{
            sessionId: "2026-03-20-repo-support",
            agentId: "copilot-orchestrator",
            title: "Repo support",
            startedAt: "2026-03-20T12:00:00Z",
            updatedAt: "2026-03-20T12:05:00Z",
            summary: "Handle runtime support work",
            projectPath: "/tmp/project",
            projectPurpose: "Handle runtime support work",
            model: "gpt-5",
            tmuxSessionName: "coding-agent-orchestrator-orchestrator",
            tmuxWindowName: "project-repo-support-0001",
            tmuxPaneId: "%42",
            status: "running",
            activeJobId: "job-1",
            lastJobId: "job-1",
            availableCustomAgents: [],
            selectedCustomAgentId: undefined,
            sessionDirectory: "/tmp/session",
            manifestPath:
              "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
            jobs: [
              {
                jobId: "job-1",
                sessionId: "2026-03-20-repo-support",
                promptPreview: "Stream output",
                promptMode: "inline",
                status: "running",
                submittedAt: "2026-03-20T12:04:00Z",
                startedAt: "2026-03-20T12:04:05Z",
                jobDirectory: "/tmp/session/jobs/job-1",
              },
            ],
            terminalTail: "",
            logSize: 0,
          }}
          schedules={[]}
          models={[
            {
              id: "gpt-5",
              displayName: "GPT-5",
              runtimeProvider: "copilot",
              supportedReasoningEfforts: [],
            },
          ]}
          defaultModelId="gpt-5"
          projectPathSuggestions={["/tmp/project", "/tmp/another-project"]}
          pending={false}
          onCreateSession={() => undefined}
          onUpdateSession={() => undefined}
          onDelegate={() => undefined}
          onSendInput={() => undefined}
          onCancelJob={() => undefined}
          onRestartSession={() => undefined}
          onDeleteQueuedJob={() => undefined}
          onCreateSchedule={() => undefined}
          onUpdateSchedule={() => undefined}
          onDeleteSchedule={() => undefined}
          onSessionUpdate={() => undefined}
        />
      );

      expect(instances[0]?.url).toContain("offset=0");

      instances[0]?.emit("output", {
        chunk: "hello",
        nextOffset: 5,
      });
      instances[0]?.onerror?.();

      await vi.advanceTimersByTimeAsync(3_000);
      await vi.advanceTimersByTimeAsync(0);
      expect(instances).toHaveLength(2);
      expect(instances[1]?.url).toContain("offset=5");
    } finally {
      vi.useRealTimers();
    }
  });

  it("loads older tmux output on demand without rewinding the live stream", async () => {
    const user = userEvent.setup();
    const logLines = Array.from(
      { length: 2_500 },
      (_, index) => `line ${index + 1}`
    );
    const recentOutput = `${logLines.slice(500).join("\n")}\n`;
    const olderOutput = `${logLines.slice(0, 500).join("\n")}\n`;
    const fullLog = `${logLines.join("\n")}\n`;
    const beforeOffset =
      Buffer.byteLength(fullLog) - Buffer.byteLength(recentOutput);
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/changes")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              state: "clean",
              projectPath: "/tmp/project",
              repositoryRoot: "/tmp/project",
              files: [],
              message: "No uncommitted changes in this project.",
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
            }
          )
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            chunk: olderOutput,
            startOffset: 0,
            endOffset: beforeOffset,
            hasMoreBefore: false,
            lineCount: 500,
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          }
        )
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const eventSourceUrls: string[] = [];
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;

      constructor(url: string) {
        eventSourceUrls.push(url);
      }
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: ["/tmp/another-project"],
          tmuxInstalled: true,
          copilotInstalled: true,
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "running",
          activeJobId: "job-1",
          lastJobId: "job-1",
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [],
          terminalTail: recentOutput,
          logSize: Buffer.byteLength(fullLog),
        }}
        schedules={[]}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project", "/tmp/another-project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await openDesktopWorkspaceView(user, "terminal");
    expect(
      screen.getByRole("button", { name: "Load 2k more lines" })
    ).toBeTruthy();

    await user.click(
      screen.getByRole("button", { name: "Load 2k more lines" })
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/orchestrator/sessions/2026-03-20-repo-support/terminal?before=${beforeOffset}`,
        undefined
      )
    );
    await waitFor(() => expect(document.body.textContent).toContain("line 1"));
    expect(eventSourceUrls).toEqual([
      `/api/orchestrator/sessions/2026-03-20-repo-support/stream?offset=${Buffer.byteLength(fullLog)}`,
    ]);
    expect(
      screen.queryByRole("button", { name: "Load 2k more lines" })
    ).toBeNull();
  });

  it("opens the task queue when users switch to the queue view", async () => {
    const user = userEvent.setup();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: ["/tmp/another-project"],
          tmuxInstalled: true,
          copilotInstalled: true,
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "running",
          activeJobId: "job-1",
          lastJobId: "job-3",
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [
            {
              jobId: "job-3",
              sessionId: "2026-03-20-repo-support",
              promptPreview: "Draft the release note update",
              promptMode: "inline",
              status: "queued",
              submittedAt: "2026-03-20T12:04:00Z",
              jobDirectory: "/tmp/session/delegations/job-3",
            },
            {
              jobId: "job-2",
              sessionId: "2026-03-20-repo-support",
              promptPreview: "Update the rollout checklist",
              promptMode: "inline",
              status: "queued",
              submittedAt: "2026-03-20T12:03:30Z",
              jobDirectory: "/tmp/session/delegations/job-2",
            },
            {
              jobId: "job-1",
              sessionId: "2026-03-20-repo-support",
              promptPreview: "Investigate the stuck deploy",
              promptMode: "inline",
              status: "running",
              submittedAt: "2026-03-20T12:03:00Z",
              startedAt: "2026-03-20T12:03:05Z",
              jobDirectory: "/tmp/session/delegations/job-1",
            },
          ],
          terminalTail: "",
          logSize: 0,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project", "/tmp/another-project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    expect(screen.getByText("2 queued tasks")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Open task queue" })
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Hide task queue" })
    ).toBeNull();

    await openDesktopWorkspaceView(user, "queue");

    const queueToggle = screen.getByRole("button", { name: "Hide task queue" });
    expect(queueToggle).toBeTruthy();
    expect(
      screen.getByText("Current run plus any queued follow-up work")
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Queue next prompt" })
    ).toBeNull();
    const queuePanelId = queueToggle.getAttribute("aria-controls");
    expect(queuePanelId).toBeTruthy();
    const queuePanel = queuePanelId
      ? document.getElementById(queuePanelId)
      : undefined;
    expect(queuePanel).toBeTruthy();
    const queuePanelContent = within(queuePanel as HTMLElement);
    expect(
      queuePanelContent.getByText("Investigate the stuck deploy")
    ).toBeTruthy();
    expect(
      queuePanelContent.getByText("Update the rollout checklist")
    ).toBeTruthy();
    expect(
      queuePanelContent.getByText("Draft the release note update")
    ).toBeTruthy();
  });

  it("shows terminal and queue as separate workspace views on desktop", async () => {
    const user = userEvent.setup();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: ["/tmp/another-project"],
          tmuxInstalled: true,
          copilotInstalled: true,
          defaultCliProvider: "copilot",
          cliProviders: [
            {
              id: "copilot",
              displayName: "GitHub Copilot CLI",
              description: "Uses the installed copilot CLI.",
              capabilities: {
                supportsCustomAgents: true,
                supportsExecutionMode: true,
              },
            },
          ],
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          cliProvider: "copilot",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "running",
          activeJobId: "job-1",
          lastJobId: "job-2",
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [
            {
              jobId: "job-2",
              sessionId: "2026-03-20-repo-support",
              promptPreview: "Update the rollout checklist",
              promptMode: "inline",
              status: "queued",
              submittedAt: "2026-03-20T12:03:30Z",
              jobDirectory: "/tmp/session/delegations/job-2",
            },
            {
              jobId: "job-1",
              sessionId: "2026-03-20-repo-support",
              promptPreview: "Investigate the stuck deploy",
              promptMode: "inline",
              status: "running",
              submittedAt: "2026-03-20T12:03:00Z",
              startedAt: "2026-03-20T12:03:05Z",
              jobDirectory: "/tmp/session/delegations/job-1",
            },
          ],
          terminalTail: "",
          logSize: 0,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project", "/tmp/another-project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    expect(
      screen.getByRole("button", { name: "Queue next prompt" })
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Start a new tmux session" })
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Open task queue" })
    ).toBeNull();

    await openDesktopWorkspaceView(user, "terminal");

    expect(
      screen.getByRole("button", { name: "Start a new tmux session" })
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Queue next prompt" })
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Open task queue" })
    ).toBeNull();

    await openDesktopWorkspaceView(user, "queue");

    expect(
      screen.getByRole("button", { name: "Hide task queue" })
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Start a new tmux session" })
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Queue next prompt" })
    ).toBeNull();
  });

  it("keeps raw terminal input inside the terminal workspace", async () => {
    const user = userEvent.setup();
    const onSendInput = vi.fn();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: [],
          tmuxInstalled: true,
          copilotInstalled: true,
          defaultCliProvider: "copilot",
          cliProviders: [
            {
              id: "copilot",
              displayName: "GitHub Copilot CLI",
              description: "Uses the installed copilot CLI.",
              capabilities: {
                supportsCustomAgents: true,
                supportsExecutionMode: true,
              },
            },
          ],
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          cliProvider: "copilot",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "idle",
          activeJobId: undefined,
          lastJobId: undefined,
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          executionMode: "standard",
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [],
          terminalTail: "",
          logSize: 0,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={onSendInput}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Send and press Enter" })
    ).toBeNull();

    await openDesktopWorkspaceView(user, "terminal");
    await user.type(
      screen.getByPlaceholderText("Send text directly into the tmux pane."),
      "pwd"
    );
    await user.click(
      screen.getByRole("button", { name: "Send and press Enter" })
    );

    expect(onSendInput).toHaveBeenCalledWith("pwd", true);

    await openDesktopWorkspaceView(user, "delegate");
    expect(
      screen.queryByRole("button", { name: "Send and press Enter" })
    ).toBeNull();
  });

  it("sends frequent terminal commands from the dropdown", async () => {
    const user = userEvent.setup();
    const onSendInput = vi.fn();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: [],
          tmuxInstalled: true,
          copilotInstalled: true,
          defaultCliProvider: "copilot",
          cliProviders: [
            {
              id: "copilot",
              displayName: "GitHub Copilot CLI",
              description: "Uses the installed copilot CLI.",
              capabilities: {
                supportsCustomAgents: true,
                supportsExecutionMode: true,
              },
            },
          ],
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          cliProvider: "copilot",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "idle",
          activeJobId: undefined,
          lastJobId: undefined,
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          executionMode: "standard",
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [],
          terminalTail: "",
          logSize: 0,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={onSendInput}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await openDesktopWorkspaceView(user, "terminal");
    await user.selectOptions(screen.getByLabelText("Frequent commands"), [
      "git-add",
    ]);
    await user.click(
      screen.getByRole("button", { name: "Send selected frequent command" })
    );
    expect(onSendInput).toHaveBeenNthCalledWith(1, "git add .", true);

    await user.selectOptions(screen.getByLabelText("Frequent commands"), [
      "ctrl-c",
    ]);
    await user.click(
      screen.getByRole("button", { name: "Send selected frequent command" })
    );
    expect(onSendInput).toHaveBeenNthCalledWith(2, "\u0003", false);

    await user.selectOptions(screen.getByLabelText("Frequent commands"), [
      "esc",
    ]);
    await user.click(
      screen.getByRole("button", { name: "Send selected frequent command" })
    );
    expect(onSendInput).toHaveBeenNthCalledWith(3, "\u001b", false);
  });

  it("keeps schedules out of the queue workspace", async () => {
    const user = userEvent.setup();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: [],
          tmuxInstalled: true,
          copilotInstalled: true,
          defaultCliProvider: "copilot",
          cliProviders: [
            {
              id: "copilot",
              displayName: "GitHub Copilot CLI",
              description: "Uses the installed copilot CLI.",
              capabilities: {
                supportsCustomAgents: true,
                supportsExecutionMode: true,
              },
            },
          ],
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          cliProvider: "copilot",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "idle",
          activeJobId: undefined,
          lastJobId: "job-queued",
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          executionMode: "standard",
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [
            {
              jobId: "job-queued",
              sessionId: "2026-03-20-repo-support",
              promptPreview: "Draft the release note update",
              promptMode: "inline",
              status: "queued",
              submittedAt: "2026-03-20T12:04:00Z",
              jobDirectory: "/tmp/session/delegations/job-queued",
            },
          ],
          terminalTail: "",
          logSize: 0,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[
          {
            scheduleId: "schedule-1",
            sessionId: "2026-03-20-repo-support",
            title: "Nightly review",
            prompt: "Summarize the current state of work.",
            frequency: "daily",
            timezone: "UTC",
            timeOfDay: "09:00",
            enabled: true,
            nextRunAt: "2026-03-21T09:00:00Z",
            createdAt: "2026-03-20T12:00:00Z",
            updatedAt: "2026-03-20T12:05:00Z",
            totalRuns: 2,
            failedRuns: 0,
          },
        ]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await openDesktopWorkspaceView(user, "queue");
    const queueWorkspace = document.querySelector(
      ".orchestrator-board-card-queue.is-active"
    );
    expect(queueWorkspace).toBeTruthy();
    expect(
      within(queueWorkspace as HTMLElement).queryByText("Nightly review")
    ).toBeNull();

    await openDesktopWorkspaceView(user, "schedules");
    const schedulesWorkspace = document.querySelector(
      ".orchestrator-board-card-schedules.is-active"
    );
    expect(schedulesWorkspace).toBeTruthy();
    expect(
      within(schedulesWorkspace as HTMLElement).getByText("Nightly review")
    ).toBeTruthy();
  });

  it("renders only the active queue, delegate, and schedules workspaces", async () => {
    const user = userEvent.setup();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: [],
          tmuxInstalled: true,
          copilotInstalled: true,
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          cliProvider: "copilot",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "idle",
          activeJobId: undefined,
          lastJobId: undefined,
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          executionMode: "standard",
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [],
          terminalTail: "",
          logSize: 0,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[
          {
            scheduleId: "schedule-1",
            sessionId: "2026-03-20-repo-support",
            title: "Nightly review",
            prompt: "Summarize the current state of work.",
            frequency: "daily",
            timezone: "UTC",
            timeOfDay: "09:00",
            enabled: true,
            nextRunAt: "2026-03-21T09:00:00Z",
            createdAt: "2026-03-20T12:00:00Z",
            updatedAt: "2026-03-20T12:05:00Z",
            totalRuns: 2,
            failedRuns: 0,
          },
        ]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    expect(screen.getByText("Delegate a CLI task")).toBeTruthy();
    expect(screen.queryByText("Task queue")).toBeNull();
    expect(screen.queryByText("Recurring schedules")).toBeNull();

    await openDesktopWorkspaceView(user, "queue");
    expect(screen.getByText("Task queue")).toBeTruthy();
    expect(screen.queryByText("Delegate a CLI task")).toBeNull();
    expect(screen.queryByText("Recurring schedules")).toBeNull();

    await openDesktopWorkspaceView(user, "schedules");
    expect(screen.getByText("Recurring schedules")).toBeTruthy();
    expect(screen.queryByText("Task queue")).toBeNull();
    expect(screen.queryByText("Delegate a CLI task")).toBeNull();
  });

  it("routes queued task deletion through the provided handler", async () => {
    const user = userEvent.setup();
    const onDeleteQueuedJob = vi.fn();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: [],
          tmuxInstalled: true,
          copilotInstalled: true,
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "idle",
          activeJobId: undefined,
          lastJobId: "job-queued",
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [
            {
              jobId: "job-queued",
              sessionId: "2026-03-20-repo-support",
              promptPreview: "Draft the release note update",
              promptMode: "inline",
              status: "queued",
              submittedAt: "2026-03-20T12:04:00Z",
              jobDirectory: "/tmp/session/delegations/job-queued",
            },
          ],
          terminalTail: "",
          logSize: 0,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={onDeleteQueuedJob}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await openDesktopWorkspaceView(user, "queue");
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onDeleteQueuedJob).toHaveBeenCalledWith("job-queued");
  });

  it("lets users resize the tmux output with the keyboard", async () => {
    const user = userEvent.setup();
    const onTerminalOutputHeightChange = vi.fn();

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: [],
          tmuxInstalled: true,
          copilotInstalled: true,
          defaultCliProvider: "copilot",
          cliProviders: [
            {
              id: "copilot",
              displayName: "GitHub Copilot CLI",
              description: "Uses the installed copilot CLI.",
              capabilities: {
                supportsCustomAgents: true,
                supportsExecutionMode: true,
              },
            },
          ],
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "session-resize",
          agentId: "copilot-orchestrator",
          title: "Resize tmux output",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Resize tmux output",
          projectPath: "/tmp/project",
          projectPurpose: "Resize tmux output",
          cliProvider: "copilot",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-resize-0001",
          tmuxPaneId: "%42",
          status: "idle",
          activeJobId: undefined,
          lastJobId: undefined,
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          executionMode: "fleet",
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/session-resize/SESSION.md",
          jobs: [],
          terminalTail: "line 1",
          logSize: 6,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultCliProvider="copilot"
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project"]}
        pending={false}
        terminalOutputHeight={300}
        onTerminalOutputHeightChange={onTerminalOutputHeightChange}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await openDesktopWorkspaceView(user, "terminal");
    const resizeHandle = screen.getByRole("button", {
      name: "Resize tmux output",
    });
    resizeHandle.focus();
    await user.keyboard("{ArrowUp}");

    expect(onTerminalOutputHeightChange).toHaveBeenCalledWith(276);
  });

  it("routes failed task retries through the provided handler", async () => {
    const user = userEvent.setup();
    const onRetryFailedJob = vi.fn();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: [],
          tmuxInstalled: true,
          copilotInstalled: true,
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "failed",
          activeJobId: undefined,
          lastJobId: "job-failed",
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [
            {
              jobId: "job-failed",
              sessionId: "2026-03-20-repo-support",
              prompt: "Retry the failed task",
              promptPreview: "Retry the failed task",
              promptMode: "inline",
              status: "failed",
              submittedAt: "2026-03-20T12:04:00Z",
              completedAt: "2026-03-20T12:05:00Z",
              exitCode: 1,
              jobDirectory: "/tmp/session/delegations/job-failed",
            },
          ],
          terminalTail: "",
          logSize: 0,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onRetryFailedJob={onRetryFailedJob}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await openDesktopWorkspaceView(user, "queue");
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetryFailedJob).toHaveBeenCalledWith("job-failed");
  });

  it("does not open a live terminal stream when no job is running", () => {
    class MockEventSource {
      static instances: MockEventSource[] = [];
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;

      constructor(_url: string) {
        MockEventSource.instances.push(this);
      }
    }

    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: [],
          tmuxInstalled: true,
          copilotInstalled: true,
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "idle",
          activeJobId: undefined,
          lastJobId: "job-1",
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [
            {
              jobId: "job-1",
              sessionId: "2026-03-20-repo-support",
              promptPreview: "Previous work",
              promptMode: "inline",
              status: "completed",
              submittedAt: "2026-03-20T12:03:00Z",
              completedAt: "2026-03-20T12:04:00Z",
              jobDirectory: "/tmp/session/jobs/job-1",
            },
          ],
          terminalTail: "hello",
          logSize: 5,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    expect(MockEventSource.instances).toHaveLength(0);
  });

  it("keeps one stream connection for the same session across rerenders", () => {
    const eventSourceUrls: string[] = [];

    class MockEventSource {
      static instances: MockEventSource[] = [];
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;

      constructor(url: string) {
        eventSourceUrls.push(url);
        MockEventSource.instances.push(this);
      }
    }

    vi.stubGlobal("EventSource", MockEventSource);

    const session = {
      sessionId: "2026-03-20-repo-support",
      agentId: "copilot-orchestrator",
      title: "Repo support",
      startedAt: "2026-03-20T12:00:00Z",
      updatedAt: "2026-03-20T12:05:00Z",
      summary: "Handle runtime support work",
      projectPath: "/tmp/project",
      projectPurpose: "Handle runtime support work",
      model: "gpt-5",
      tmuxSessionName: "coding-agent-orchestrator-orchestrator",
      tmuxWindowName: "project-repo-support-0001",
      tmuxPaneId: "%42",
      status: "running" as const,
      activeJobId: "job-1",
      lastJobId: "job-1",
      availableCustomAgents: [],
      selectedCustomAgentId: undefined,
      sessionDirectory: "/tmp/session",
      manifestPath:
        "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
      jobs: [],
      terminalTail: "hello",
      logSize: 5,
    };

    const { rerender } = render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: ["/tmp/another-project"],
          tmuxInstalled: true,
          copilotInstalled: true,
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={session}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project", "/tmp/another-project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    rerender(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: ["/tmp/another-project"],
          tmuxInstalled: true,
          copilotInstalled: true,
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          ...session,
          terminalTail: "hello world",
          logSize: 11,
          updatedAt: "2026-03-20T12:06:00Z",
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project", "/tmp/another-project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    expect(eventSourceUrls).toEqual([
      "/api/orchestrator/sessions/2026-03-20-repo-support/stream?offset=5",
    ]);
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0]?.close).not.toHaveBeenCalled();
  });

  it("shows the new tmux session action near terminal output", async () => {
    const user = userEvent.setup();
    const onRestartSession = vi.fn();
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: [],
          tmuxInstalled: true,
          copilotInstalled: true,
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "idle",
          activeJobId: undefined,
          lastJobId: undefined,
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [],
          terminalTail: "ready\n",
          logSize: 6,
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={onRestartSession}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await openDesktopWorkspaceView(user, "terminal");
    await user.click(
      screen.getByRole("button", { name: "Start a new tmux session" })
    );

    expect(onRestartSession).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Delete session" })).toBeNull();
    expect(
      screen.getByText(/Starting a new tmux session closes the current pane/i)
    ).toBeTruthy();
  });

  it("shows local changes in a panel and renders a selected diff in a modal", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/changes")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              state: "dirty",
              projectPath: "/tmp/project",
              repositoryRoot: "/tmp/project",
              files: [
                {
                  path: "apps/web/src/OrchestratorPane.tsx",
                  statusCode: " M",
                  stagedStatus: undefined,
                  unstagedStatus: "modified",
                  displayStatus: "Modified unstaged",
                  lineStats: {
                    added: 12,
                    removed: 4,
                    isBinary: false,
                  },
                },
                {
                  path: "notes.md",
                  statusCode: "??",
                  stagedStatus: undefined,
                  unstagedStatus: "untracked",
                  displayStatus: "Untracked",
                  lineStats: {
                    added: 3,
                    removed: 0,
                    isBinary: false,
                  },
                },
              ],
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
            }
          )
        );
      }
      if (
        url.includes(
          "/changes/diff?path=apps%2Fweb%2Fsrc%2FOrchestratorPane.tsx"
        )
      ) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              state: "ready",
              projectPath: "/tmp/project",
              repositoryRoot: "/tmp/project",
              path: "apps/web/src/OrchestratorPane.tsx",
              diff: [
                "diff --git a/apps/web/src/OrchestratorPane.tsx b/apps/web/src/OrchestratorPane.tsx",
                "@@ -1,3 +1,4 @@",
                ' import type { ModelDescriptor } from "@coding-agent-orchestrator/shared";',
                '+import { api } from "../api";',
                "",
              ].join("\n"),
              structured: {
                oldPath: "apps/web/src/OrchestratorPane.tsx",
                newPath: "apps/web/src/OrchestratorPane.tsx",
                headerLines: [
                  "diff --git a/apps/web/src/OrchestratorPane.tsx b/apps/web/src/OrchestratorPane.tsx",
                  "--- a/apps/web/src/OrchestratorPane.tsx",
                  "+++ b/apps/web/src/OrchestratorPane.tsx",
                ],
                hunks: [
                  {
                    header: "@@ -1,3 +1,4 @@",
                    lines: [
                      {
                        kind: "context",
                        content:
                          'import type { ModelDescriptor } from "@coding-agent-orchestrator/shared";',
                        oldLineNumber: 1,
                        newLineNumber: 1,
                      },
                      {
                        kind: "add",
                        content: 'import { api } from "../api";',
                        newLineNumber: 2,
                      },
                    ],
                  },
                ],
                isBinary: false,
                hasText: true,
              },
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
            }
          )
        );
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: [],
          tmuxInstalled: true,
          copilotInstalled: true,
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "running",
          activeJobId: "job-1",
          lastJobId: "job-1",
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [],
          terminalTail: "",
          logSize: 0,
        }}
        schedules={[]}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await openDesktopWorkspaceView(user, "changes");

    expect(screen.queryByText(/repository files/i)).toBeNull();
    expect(screen.getByRole("button", { name: /2 changed/i })).toBeTruthy();

    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: /apps\/web\/src\/OrchestratorPane\.tsx/i,
        })
      ).toBeTruthy()
    );
    expect(screen.getByText("+12 / -4")).toBeTruthy();

    await user.click(
      screen.getByRole("button", {
        name: /apps\/web\/src\/OrchestratorPane\.tsx/i,
      })
    );

    await waitFor(() =>
      expect(
        screen.getByRole("dialog", {
          name: "apps/web/src/OrchestratorPane.tsx",
        })
      ).toBeTruthy()
    );
    expect(screen.getByText("@@ -1,3 +1,4 @@")).toBeTruthy();
    expect(screen.getByText('import { api } from "../api";')).toBeTruthy();
    expect(
      screen.queryByText(/diff --git a\/apps\/web\/src\/OrchestratorPane\.tsx/i)
    ).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/orchestrator/sessions/2026-03-20-repo-support/changes",
      undefined
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/orchestrator/sessions/2026-03-20-repo-support/changes/diff?path=apps%2Fweb%2Fsrc%2FOrchestratorPane.tsx",
      undefined
    );
  });

  it("browses folders and previews a repository file in the files workspace", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/changes")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              state: "clean",
              projectPath: "/tmp/project",
              files: [],
              message: "No uncommitted changes in this project.",
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
            }
          )
        );
      }
      if (url.endsWith("/files")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              projectPath: "/tmp/project",
              path: "",
              entries: [
                {
                  path: "src",
                  name: "src",
                  kind: "directory",
                },
                {
                  path: "README.md",
                  name: "README.md",
                  kind: "file",
                  size: 1732,
                },
              ],
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
            }
          )
        );
      }
      if (url.endsWith("/files?path=src")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              projectPath: "/tmp/project",
              path: "src",
              parentPath: "",
              entries: [
                {
                  path: "src/App.tsx",
                  name: "App.tsx",
                  kind: "file",
                  size: 4210,
                },
              ],
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
            }
          )
        );
      }
      if (url.endsWith("/files/content?path=README.md")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              state: "ready",
              projectPath: "/tmp/project",
              path: "README.md",
              size: 1732,
              content: "# Project README\n\nOverview",
              truncated: false,
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
            }
          )
        );
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: [],
          tmuxInstalled: true,
          copilotInstalled: true,
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "idle",
          activeJobId: undefined,
          lastJobId: undefined,
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [],
          terminalTail: "",
          logSize: 0,
        }}
        schedules={[]}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await openDesktopWorkspaceView(user, "files");
    expect(screen.getByText(/repository files/i)).toBeTruthy();
    expect(screen.queryByText(/local changes/i)).toBeNull();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /README\.md/i })).toBeTruthy()
    );
    await user.click(screen.getByRole("button", { name: /README\.md/i }));

    await waitFor(() =>
      expect(screen.getByText(/Project README/)).toBeTruthy()
    );

    await user.click(screen.getByRole("button", { name: /src/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/orchestrator/sessions/2026-03-20-repo-support/files?path=src",
        undefined
      )
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/orchestrator/sessions/2026-03-20-repo-support/files",
      undefined
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/orchestrator/sessions/2026-03-20-repo-support/files/content?path=README.md",
      undefined
    );
  });

  it("shows the empty git-state message for non-repository session paths", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          state: "non-git",
          projectPath: "/tmp/project",
          files: [],
          message: "This project path is not inside a git repository.",
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: [],
          tmuxInstalled: true,
          copilotInstalled: true,
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%42",
          status: "idle",
          activeJobId: undefined,
          lastJobId: undefined,
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [],
          terminalTail: "",
          logSize: 0,
        }}
        schedules={[]}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    await openDesktopWorkspaceView(user, "changes");
    expect(screen.queryByText(/repository files/i)).toBeNull();

    await waitFor(() =>
      expect(
        screen.getAllByText("This project path is not inside a git repository.")
          .length
      ).toBeGreaterThan(0)
    );
  });

  it("shows an auto-recovery notice when a missing tmux session is recreated", () => {
    class MockEventSource {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror: (() => void) | null = null;
    }
    vi.stubGlobal("EventSource", MockEventSource);

    render(
      <OrchestratorPane
        capabilities={{
          available: true,
          defaultProjectPath: "/tmp/project",
          recentProjectPaths: [],
          tmuxInstalled: true,
          copilotInstalled: true,
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
        }}
        session={{
          sessionId: "2026-03-20-repo-support",
          agentId: "copilot-orchestrator",
          title: "Repo support",
          startedAt: "2026-03-20T12:00:00Z",
          updatedAt: "2026-03-20T12:05:00Z",
          summary: "Handle runtime support work",
          projectPath: "/tmp/project",
          projectPurpose: "Handle runtime support work",
          model: "gpt-5",
          tmuxSessionName: "coding-agent-orchestrator-orchestrator",
          tmuxWindowName: "project-repo-support-0001",
          tmuxPaneId: "%99",
          status: "running",
          activeJobId: "job-2",
          lastJobId: "job-2",
          availableCustomAgents: [],
          selectedCustomAgentId: undefined,
          sessionDirectory: "/tmp/session",
          manifestPath:
            "agents/copilot-orchestrator/history/2026-03/2026-03-20-repo-support/SESSION.md",
          jobs: [],
          terminalTail:
            "[coding-agent-orchestrator] A new tmux session was created because the previous tmux session no longer existed.\n",
          logSize: 97,
          systemNotice:
            "A new tmux session was created because the previous tmux session no longer existed.",
        }}
        models={[
          {
            id: "gpt-5",
            displayName: "GPT-5",
            runtimeProvider: "copilot",
            supportedReasoningEfforts: [],
          },
        ]}
        defaultModelId="gpt-5"
        projectPathSuggestions={["/tmp/project"]}
        pending={false}
        onCreateSession={() => undefined}
        onUpdateSession={() => undefined}
        onDelegate={() => undefined}
        onSendInput={() => undefined}
        onCancelJob={() => undefined}
        onRestartSession={() => undefined}
        onDeleteQueuedJob={() => undefined}
        schedules={[]}
        onCreateSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onSessionUpdate={() => undefined}
      />
    );

    expect(
      screen.getByText(
        "A new tmux session was created because the previous tmux session no longer existed."
      )
    ).toBeTruthy();
  });
});
