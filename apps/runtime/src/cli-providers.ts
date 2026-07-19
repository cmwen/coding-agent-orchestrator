import type { OrchestratorCliProviderDescriptor } from "@coding-agent-orchestrator/shared";

export interface OrchestratorCliProviderDefinition {
  descriptor: OrchestratorCliProviderDescriptor;
  command: string;
  commandAliases?: readonly string[];
  supportsProviderSessionBootstrap?: boolean;
}

export const ORCHESTRATOR_CLI_PROVIDER_DEFINITIONS: readonly OrchestratorCliProviderDefinition[] =
  [
    {
      descriptor: {
        id: "copilot",
        displayName: "GitHub Copilot CLI",
        description:
          "Runs delegated jobs through the GitHub Copilot CLI inside the tmux workspace.",
        capabilities: {
          supportsCustomAgents: true,
          supportsExecutionMode: true,
          supportsProviderSessionResume: true,
        },
      },
      command: "copilot",
      supportsProviderSessionBootstrap: true,
    },
    {
      descriptor: {
        id: "gemini",
        displayName: "Gemini CLI",
        description:
          "Runs delegated jobs through the Gemini CLI inside the tmux workspace.",
        capabilities: {
          supportsCustomAgents: false,
          supportsExecutionMode: false,
          supportsProviderSessionResume: true,
        },
      },
      command: "gemini",
      supportsProviderSessionBootstrap: true,
    },
    {
      descriptor: {
        id: "codex",
        displayName: "OpenAI Codex CLI",
        description:
          "Runs delegated jobs through the OpenAI Codex CLI inside the tmux workspace.",
        capabilities: {
          supportsCustomAgents: false,
          supportsExecutionMode: false,
          supportsProviderSessionResume: true,
        },
      },
      command: "codex",
    },
    {
      descriptor: {
        id: "opencode",
        displayName: "OpenCode CLI",
        description:
          "Runs delegated jobs through the OpenCode CLI inside the tmux workspace.",
        capabilities: {
          supportsCustomAgents: false,
          supportsExecutionMode: false,
          supportsProviderSessionResume: true,
        },
      },
      command: "opencode",
    },
    {
      descriptor: {
        id: "antigravity",
        displayName: "Google Antigravity CLI",
        description:
          "Runs delegated jobs through the Google Antigravity CLI inside the tmux workspace.",
        capabilities: {
          supportsCustomAgents: false,
          supportsExecutionMode: false,
          supportsProviderSessionResume: true,
        },
      },
      command: "agy",
    },
    {
      descriptor: {
        id: "grok",
        displayName: "Grok Build",
        description:
          "Runs delegated jobs through xAI Grok Build's headless CLI mode inside the tmux workspace.",
        capabilities: {
          supportsCustomAgents: false,
          supportsExecutionMode: false,
          supportsProviderSessionResume: true,
        },
      },
      command: "grok",
      commandAliases: ["grok-build"],
      supportsProviderSessionBootstrap: true,
    },
  ] as const;

export type OrchestratorCliProviderId =
  (typeof ORCHESTRATOR_CLI_PROVIDER_DEFINITIONS)[number]["descriptor"]["id"];

export function findCliProviderDefinition(
  providerId: string | undefined
): OrchestratorCliProviderDefinition | undefined {
  return ORCHESTRATOR_CLI_PROVIDER_DEFINITIONS.find(
    (provider) => provider.descriptor.id === providerId
  );
}

export function requireCliProviderDefinition(
  providerId: string
): OrchestratorCliProviderDefinition {
  const provider = findCliProviderDefinition(providerId);
  if (!provider) {
    throw new Error(`Unknown orchestrator CLI provider: ${providerId}`);
  }
  return provider;
}

export function normalizeCliProviderId(
  providerId: string | undefined,
  fallbackProviderId: OrchestratorCliProviderId = "copilot"
): OrchestratorCliProviderId {
  const normalized = providerId?.trim();
  return (findCliProviderDefinition(normalized)?.descriptor.id ??
    fallbackProviderId) as OrchestratorCliProviderId;
}

export function providerSupportsSessionResume(
  providerId: string | undefined
): boolean {
  return Boolean(
    findCliProviderDefinition(providerId)?.descriptor.capabilities
      .supportsProviderSessionResume
  );
}

export function providerSupportsSessionBootstrap(
  providerId: string | undefined
): boolean {
  return Boolean(
    findCliProviderDefinition(providerId)?.supportsProviderSessionBootstrap
  );
}
