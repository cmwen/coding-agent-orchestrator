import { expect, test } from "@playwright/test";

const workspace = {
  storeRoot: "/tmp/orchestrator-store",
  copilotConfigDir: "/tmp/copilot",
  storeSkillDirectory: "/tmp/store-skills",
  copilotSkillDirectory: "/tmp/copilot-skills",
  agentCount: 1,
};

const capabilities = {
  available: true,
  defaultProjectPath: "/tmp/project",
  recentProjectPaths: ["/tmp/project"],
  tmuxInstalled: true,
  copilotInstalled: true,
  geminiInstalled: false,
  codexInstalled: true,
  opencodeInstalled: true,
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
};

function createSession(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: "session-1",
    agentId: "copilot-orchestrator",
    title: "Repo support",
    startedAt: "2026-05-12T22:00:00.000Z",
    updatedAt: "2026-05-13T08:00:00.000Z",
    summary: "Fix the mobile layout regressions.",
    projectPath: "/tmp/project",
    projectPurpose: "Handle runtime support work",
    cliProvider: "copilot",
    model: "gpt-5-mini",
    tmuxSessionName: "coding-agent-orchestrator-orchestrator",
    tmuxWindowName: "repo-support",
    tmuxPaneId: "%42",
    status: "completed",
    activeJobId: undefined,
    lastJobId: "job-1",
    availableCustomAgents: [],
    selectedCustomAgentId: undefined,
    executionMode: "standard",
    sessionDirectory: "/tmp/session-1",
    manifestPath: "/tmp/session-1/SESSION.md",
    logSize: 0,
    terminalTail: "",
    jobs: [
      {
        jobId: "job-1",
        sessionId: "session-1",
        providerSessionId: "copilot-session-123",
        promptPreview: "Implement the migration",
        prompt: "Implement the migration",
        promptMode: "inline",
        status: "completed",
        submittedAt: "2026-05-13T07:58:00.000Z",
        startedAt: "2026-05-13T08:01:00.000Z",
        completedAt: "2026-05-13T08:05:00.000Z",
        jobDirectory: "/tmp/session-1/job-1",
      },
    ],
    ...overrides,
  };
}

test("shows coding agent session IDs and can reuse the previous one", async ({
  page,
}) => {
  const sessions = [
    createSession(),
    createSession({
      sessionId: "session-2",
      title: "Docs cleanup",
      updatedAt: "2026-05-13T07:00:00.000Z",
      projectPath: "/tmp/project-two",
      projectPurpose: "Clean up the docs site",
      tmuxWindowName: "docs-cleanup",
      jobs: [],
      lastJobId: undefined,
    }),
  ];

  await page.route("**/api/workspace", async (route) => {
    await route.fulfill({ json: workspace });
  });
  await page.route("**/api/orchestrator/capabilities", async (route) => {
    await route.fulfill({ json: capabilities });
  });
  await page.route("**/api/orchestrator/schedules", async (route) => {
    await route.fulfill({ json: [] });
  });
  await page.route("**/api/orchestrator/sessions", async (route) => {
    await route.fulfill({ json: sessions });
  });
  await page.route(
    /\/api\/orchestrator\/sessions\/[^/]+\/changes$/,
    async (route) => {
      await route.fulfill({
        json: {
          state: "clean",
          message: "Working tree clean",
          files: [],
        },
      });
    }
  );

  await page.goto("/");

  await page.getByLabel("Project purpose").fill("Handle runtime support work");
  await expect(
    page.getByRole("button", { name: "Continue with previous session ID" })
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continue with previous session ID" })
    .click();
  await expect(page.getByLabel("Coding agent session ID")).toHaveValue(
    "copilot-session-123"
  );

  await page
    .locator(".orchestrator-session-row .orchestrator-session-link", {
      hasText: "Repo support",
    })
    .click();
  await expect(
    page.getByText("Latest coding agent session ID: copilot-session-123")
  ).toBeVisible();
});
