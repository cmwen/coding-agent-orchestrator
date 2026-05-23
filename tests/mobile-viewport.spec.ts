import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const SELECTED_SESSION_KEY = "coding-agent-orchestrator:selected-session";

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
  recentProjectPaths: ["/tmp/project", "/tmp/project-two"],
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

const schedules = [
  {
    scheduleId: "schedule-1",
    sessionId: "session-1",
    title: "Daily sync",
    prompt: "Summarize the latest repo activity.",
    frequency: "daily",
    timeOfDay: "09:00",
    timezone: "Australia/Sydney",
    enabled: true,
    totalRuns: 3,
    failedRuns: 0,
    nextRunAt: "2026-05-14T09:00:00.000Z",
    createdAt: "2026-05-10T00:00:00.000Z",
    updatedAt: "2026-05-10T00:00:00.000Z",
    lastJobStatus: "completed",
    emailTo: null,
    customAgentId: null,
    dayOfWeek: null,
    dayOfMonth: null,
  },
];

function createSession(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: "session-1",
    agentId: "copilot-orchestrator",
    title: "Coordinated mobile fix",
    startedAt: "2026-05-12T22:00:00.000Z",
    updatedAt: "2026-05-13T08:00:00.000Z",
    summary: "Fix the mobile layout regressions.",
    projectPath: "/tmp/project/mobile",
    projectPurpose: "Keep the orchestrator usable on small screens.",
    cliProvider: "copilot",
    model: "gpt-5-mini",
    tmuxSessionName: "coding-agent-orchestrator-orchestrator",
    tmuxWindowName: "mobile-fix",
    tmuxPaneId: "%42",
    status: "running",
    activeJobId: "job-1",
    lastJobId: "job-2",
    availableCustomAgents: [
      {
        id: "agent-mobile",
        name: "Mobile QA",
      },
    ],
    selectedCustomAgentId: "agent-mobile",
    executionMode: "fleet",
    sessionDirectory: "/tmp/session-1",
    manifestPath: "/tmp/session-1/SESSION.md",
    systemNotice: "Reconnected to the tmux stream.",
    logSize: 1200,
    terminalTail: "waiting for output\n",
    jobs: [
      {
        jobId: "job-1",
        promptPreview: "Fix the overflowing mobile layout",
        prompt: "Fix the overflowing mobile layout",
        promptMode: "inline",
        status: "running",
        submittedAt: "2026-05-13T07:58:00.000Z",
        startedAt: "2026-05-13T08:01:00.000Z",
      },
      {
        jobId: "job-2",
        promptPreview: "Verify desktop layout",
        prompt: "Verify desktop layout",
        promptMode: "inline",
        status: "queued",
        submittedAt: "2026-05-13T08:02:00.000Z",
      },
    ],
    ...overrides,
  };
}

const baseSessions = [
  createSession(),
  createSession({
    sessionId: "session-2",
    title: "Gemma Agent PWA",
    status: "running",
    updatedAt: "2026-05-13T08:31:27.000Z",
    activeJobId: undefined,
    lastJobId: undefined,
    jobs: [],
  }),
  createSession({
    sessionId: "session-3",
    title: "Agents DB",
    status: "missing",
    updatedAt: "2026-05-12T12:24:10.000Z",
    activeJobId: undefined,
    lastJobId: undefined,
    jobs: [],
  }),
  createSession({
    sessionId: "session-4",
    title: "My Agents",
    status: "missing",
    updatedAt: "2026-05-12T12:24:10.000Z",
    activeJobId: undefined,
    lastJobId: undefined,
    jobs: [],
  }),
  createSession({
    sessionId: "session-5",
    title: "Orchestrator",
    status: "missing",
    updatedAt: "2026-05-12T12:22:03.000Z",
    activeJobId: undefined,
    lastJobId: undefined,
    jobs: [],
  }),
];

