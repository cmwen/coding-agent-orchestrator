# Wireframe Implementation Plan

## Outcome

The current orchestrator UI already ships most of the **Design 03 shell**:

- desktop sidebar + session list
- command palette
- workspace tabs for Delegate / Terminal / Queue / Changes / Schedules / Settings
- mobile Home queue board, session switcher, and bottom navigation

The biggest gap is that the **new wireframe-defined Master Session workflow is not implemented at all**. The repo has design/spec docs for it, but the shared schemas, store, runtime APIs, and web UI still behave like a standard-session-only product. There are also a few smaller UI parity gaps with the wireframe assets.

## Gap Summary

| Area | Current state | Wireframe target | Gap |
| --- | --- | --- | --- |
| Desktop Design 03 shell | Present in `App.tsx` + `OrchestratorPane.tsx` | Command-center shell | Mostly shipped |
| Mobile Home / bottom nav | Present | Queue-first mobile board | Mostly shipped |
| Master session type | Not present in shared/store/runtime | `role: "master"` | Missing |
| Pinned master item in sidebar | Not present | Pinned top card with control icon + active-session badge | Missing |
| Master workspace layout | Not present | Session grid + delegation plan + live terminal + prompt | Missing |
| Plan/review/approval flow | Not present | Approve all / review each / skip / edit | Missing |
| Master persistence | Not present | `master-batches/<batch-id>/BATCH.json` + `plan.md` | Missing |
| Master APIs / SSE | Not present | master bootstrap, batches, sessions overview, approval endpoints | Missing |
| Dispatch traceability | Not present | `masterBatchId` / `masterItemId`, “dispatched from master” badge | Missing |
| Delegation history drawer | Not present | History rollup drawer | Missing |
| Master shortcuts | Not present | `Ctrl+M`, review shortcuts | Missing |
| Wireframe icon parity | Mobile nav still uses emoji/text icons | SVG icon set from `docs/ux-proposals` | Missing polish |

## Detailed Missing Pieces

### 1. Shared contracts and data model

- Add `orchestratorSessionRoleSchema = z.enum(["standard", "master"])`.
- Extend `OrchestratorSession`, create/update request schemas, and summaries with `role`.
- Extend `OrchestratorJob` with optional `masterBatchId` and `masterItemId`.
- Add shared schemas for:
  - `MasterBatch`
  - `MasterBatchItem`
  - master sessions overview payload
  - approval/update request bodies
  - master history/list responses

### 2. Store layer

- Enforce **exactly one master session** at creation time.
- Persist master batches under:
  - `agents/copilot-orchestrator/history/YYYY-MM/<master-session-id>/master-batches/<batch-id>/BATCH.json`
  - `.../master-batches/<batch-id>/plan.md`
- Add helpers to:
  - list/find master session
  - create/read/update/delete master batches
  - write human-readable plan markdown
  - list delegation history for the drawer
- Keep standard session behavior unchanged.

### 3. Runtime / orchestration backend

- Add master bootstrap and lookup endpoints from `MASTER-SESSION.md`.
- Reject second master creation with `409 Conflict`.
- Generate and refresh `master-context.md`.
- Implement “plan first, dispatch later” flow:
  1. collect peer session context
  2. run planning prompt in master tmux session
  3. parse/store plan
  4. expose approval state to UI
  5. dispatch approved items into target session queues
- Add live sessions overview feed / SSE for the master session grid.
- Prevent invalid dispatch targets:
  - no self-targeting master session
  - no missing session dispatch
- Stamp dispatched jobs with `masterBatchId` / `masterItemId`.

### 4. Desktop sidebar and session navigation

- Pin the master session at the top of the session list.
- Give it dedicated visual treatment:
  - control icon
  - accent tint
  - live active-session count badge
  - archive-only action, no delete action
- Keep chronological ordering for normal sessions underneath.
- Add command-palette support for:
  - focus/open master session
  - open master history
  - refresh master context

### 5. Master desktop workspace UI

- Add a dedicated master-session render path in `OrchestratorPane.tsx`.
- Build the wireframe layout:
  - **left:** live session grid with status, path, last activity
  - **right top:** delegation plan panel
  - **right middle:** live terminal
  - **right bottom:** prompt composer
- Plan items need:
  - target session
  - drafted prompt
  - confidence badge
  - expandable reasoning
  - approve / edit / skip controls
- Add top-level plan actions:
  - Approve All
  - Review Each
  - Cancel

### 6. Mobile master experience

- Collapse the master session grid into a horizontal chip rail above terminal/prompt.
- Present plan review as a bottom sheet before dispatch.
- Preserve the existing bottom-nav pattern.
- Ensure approval/edit/skip actions are thumb-friendly and keyboard-accessible.

### 7. Session detail / queue integration

- Show “dispatched from master” metadata on jobs created from master batches.
- Surface origin info in:
  - queue cards
  - job detail rows
  - session history
