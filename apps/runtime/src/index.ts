import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  OrchestratorDelegateRequest,
  OrchestratorScheduleCreateRequest,
  OrchestratorScheduleUpdateRequest,
  OrchestratorSession,
  OrchestratorSessionCreateRequest,
  OrchestratorSessionUpdateRequest,
  OrchestratorTerminalHistoryChunk,
  OrchestratorTerminalInputRequest,
  OrchestratorWorkingTree,
  OrchestratorWorkingTreeDiff,
  WorkspaceSummary,
} from "@coding-agent-orchestrator/shared";
import {
  orchestratorDelegateRequestSchema,
  orchestratorScheduleCreateSchema,
  orchestratorScheduleUpdateSchema,
  orchestratorSessionCreateSchema,
  orchestratorSessionUpdateSchema,
  orchestratorTerminalHistoryChunkSchema,
  orchestratorTerminalInputSchema,
  orchestratorWorkingTreeDiffSchema,
  orchestratorWorkingTreeSchema,
} from "@coding-agent-orchestrator/shared";
import {
  resolveWorkspace,
  summarizeWorkspace,
} from "@coding-agent-orchestrator/store";
import { type HttpBindings, serve } from "@hono/node-server";
import { RESPONSE_ALREADY_SENT } from "@hono/node-server/utils/response";
import { type Context, Hono } from "hono";
import { readRuntimePort } from "./env.js";
import { getHttpErrorMessage, getHttpErrorStatus } from "./http-errors.js";
import { TmuxOrchestratorService } from "./orchestrator.js";
import { computeNextRunAt, OrchestratorScheduleService } from "./scheduler.js";

const workspace = await resolveWorkspace();
const defaultProjectPath = process.cwd();
const ORCHESTRATOR_TERMINAL_PAGE_LINE_LIMIT = 2_000;
const orchestrator = new TmuxOrchestratorService(workspace, defaultProjectPath);
const scheduleService = new OrchestratorScheduleService(
  workspace,
  orchestrator
);
const app = new Hono<{ Bindings: HttpBindings }>();
const port = readRuntimePort();
const runtimeDir = path.dirname(fileURLToPath(import.meta.url));
const webDistRoot = path.resolve(runtimeDir, "../../web/dist");
const webDistIndex = path.join(webDistRoot, "index.html");

app.onError((error, context) => {
  const status = getHttpErrorStatus(error);
  const log = status >= 500 ? console.error : console.warn;
  log(error);
  return context.json({ error: getHttpErrorMessage(error) }, status);
});

app.get("/api/health", async (context) => {
  const summary: WorkspaceSummary = await summarizeWorkspace(workspace);
  return context.json({ ok: true, workspace: summary });
});

app.get("/api/workspace", async (context) => {
  return context.json(await summarizeWorkspace(workspace));
});

app.get("/api/orchestrator/agent", async (context) => {
  return context.json(await orchestrator.getAgentSummary());
});

app.get("/api/orchestrator/capabilities", async (context) => {
  return context.json(await orchestrator.getCapabilities());
});

app.get("/api/orchestrator/sessions", async (context) => {
  return context.json(await orchestrator.listSessions());
});

app.post("/api/orchestrator/sessions", async (context) => {
  const request = orchestratorSessionCreateSchema.parse(
    (await context.req.json()) satisfies OrchestratorSessionCreateRequest
  );
  return context.json(await orchestrator.createSession(request));
});

app.get("/api/orchestrator/sessions/:sessionId", async (context) => {
  return context.json(
    await orchestrator.getSession(context.req.param("sessionId"))
  );
});

app.patch("/api/orchestrator/sessions/:sessionId", async (context) => {
  const request = orchestratorSessionUpdateSchema.parse(
    (await context.req.json()) satisfies OrchestratorSessionUpdateRequest
  );
  return context.json(
    await orchestrator.updateSession(context.req.param("sessionId"), request)
  );
});

app.delete("/api/orchestrator/sessions/:sessionId", async (context) => {
  await orchestrator.deleteSession(context.req.param("sessionId"));
  return context.json({ ok: true });
});

app.get("/api/orchestrator/sessions/:sessionId/changes", async (context) => {
  const changes = orchestratorWorkingTreeSchema.parse(
    (await orchestrator.getSessionChanges(
      context.req.param("sessionId")
    )) satisfies OrchestratorWorkingTree
  );
  return context.json(changes);
});

app.get(
  "/api/orchestrator/sessions/:sessionId/changes/diff",
  async (context) => {
    const filePath = context.req.query("path")?.trim();
    if (!filePath) {
      return context.json({ error: "Change path is required." }, 400);
    }

    const diff = orchestratorWorkingTreeDiffSchema.parse(
      (await orchestrator.getSessionChangeDiff(
        context.req.param("sessionId"),
        filePath
      )) satisfies OrchestratorWorkingTreeDiff
    );
    return context.json(diff);
  }
);

