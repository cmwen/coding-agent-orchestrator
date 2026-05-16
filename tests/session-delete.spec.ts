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

function createSession(sessionId: string, title: string, updatedAt: string) {
  return {
    sessionId,
    agentId: "copilot-orchestrator",
    title,
    startedAt: "2026-05-12T22:00:00.000Z",
    updatedAt,
    summary: `${title} summary`,
    projectPath: `/tmp/project/${sessionId}`,
    projectPurpose: `${title} purpose`,
    cliProvider: "copilot",
    model: "gpt-5-mini",
    tmuxSessionName: "coding-agent-orchestrator-orchestrator",
    tmuxWindowName: sessionId,
    tmuxPaneId: "%42",
    status: "idle",
    activeJobId: undefined,
    lastJobId: undefined,
    availableCustomAgents: [],
    selectedCustomAgentId: undefined,
    executionMode: "standard",
    sessionDirectory: `/tmp/${sessionId}`,
    manifestPath: `/tmp/${sessionId}/SESSION.md`,
    terminalTail: "",
    logSize: 0,
    jobs: [],
  };
}

test.describe("session delete UX", () => {
  test("supports single-session delete without bulk actions", async ({
    page,
  }) => {
    const sessions = [
      createSession("session-1", "Keep me", "2026-05-13T08:00:00.000Z"),
      createSession("session-2", "Delete me", "2026-05-13T07:00:00.000Z"),
    ];
    const deletedSessionIds: string[] = [];

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
      "**/api/orchestrator/sessions/session-2",
      async (route) => {
        if (route.request().method() !== "DELETE") {
          await route.fallback();
          return;
        }

        deletedSessionIds.push("session-2");
        const deleteIndex = sessions.findIndex(
          (session) => session.sessionId === "session-2"
        );
        if (deleteIndex >= 0) {
          sessions.splice(deleteIndex, 1);
        }

        await route.fulfill({ json: { ok: true } });
      }
    );

    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Coding Agent CLI Orchestrator" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Remove selected" })
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Select all" })).toHaveCount(
      0
    );

    await page.getByRole("button", { name: "Delete me" }).click();
    await page.getByRole("button", { name: "Delete session" }).click();

    await expect(
      page.getByRole("heading", { name: "Delete session" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
    await expect(
      page.getByText('This permanently removes "Delete me" from the app.')
    ).toBeVisible();
    await expect(
      page.getByText(
        'Session history, terminal output, and queued work for "Delete me" will be deleted.'
      )
    ).toBeVisible();

    await page
      .getByRole("dialog", { name: "Delete session" })
      .getByRole("button", { name: "Delete session" })
      .click();

    await expect(page.getByRole("button", { name: "Delete me" })).toHaveCount(
      0
    );
    await expect(page.getByRole("button", { name: "Keep me" })).toHaveCount(1);
    expect(deletedSessionIds).toEqual(["session-2"]);
  });
});
