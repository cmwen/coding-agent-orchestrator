import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { WorkspaceSummary } from "@coding-agent-orchestrator/shared";

export interface ResolveWorkspaceOptions {
  storeRoot?: string;
  copilotConfigDir?: string;
}

export interface OrchestratorWorkspace {
  storeRoot: string;
  agentsRoot: string;
  memoryRoot: string;
  skillsRoot: string;
  copilotConfigDir: string;
  copilotSkillsRoot: string;
}

export async function resolveWorkspace(
  options: ResolveWorkspaceOptions = {}
): Promise<OrchestratorWorkspace> {
  const storeRoot = await resolveStoreRoot(options.storeRoot);
  const copilotConfigDir = path.resolve(
    options.copilotConfigDir ?? path.join(os.homedir(), ".copilot")
  );

  return {
    storeRoot,
    agentsRoot: path.join(storeRoot, "agents"),
    memoryRoot: path.join(storeRoot, "memory"),
    skillsRoot: path.join(storeRoot, "skills"),
    copilotConfigDir,
    copilotSkillsRoot: path.join(copilotConfigDir, "skills"),
  };
}

export async function summarizeWorkspace(
  workspace: OrchestratorWorkspace
): Promise<WorkspaceSummary> {
  const { pathExists } = await import("./utils.js");
  const { readDirNames } = await import("./utils.js");
  const agentNames = (await pathExists(workspace.agentsRoot))
    ? await readDirNames(workspace.agentsRoot)
    : [];

  return {
    storeRoot: workspace.storeRoot,
    copilotConfigDir: workspace.copilotConfigDir,
    storeSkillDirectory: workspace.skillsRoot,
    copilotSkillDirectory: workspace.copilotSkillsRoot,
    agentCount: agentNames.filter((name) => name !== "default").length,
  };
}

async function resolveStoreRoot(explicitRoot?: string): Promise<string> {
  const configuredRoot = [
    explicitRoot,
    process.env.CODING_AGENT_ORCHESTRATOR_STORE_ROOT,
    path.join(os.homedir(), ".local", "share", "coding-agent-orchestrator"),
  ].find((candidate): candidate is string => Boolean(candidate));

  const storeRoot = path.resolve(
    configuredRoot ??
      path.join(os.homedir(), ".local", "share", "coding-agent-orchestrator")
  );
  await Promise.all([
    mkdir(path.join(storeRoot, "agents"), { recursive: true }),
    mkdir(path.join(storeRoot, "memory"), { recursive: true }),
    mkdir(path.join(storeRoot, "skills"), { recursive: true }),
  ]);
  return storeRoot;
}