app.get("/api/orchestrator/sessions/:sessionId/terminal", async (context) => {
  const sessionId = context.req.param("sessionId");
  const requestedBefore = Number.parseInt(
    context.req.query("before") ?? Number.MAX_SAFE_INTEGER.toString(),
    10
  );
  const beforeOffset =
    Number.isFinite(requestedBefore) && requestedBefore >= 0
      ? requestedBefore
      : Number.MAX_SAFE_INTEGER;
  const requestedMaxLines = Number.parseInt(
    context.req.query("maxLines") ??
      ORCHESTRATOR_TERMINAL_PAGE_LINE_LIMIT.toString(),
    10
  );
  const maxLines =
    Number.isFinite(requestedMaxLines) && requestedMaxLines > 0
      ? Math.min(requestedMaxLines, ORCHESTRATOR_TERMINAL_PAGE_LINE_LIMIT)
      : ORCHESTRATOR_TERMINAL_PAGE_LINE_LIMIT;

  const chunk = orchestratorTerminalHistoryChunkSchema.parse(
    (await orchestrator.readTerminalHistoryChunk(
      sessionId,
      beforeOffset,
      maxLines
    )) satisfies OrchestratorTerminalHistoryChunk
  );
  return context.json(chunk);
});

app.post("/api/orchestrator/sessions/:sessionId/jobs", async (context) => {
  const request = orchestratorDelegateRequestSchema.parse(
    (await context.req.json()) satisfies OrchestratorDelegateRequest
  );
  return context.json(
    await orchestrator.delegate(context.req.param("sessionId"), request)
  );
});

app.post(
  "/api/orchestrator/sessions/:sessionId/jobs/:jobId/retry",
  async (context) => {
    return context.json(
      await orchestrator.retryJob(
        context.req.param("sessionId"),
        context.req.param("jobId")
      )
    );
  }
);

app.delete(
  "/api/orchestrator/sessions/:sessionId/jobs/:jobId",
  async (context) => {
    return context.json(
      await orchestrator.deleteQueuedJob(
        context.req.param("sessionId"),
        context.req.param("jobId")
      )
    );
  }
);

app.post("/api/orchestrator/sessions/:sessionId/input", async (context) => {
  const request = orchestratorTerminalInputSchema.parse(
    (await context.req.json()) satisfies OrchestratorTerminalInputRequest
  );
  return context.json(
    await orchestrator.sendInput(
      context.req.param("sessionId"),
      request.input,
      request.submit
    )
  );
});

app.post("/api/orchestrator/sessions/:sessionId/cancel", async (context) => {
  return context.json(
    await orchestrator.cancelJob(context.req.param("sessionId"))
  );
});

app.post("/api/orchestrator/sessions/:sessionId/restart", async (context) => {
  return context.json(
    await orchestrator.restartSession(context.req.param("sessionId"))
  );
});

app.get("/api/orchestrator/schedules", async (context) => {
  const sessionId = context.req.query("sessionId") ?? undefined;
  return context.json(await orchestrator.listSchedules(sessionId));
});

app.post("/api/orchestrator/schedules", async (context) => {
  const request = orchestratorScheduleCreateSchema.parse(
    (await context.req.json()) satisfies OrchestratorScheduleCreateRequest
  );
  return context.json(
    await orchestrator.createSchedule(request, computeNextRunAt(request))
  );
});

app.patch("/api/orchestrator/schedules/:scheduleId", async (context) => {
  const request = orchestratorScheduleUpdateSchema.parse(
    (await context.req.json()) satisfies OrchestratorScheduleUpdateRequest
  );
  return context.json(
    await orchestrator.updateSchedule(
      context.req.param("scheduleId"),
      request,
      computeNextRunAt(request)
    )
  );
});

app.delete("/api/orchestrator/schedules/:scheduleId", async (context) => {
  await orchestrator.deleteSchedule(context.req.param("scheduleId"));
  return context.json({ ok: true });
});

app.get("/api/orchestrator/sessions/:sessionId/stream", async (context) => {
  return streamOrchestratorTerminal(context, context.req.param("sessionId"));
});

app.get("/", async (context) => serveWebRequest(context, "/"));
app.get("/*", async (context) => serveWebRequest(context, context.req.path));

serve({ fetch: app.fetch, port });
scheduleService.start();
console.log(
  `coding-agent-orchestrator runtime listening on http://localhost:${port}`
);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    scheduleService.stop();
    process.exit(0);
  });
}

