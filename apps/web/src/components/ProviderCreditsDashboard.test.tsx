// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProviderCreditsDashboard } from "./ProviderCreditsDashboard";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ProviderCreditsDashboard", () => {
  it("shows live balances and refreshes on demand", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          checkedAt: new Date().toISOString(),
          cacheTtlSeconds: 60,
          providers: [
            {
              providerId: "codex",
              displayName: "OpenAI Codex CLI",
              installed: true,
              status: "live",
              source: "live-cli",
              summary: "Live allowance from Codex.",
              plan: "Plus",
              checkedAt: new Date().toISOString(),
              metrics: [
                {
                  id: "primary",
                  label: "7-day limit",
                  value: "96% remaining",
                  remainingPercent: 96,
                  usedPercent: 4,
                  resetAt: new Date(Date.now() + 86_400_000).toISOString(),
                },
              ],
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ProviderCreditsDashboard
        active
        providers={[
          {
            id: "codex",
            displayName: "OpenAI Codex CLI",
            capabilities: {
              supportsCustomAgents: false,
              supportsExecutionMode: false,
            },
          },
        ]}
      />
    );

    expect(await screen.findByText("96% remaining")).toBeTruthy();
    expect(screen.getByText("Plus")).toBeTruthy();
    expect(
      screen
        .getByRole("progressbar", { name: "7-day limit remaining" })
        .getAttribute("aria-valuenow")
    ).toBe("96");

    await userEvent.click(
      screen.getByRole("button", { name: "Refresh usage" })
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1]?.[0]).toContain("refresh=true");
  });

  it("labels Codex five-hour and weekly windows and gives a safe prompt time", async () => {
    vi.spyOn(Date, "now").mockReturnValue(
      Date.parse("2026-09-05T00:00:00.000Z")
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            checkedAt: "2026-09-05T00:00:00.000Z",
            cacheTtlSeconds: 60,
            providers: [
              {
                providerId: "codex",
                displayName: "OpenAI Codex CLI",
                installed: true,
                status: "live",
                source: "live-cli",
                summary: "Live allowance from Codex.",
                checkedAt: "2026-09-05T00:00:00.000Z",
                metrics: [
                  {
                    id: "primary",
                    label: "5h",
                    value: "0% remaining",
                    remainingPercent: 0,
                    usedPercent: 100,
                    resetAt: "2026-09-05T02:00:00.000Z",
                  },
                  {
                    id: "secondary",
                    label: "7-day",
                    value: "62% remaining",
                    remainingPercent: 62,
                    usedPercent: 38,
                    resetAt: "2026-09-08T00:00:00.000Z",
                  },
                ],
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
    );

    render(
      <ProviderCreditsDashboard
        active
        providers={[
          {
            id: "codex",
            displayName: "OpenAI Codex CLI",
            capabilities: {
              supportsCustomAgents: false,
              supportsExecutionMode: false,
            },
          },
        ]}
      />
    );

    expect(await screen.findByText("5-hour window")).toBeTruthy();
    expect(screen.getByText("Weekly window")).toBeTruthy();
    expect(screen.getByText("Next safe prompt")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toMatch(/in 2h/);
    expect(screen.getByText(/Resets.*in 2h/)).toBeTruthy();
  });

  it("does not defer for a zero balance whose reset has already passed", async () => {
    vi.spyOn(Date, "now").mockReturnValue(
      Date.parse("2026-09-05T03:00:00.000Z")
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            checkedAt: "2026-09-05T03:00:00.000Z",
            cacheTtlSeconds: 60,
            providers: [
              {
                providerId: "codex",
                displayName: "OpenAI Codex CLI",
                installed: true,
                status: "live",
                source: "live-cli",
                summary: "Live allowance from Codex.",
                checkedAt: "2026-09-05T03:00:00.000Z",
                metrics: [
                  {
                    id: "primary",
                    label: "5h",
                    value: "0% remaining",
                    remainingPercent: 0,
                    usedPercent: 100,
                    resetAt: "2026-09-05T02:00:00.000Z",
                  },
                ],
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
    );

    render(
      <ProviderCreditsDashboard
        active
        providers={[
          {
            id: "codex",
            displayName: "OpenAI Codex CLI",
            capabilities: {
              supportsCustomAgents: false,
              supportsExecutionMode: false,
            },
          },
        ]}
      />
    );

    expect(await screen.findByText("Safe to prompt")).toBeTruthy();
    expect(screen.queryByText("Next safe prompt")).toBeNull();
    expect(screen.getByText(/reset due/)).toBeTruthy();
  });
});
