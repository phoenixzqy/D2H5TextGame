# BUG-217 — Growing application chunk exceeds offline precache limit

- Status: fixed locally in `99fda510`; broad PWA/performance acceptance open.
- Severity: High — warmed app shell cannot guarantee offline startup.
- Owner: root; independent PWA/performance acceptance remains open.
- Build: `f208b176` plus uncommitted Frenzy implementation, Node24/Vite5.4.21.
- Scope: production build, Workbox precache and actual offline restart.

## Reproduction

Build to task-owned output and inspect the emitted `assets/index-H1EZOBgY.js`:
it is 2,098,900 bytes, exceeding Workbox's unchanged 2,097,152-byte limit.
The build succeeds but explicitly warns that the application file will not
be precached. The generated worker contains 755 entries versus the prior
756, omitting this required entry. The generated art manifest's separate
size warning was already known; the missing application code is new.

Expected: the application and its required JavaScript/CSS chunks are actually
present in the worker precache, and a saved character can Continue offline
in a fresh page after warming the worker.

Root cause: the growing monolithic application chunk shares schema validation
vendor code. Split the existing Ajv dependencies into a separate vendor chunk;
preserve the existing cache-size limit. Guard the emitted application assets
against actual worker entries, then prove a real offline restart. This does
not establish the broader bundle/performance/Lighthouse gates.

First build log, hashes and generated worker are retained with Frenzy evidence.
No genuine campaign or remote action.

## Local verification

[Delivered evidence](../../docs/plans/evidence/d04-frenzy.md) retains RED/GREEN,
actual production checks and full15158/695/two-existing-skips PASS. Final types/
lint/build pass; four locale×viewport public cases/eight exact five-domain durable
pairs/four actual offline fresh-page Continues pass. Root author review only;
full-v1, independent review and earned balance remain open.
