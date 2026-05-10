const port = Number(process.env.CODING_AGENT_ORCHESTRATOR_PORT ?? 8791);
const url = `http://localhost:${port}/api/health`;
const deadline = Date.now() + 30_000;

while (Date.now() < deadline) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      process.exit(0);
    }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 500));
}

console.error(`Runtime did not become healthy at ${url}`);
process.exit(1);
