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
- `GET /api/orchestrator/provider-credits`
- `GET /api/orchestrator/provider-credits?refresh=true`
- `GET /api/orchestrator/sessions`
- `POST /api/orchestrator/sessions`
- `GET /api/orchestrator/sessions/:sessionId`
- `PATCH /api/orchestrator/sessions/:sessionId`
- `DELETE /api/orchestrator/sessions/:sessionId`
- `GET /api/orchestrator/sessions/:sessionId/changes`
- `GET /api/orchestrator/sessions/:sessionId/changes/diff?path=<file>`
- `GET /api/orchestrator/sessions/:sessionId/files?path=<directory>`
- `GET /api/orchestrator/sessions/:sessionId/files/content?path=<file>`
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

Session create and update payloads accept `providerSessionId` and
`reuseProviderSession`. Reuse defaults to `true` when omitted. A delegated job's
`providerSessionId` is an optional one-task override; otherwise the runtime uses
the session's saved or most recently discovered provider ID.

The capabilities response includes `cliProviders` for installed backends and
`supportedCliProviders` for the full registry. Each supported descriptor may
include `command`, `installed`, and provider-specific capabilities such as
`supportsProviderSessionResume`. Legacy per-provider installation booleans are
retained for API compatibility.

The provider-credits response includes `checkedAt`, `cacheTtlSeconds`, and
one status per registered provider. Statuses distinguish live CLI data, local
usage statistics, interactive/provider-dashboard fallbacks, unavailable data,
collector errors, and missing binaries. Metrics may include a display value,
used/remaining percentages, and an ISO reset time. The default request uses the
60-second runtime cache; `refresh=true` forces a new concurrent collection.