async function streamOrchestratorTerminal(
  context: Context<{ Bindings: HttpBindings }>,
  sessionId: string
) {
  const initialSession = await orchestrator.getSession(sessionId);
  const { incoming, outgoing } = context.env;
  let closed = false;
  let busy = false;
  let offset = Number.parseInt(context.req.query("offset") ?? "0", 10);
  if (!Number.isFinite(offset) || offset < 0) {
    offset = 0;
  }
  let lastSessionSignal = buildSessionSignal(initialSession);

  const sendEvent = (event: string, data: unknown) => {
    if (closed) {
      return;
    }
    outgoing.write(`event: ${event}\n`);
    outgoing.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  outgoing.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-store, no-cache, no-transform",
    connection: "keep-alive",
  });
  outgoing.write("retry: 1000\n\n");

  sendEvent("session", initialSession);
  if (offset === 0 && initialSession.terminalTail) {
    offset = Math.max(
      0,
      initialSession.logSize - Buffer.byteLength(initialSession.terminalTail)
    );
    sendEvent("output", {
      chunk: initialSession.terminalTail,
      nextOffset: initialSession.logSize,
    });
  }

  const tick = async () => {
    if (closed || busy) {
      return;
    }
    busy = true;
    try {
      const chunk = await orchestrator.readTerminalChunk(sessionId, offset);
      if (chunk.chunk) {
        offset = chunk.nextOffset;
        sendEvent("output", chunk);
      }

      const session = await orchestrator.getSession(sessionId);
      const nextSessionSignal = buildSessionSignal(session);
      if (nextSessionSignal !== lastSessionSignal) {
        lastSessionSignal = nextSessionSignal;
        sendEvent("session", session);
      }

      sendEvent("heartbeat", {
        offset,
        status: session.status,
      });
    } catch (error) {
      sendEvent("error", {
        message:
          error instanceof Error ? error.message : "Unknown stream error",
      });
      cleanup();
    } finally {
      busy = false;
    }
  };

  const interval = setInterval(() => {
    void tick();
  }, 1000);

  const cleanup = () => {
    if (closed) {
      return;
    }
    closed = true;
    clearInterval(interval);
    outgoing.end();
  };

  incoming.on("close", cleanup);
  return RESPONSE_ALREADY_SENT;
}

function buildSessionSignal(
  session: Pick<
    OrchestratorSession,
    "updatedAt" | "status" | "activeJobId" | "lastJobId"
  >
): string {
  return JSON.stringify({
    updatedAt: session.updatedAt,
    status: session.status,
    activeJobId: session.activeJobId,
    lastJobId: session.lastJobId,
  });
}

async function serveWebRequest(
  context: Context<{ Bindings: HttpBindings }>,
  requestPath: string
) {
  if (requestPath.startsWith("/api/")) {
    return context.notFound();
  }

  const assetPath = resolveWebAssetPath(requestPath);
  if (assetPath) {
    try {
      return await serveWebFile(context, assetPath);
    } catch (error) {
      if (!isNodeError(error) || error.code !== "ENOENT") {
        throw error;
      }

      if (path.extname(requestPath)) {
        return context.notFound();
      }
    }
  }

  try {
    return await serveWebFile(context, webDistIndex);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return context.json({
        name: "coding-agent-orchestrator runtime",
        message:
          "Run the web app separately with `pnpm dev:web` or build it with `pnpm --filter @coding-agent-orchestrator/web build`.",
      });
    }

    throw error;
  }
}

function resolveWebAssetPath(requestPath: string): string | undefined {
  const normalizedPath =
    requestPath === "/" ? "/index.html" : path.posix.normalize(requestPath);
  const resolvedPath = path.resolve(webDistRoot, `.${normalizedPath}`);
  return resolvedPath.startsWith(webDistRoot) ? resolvedPath : undefined;
}

async function serveWebFile(
  context: Context<{ Bindings: HttpBindings }>,
  filePath: string
) {
  const body = await fs.readFile(filePath);
  return context.body(body, 200, {
    "cache-control": getWebCacheControl(filePath),
    "content-type": getContentType(filePath),
  });
}

function getContentType(filePath: string): string {
  switch (path.extname(filePath)) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    case ".ico":
      return "image/x-icon";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    case ".webmanifest":
      return "application/manifest+json; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

function getWebCacheControl(filePath: string): string {
  const normalizedPath = filePath.split(path.sep).join("/");
  const basename = path.basename(normalizedPath);

  if (
    normalizedPath.endsWith("/index.html") ||
    normalizedPath.endsWith("/manifest.webmanifest") ||
    normalizedPath.endsWith("/sw.js")
  ) {
    return "no-cache";
  }

  if (
    normalizedPath.includes("/assets/") &&
    /-[A-Za-z0-9_-]{8,}\.[^.]+$/.test(basename)
  ) {
    return "public, max-age=31536000, immutable";
  }

  return "public, max-age=86400";
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