async function mockOrchestratorRoutes(page: Page) {
  await page.route("**/api/workspace", async (route) => {
    await route.fulfill({ json: workspace });
  });
  await page.route("**/api/orchestrator/capabilities", async (route) => {
    await route.fulfill({ json: capabilities });
  });
  await page.route("**/api/orchestrator/schedules", async (route) => {
    await route.fulfill({ json: schedules });
  });
  await page.route("**/api/orchestrator/sessions", async (route) => {
    await route.fulfill({ json: baseSessions });
  });
  await page.route(
    /\/api\/orchestrator\/sessions\/[^/]+\/changes$/,
    async (route) => {
      await route.fulfill({
        json: {
          state: "dirty",
          message: "2 changed files",
          files: [
            {
              path: "apps/web/src/styles.css",
              status: "modified",
              addedLines: 8,
              removedLines: 2,
            },
            {
              path: "tests/mobile-viewport.spec.ts",
              status: "modified",
              addedLines: 24,
              removedLines: 10,
            },
          ],
        },
      });
    }
  );
  await page.route(
    /\/api\/orchestrator\/sessions\/[^/]+\/terminal\?before=\d+$/,
    async (route) => {
      await route.fulfill({
        json: {
          chunk: "older output\n",
          startOffset: 0,
          endOffset: 100,
        },
      });
    }
  );
}

async function gotoWithMocks(page: Page) {
  await mockOrchestratorRoutes(page);
  await page.goto("/");
  await expect(page.locator(".orchestrator-brand h1")).toHaveText(
    "Coding Agent CLI Orchestrator"
  );
  await expect(page.locator(".orchestrator-sidebar")).toBeVisible();
}

async function measureViewportFit(page: Page) {
  return page.evaluate(() => {
    const appShell = document.querySelector(".orchestrator-app-shell");
    const sidebar = document.querySelector(".orchestrator-sidebar");
    const sessionList = document.querySelector(".orchestrator-session-list");
    const main = document.querySelector(".orchestrator-main");
    const heading = document.querySelector(".orchestrator-brand h1");
    const mobileNav = document.querySelector(".orchestrator-mobile-nav");
    const terminalPanel = document.querySelector(".terminal-shell");
    const sidebarStyle = sidebar ? window.getComputedStyle(sidebar) : null;
    const sessionListStyle = sessionList
      ? window.getComputedStyle(sessionList)
      : null;
    const mobileNavStyle = mobileNav
      ? window.getComputedStyle(mobileNav)
      : null;
    const terminalPanelStyle = terminalPanel
      ? window.getComputedStyle(terminalPanel)
      : null;

    return {
      viewportWidth: window.innerWidth,
      bodyScrollWidth: document.body.scrollWidth,
      appShellScrollWidth: appShell?.scrollWidth ?? 0,
      sidebarWidth: sidebar?.getBoundingClientRect().width ?? 0,
      mainWidth: main?.getBoundingClientRect().width ?? 0,
      sessionListClientWidth: sessionList?.clientWidth ?? 0,
      sessionListScrollWidth: sessionList?.scrollWidth ?? 0,
      sessionListFlow: sessionListStyle?.gridAutoFlow ?? "",
      sidebarOverflowX: sidebarStyle?.overflowX ?? "",
      headingTextOverflow: heading
        ? window.getComputedStyle(heading).textOverflow
        : "",
      headingWhiteSpace: heading
        ? window.getComputedStyle(heading).whiteSpace
        : "",
      mobileNavPosition: mobileNavStyle?.position ?? "",
      mobileNavBottom: mobileNavStyle?.bottom ?? "",
      mobileNavViewportGap: mobileNav
        ? Math.round(
            window.innerHeight - mobileNav.getBoundingClientRect().bottom
          )
        : -1,
      terminalPanelDisplay: terminalPanelStyle?.display ?? "",
      terminalPanelFlexDirection: terminalPanelStyle?.flexDirection ?? "",
      terminalPanelClientWidth: terminalPanel?.clientWidth ?? 0,
      terminalPanelScrollWidth: terminalPanel?.scrollWidth ?? 0,
    };
  });
}

