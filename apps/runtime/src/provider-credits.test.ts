import { describe, expect, it } from "vitest";
import { parseOpenCodeStats } from "./provider-credits.js";

describe("provider credits", () => {
  it("parses OpenCode's local stats table", () => {
    const stats = parseOpenCodeStats(
      [
        "│Sessions                                             12 │",
        "│Total Cost                                       $4.25 │",
        "│Input                                           12,345 │",
        "│Output                                           6,789 │",
      ].join("\n")
    );

    expect(stats).toEqual({
      sessions: 12,
      totalCost: "$4.25",
      inputTokens: 12_345,
      outputTokens: 6_789,
    });
  });

  it("uses safe zero defaults for an empty OpenCode history", () => {
    expect(parseOpenCodeStats("")).toEqual({
      sessions: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalCost: undefined,
    });
  });
});
