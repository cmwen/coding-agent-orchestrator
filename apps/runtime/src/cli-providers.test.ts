import { describe, expect, it } from "vitest";
import {
  findCliProviderDefinition,
  normalizeCliProviderId,
  ORCHESTRATOR_CLI_PROVIDER_DEFINITIONS,
  providerSupportsSessionResume,
} from "./cli-providers.js";

describe("coding-agent CLI provider registry", () => {
  it("contains the requested extensible providers and their binaries", () => {
    expect(findCliProviderDefinition("codex")?.command).toBe("codex");
    expect(findCliProviderDefinition("antigravity")?.command).toBe("agy");
    expect(findCliProviderDefinition("grok")?.command).toBe("grok");
    expect(findCliProviderDefinition("grok")?.commandAliases).toContain(
      "grok-build"
    );
  });

  it("normalizes known providers and safely falls back for unknown values", () => {
    expect(normalizeCliProviderId(" codex ")).toBe("codex");
    expect(normalizeCliProviderId("not-installed-yet")).toBe("copilot");
  });

  it("drives conversation-resume behavior from provider metadata", () => {
    expect(providerSupportsSessionResume("antigravity")).toBe(true);
    expect(providerSupportsSessionResume("grok")).toBe(true);
  });

  it("keeps provider ids unique", () => {
    const ids = ORCHESTRATOR_CLI_PROVIDER_DEFINITIONS.map(
      (provider) => provider.descriptor.id
    );
    expect(new Set(ids).size).toBe(ids.length);
  });
});
