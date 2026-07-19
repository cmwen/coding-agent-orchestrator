// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProviderCreditsDashboard } from "./ProviderCreditsDashboard";

afterEach(() => {
  cleanup();
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
});
