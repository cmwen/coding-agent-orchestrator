# API

The runtime serves JSON under `/api`.

Errors use:

```json
{ "error": "Message" }
```

## Health

- `GET /api/health`
- `GET /api/workspace`

## Orchestrator

- `GET /api/orchestrator/agent`
- `GET /api/orchestrator/capabilities`
- `GET /api/orchestrator/sessions`
- `POST /api/orchestrator/sessions`
- `GET /api/orchestrator/sessions/:sessionId`
- `PATCH /api/orchestrator/sessions/:sessionId`
- `DELETE /api/orchestrator/sessions/:sessionId`
- `GET /api/orchestrator/sessions/:sessionId/changes`
- `GET /api/orchestrator/sessions/:sessionId/changes/diff?path=<file>`
- `GET /api/orchestrator/sessions/:sessionId/terminal`
- `GET /api/orchestrator/sessions/:sessionId/stream`
- `POST /api/orchestrator/sessions/:sessionId/jobs`
- `POST /api/orchestrator/sessions/:sessionId/jobs/:jobId/retry`
- `DELETE /api/orchestrator/sessions/:sessionId/jobs/:jobId`
- `POST /api/orchestrator/sessions/:sessionId/input`
- `POST /api/orchestrator/sessions/:sessionId/cancel`
- `POST /api/orchestrator/sessions/:sessionId/restart`

## Schedules

- `GET /api/orchestrator/schedules`
- `GET /api/orchestrator/schedules?sessionId=<sessionId>`
- `POST /api/orchestrator/schedules`
- `PATCH /api/orchestrator/schedules/:scheduleId`
- `DELETE /api/orchestrator/schedules/:scheduleId`

Contracts live in `packages/shared/src/index.ts`.

