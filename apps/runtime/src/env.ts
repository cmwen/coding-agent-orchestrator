export const DEFAULT_RUNTIME_PORT = 8791;
export const DEFAULT_ORCHESTRATOR_TMUX_SESSION_NAME =
  "coding-agent-orchestrator-orchestrator";

export interface RuntimeSmtpEnv {
  host?: string;
  port?: string;
  secure: boolean;
  user?: string;
  pass?: string;
  from?: string;
  normalizedFrom?: string;
  replyTo?: string;
}

export function readRuntimePort(env: NodeJS.ProcessEnv = process.env): number {
  return Number(env.CODING_AGENT_ORCHESTRATOR_PORT ?? DEFAULT_RUNTIME_PORT);
}

export function readOrchestratorTmuxSessionName(
  env: NodeJS.ProcessEnv = process.env
): string {
  return (
    env.CODING_AGENT_ORCHESTRATOR_ORCHESTRATOR_TMUX_SESSION ??
    DEFAULT_ORCHESTRATOR_TMUX_SESSION_NAME
  );
}

export function readRuntimeSmtpEnv(
  env: NodeJS.ProcessEnv = process.env
): RuntimeSmtpEnv {
  const from = env.CODING_AGENT_ORCHESTRATOR_SMTP_FROM;
  return {
    host: readTrimmedEnvValue(env.CODING_AGENT_ORCHESTRATOR_SMTP_HOST),
    port: readTrimmedEnvValue(env.CODING_AGENT_ORCHESTRATOR_SMTP_PORT),
    secure: env.CODING_AGENT_ORCHESTRATOR_SMTP_SECURE === "true",
    user: readTrimmedEnvValue(env.CODING_AGENT_ORCHESTRATOR_SMTP_USER),
    pass: env.CODING_AGENT_ORCHESTRATOR_SMTP_PASS,
    from,
    normalizedFrom: readTrimmedEnvValue(from),
    replyTo: env.CODING_AGENT_ORCHESTRATOR_SMTP_REPLY_TO,
  };
}

export function isRuntimeSmtpConfigured(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  const smtp = readRuntimeSmtpEnv(env);
  return [smtp.host, smtp.port, smtp.normalizedFrom].every(
    (value) => typeof value === "string" && value.length > 0
  );
}

function readTrimmedEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
