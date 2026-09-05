import { describe, expect, it } from "vitest";
import {
  codexQuotaRetryAt,
  getCodexQuotaExhaustion,
  isCodexUsageLimitOutput,
  parseCodexRateLimits,
} from "./codex-quota.js";

describe("Codex quota windows", () => {
  it("reads the current singular app-server response", () => {
    const snapshot = parseCodexRateLimits({
      rateLimits: {
        primary: { usedPercent: 100, windowDurationMins: 300, resetsAt: 2_000 },
        secondary: {
          usedPercent: 25,
          windowDurationMins: 10_080,
          resetsAt: 3_000,
        },
      },
    });

    expect(snapshot?.primary?.usedPercent).toBe(100);
    expect(snapshot?.secondary?.windowDurationMins).toBe(10_080);
  });

  it("supports the newer per-limit response and selects the later reset", () => {
    const snapshot = parseCodexRateLimits({
      rateLimitsByLimitId: {
        included: {
          primary: { usedPercent: 100, resetsAt: 2_000 },
          secondary: { usedPercent: 100, resetsAt: 1_500 },
        },
      },
    });

    expect(getCodexQuotaExhaustion(snapshot, 1_000_000)).toMatchObject({
      exhausted: true,
      window: "primary",
      resetAt: "1970-01-01T00:33:20.000Z",
    });
  });

  it("does not defer when an exhausted window has already reset", () => {
    expect(
      getCodexQuotaExhaustion(
        { primary: { usedPercent: 100, resetsAt: 1_000 } },
        1_000_001
      )
    ).toEqual({ exhausted: false });
  });

  it("uses a short polling deferral when the provider omits resetAt", () => {
    const exhaustion = getCodexQuotaExhaustion({
      primary: { usedPercent: 100, resetsAt: null },
    });
    expect(codexQuotaRetryAt(exhaustion, 1_000_000)).toBe(
      "1970-01-01T00:17:40.000Z"
    );
  });

  it("recognizes Codex limit failures for requeueing", () => {
    expect(
      isCodexUsageLimitOutput("Usage limit reached; try again later")
    ).toBe(true);
    expect(isCodexUsageLimitOutput("Implemented the requested change.")).toBe(
      false
    );
  });
});