test.describe("mobile viewport", () => {
  test("keeps the new-session screen within the mobile viewport", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chrome");

    await gotoWithMocks(page);

    const measurements = await measureViewportFit(page);
    expect(measurements.viewportWidth).toBe(393);
    expect(measurements.bodyScrollWidth).toBe(measurements.viewportWidth);
    expect(measurements.appShellScrollWidth).toBe(measurements.viewportWidth);
    expect(Math.round(measurements.sidebarWidth)).toBe(
      measurements.viewportWidth
    );
    expect(Math.round(measurements.mainWidth)).toBe(measurements.viewportWidth);
    expect(measurements.sessionListFlow).toBe("column");
    expect(measurements.sessionListScrollWidth).toBeGreaterThan(
      measurements.sessionListClientWidth
    );
    expect(measurements.sidebarOverflowX).toBe("clip");
    expect(measurements.headingTextOverflow).toBe("ellipsis");
    expect(measurements.headingWhiteSpace).toBe("nowrap");

    await expect(
      page.getByRole("button", { name: "Create session" })
    ).toBeVisible();
    await expect(page.getByLabel("Project purpose")).toBeVisible();
  });

  test("keeps the existing-session controls usable on mobile", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chrome");

    await page.addInitScript((key) => {
      window.localStorage.setItem(key, "session-1");
    }, SELECTED_SESSION_KEY);
    await gotoWithMocks(page);

    await expect(
      page.locator(".orchestrator-session-heading strong")
    ).toHaveText("Coordinated mobile fix");
    await page.getByRole("button", { name: "Session settings" }).click();
    await expect(page.getByLabel("Project name")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create schedule" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Home" }).click();
    await expect(
      page.getByText("Current run plus any queued follow-up work")
    ).toBeVisible();

    const measurements = await measureViewportFit(page);
    expect(measurements.bodyScrollWidth).toBe(measurements.viewportWidth);
    expect(measurements.appShellScrollWidth).toBe(measurements.viewportWidth);
    await expect(
      page.getByRole("button", { name: "Cancel job" })
    ).toBeVisible();
    expect(measurements.mobileNavPosition).toBe("sticky");
    expect(measurements.mobileNavBottom).toBe("0px");
    expect(measurements.mobileNavViewportGap).toBeGreaterThanOrEqual(0);

    await page.locator(".orchestrator-main").evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });

    const scrolledMeasurements = await measureViewportFit(page);
    expect(
      Math.abs(
        scrolledMeasurements.mobileNavViewportGap -
          measurements.mobileNavViewportGap
      )
    ).toBeLessThanOrEqual(2);

    await page.getByRole("button", { name: "Terminal", exact: true }).click();
    await expect(page.getByText("Send raw terminal input")).toBeVisible();

    const terminalMeasurements = await measureViewportFit(page);
    expect(terminalMeasurements.bodyScrollWidth).toBe(
      terminalMeasurements.viewportWidth
    );
    expect(terminalMeasurements.appShellScrollWidth).toBe(
      terminalMeasurements.viewportWidth
    );
    expect(terminalMeasurements.terminalPanelDisplay).toBe("flex");
    expect(terminalMeasurements.terminalPanelFlexDirection).toBe("column");
    expect(terminalMeasurements.terminalPanelScrollWidth).toBeLessThanOrEqual(
      terminalMeasurements.terminalPanelClientWidth
    );
  });
});

test.describe("desktop viewport", () => {
  test("preserves the desktop split layout", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium");

    await gotoWithMocks(page);

    const layout = await page.evaluate(() => {
      const shell = document.querySelector(".orchestrator-app-shell");
      const sidebar = document.querySelector(".orchestrator-sidebar");
      const sessionList = document.querySelector(".orchestrator-session-list");

      return {
        viewportWidth: window.innerWidth,
        bodyScrollWidth: document.body.scrollWidth,
        columns: shell
          ? window.getComputedStyle(shell).gridTemplateColumns
          : "",
        sidebarWidth: sidebar?.getBoundingClientRect().width ?? 0,
        sessionListFlow: sessionList
          ? window.getComputedStyle(sessionList).gridAutoFlow
          : "",
      };
    });

    expect(layout.bodyScrollWidth).toBe(layout.viewportWidth);
    expect(layout.columns.split(" ").length).toBe(2);
    expect(layout.sidebarWidth).toBeGreaterThan(250);
    expect(layout.sessionListFlow).not.toBe("column");
  });
});