- Allow jumping from a target-session job back to its master batch/history entry.

### 8. Settings and automation

- Add master-session setting for **Auto-approve** threshold.
- Add settings control for refreshing master context.
- Keep existing standard-session settings intact.

### 9. Keyboard and accessibility

- Add shortcuts from the wireframe/spec:
  - `Ctrl+M` focus master
  - `Ctrl+Enter` submit master prompt
  - `A` approve focused item
  - `E` edit focused item
  - `S` skip focused item
  - `Shift+A` approve all
- Preserve current keyboard support for the rest of the UI.
- Add screen-reader labels for master badges, approval states, and history rollups.

### 10. Visual parity / polish gaps

- Replace emoji mobile-nav icons with the SVG icon set from `docs/ux-proposals/icons-03-mobile-ops.svg`.
- Add the wireframe’s master-specific iconography and badge styling.
- Align labels/copy with the wireframe:
  - “Master Session”
  - “Delegation Plan”
  - “Live Terminal”
  - “Delegation History”
- Review empty states for:
  - no peer sessions
  - no plan yet
  - no history
  - missing session targets

## Recommended Execution Plan

### Phase 1 - Contracts and persistence

1. Update shared Zod schemas and exported types for master roles and master batches.
2. Add store helpers for master-session lookup, batch persistence, and plan markdown writing.
3. Extend job/session persistence for master metadata.

### Phase 2 - Runtime support

1. Add master bootstrap/find/list endpoints.
2. Implement master context generation and refresh.
3. Implement planning lifecycle and batch approval/update endpoints.
4. Add dispatch logic that stamps target jobs with master metadata.
5. Add SSE/live overview for peer-session status.

### Phase 3 - Desktop UI

1. Add pinned master session entry in the sidebar.
2. Add master-session route/render branch in `OrchestratorPane.tsx`.
3. Build session grid, plan panel, terminal panel, and prompt composer.
4. Add plan item editing and bulk approval actions.
5. Add history drawer and command-palette actions.

### Phase 4 - Mobile UI

1. Convert master session grid to horizontal chips.
2. Implement plan-review bottom sheet.
3. Tune responsive states and safe-area behavior.
4. Replace emoji nav icons with SVG icons.

### Phase 5 - Integration polish

1. Show master-origin metadata in queue/session views.
2. Add auto-approve settings.
3. Add keyboard shortcuts and accessibility passes.
4. Update docs with the implemented behavior.

## Task Backlog

### Shared / store

- [x] Add master role to orchestrator session schemas and request types.
- [x] Add master batch schemas and exported TS types.
- [x] Extend job schema with `masterBatchId` / `masterItemId`.
- [x] Add store helpers for create/read/update/list master batches.
- [x] Add plan markdown writer for master batches.
- [x] Enforce single-master invariant in store/runtime creation flow.

### Runtime

- [x] Add `GET /api/orchestrator/master`.
- [x] Add `POST /api/orchestrator/master`.
- [ ] Add master batch list/read/update/dispatch endpoints.
- [ ] Add master sessions-overview endpoint/SSE.
- [x] Generate `master-context.md` and refresh it on demand.
- [ ] Persist planning state transitions: `planning -> awaiting-approval -> dispatched -> done/cancelled`.
- [ ] Reject invalid target sessions and second-master creation.

### Web UI

- [x] Add master session card pinned above standard sessions.
- [x] Add master-specific sidebar badge and icon treatment.
- [ ] Add master workspace layout in `OrchestratorPane.tsx`.
- [ ] Add editable delegation plan items with confidence + reasoning.
- [ ] Add Approve All / Review Each / Cancel actions.
- [ ] Add Delegation History drawer.
- [x] Add origin badges in queue/job cards.
- [ ] Add master command-palette actions.
- [ ] Add master keyboard shortcuts.
- [x] Replace mobile emoji nav icons with SVG icons.

### Tests

- [ ] Shared schema tests for new role/batch payloads.
- [x] Store tests for single-master enforcement and batch persistence.
- [ ] Runtime tests for bootstrap, approvals, dispatch, invalid targets, and history.
- [x] Web tests for pinned master card, review flow, mobile sheet, and origin badges.

## Acceptance Criteria for Completion

- A master session can be created once and is always pinned in the UI.
- Master planning persists to disk before any delegated work is dispatched.
- Users can review, edit, approve, skip, or bulk-approve plan items.
- Approved items dispatch into normal session queues with traceable metadata.
- Desktop and mobile both match the master-session wireframe behavior.
- Existing standard-session flows keep working unchanged.

## Suggested First PR Breakdown

1. **PR 1:** shared/store/runtime contracts for `role: "master"` and master batches.
2. **PR 2:** runtime APIs + persistence + dispatch metadata.
3. **PR 3:** sidebar + desktop master workspace UI.
4. **PR 4:** mobile master UX + icon parity.
5. **PR 5:** history drawer, shortcuts, accessibility, and final tests/docs.
