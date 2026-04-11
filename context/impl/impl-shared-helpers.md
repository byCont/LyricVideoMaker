---
created: "2026-04-11T00:00:00Z"
last_edited: "2026-04-11T00:00:00Z"
---
# Implementation Tracking: shared-helpers

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-001 | DONE | transform.ts: TransformOptions, DEFAULT_TRANSFORM_OPTIONS, transformCategory. Commit ca8549c. |
| T-004 | DONE | timing.ts: TimingOptions, DEFAULT_TIMING_OPTIONS, timingCategory (collapsed). Commit ca8549c. |
| T-002 | PENDING | Exports finalized in T-001; category entry exposes all nine fields with off-canvas / oversized / negative-rotation ranges. Remaining acceptance: confirm exported category entry in barrel (T-006). |
| T-003 | PENDING | Runtime helper — pure function applying anchor/rotation/flip. Tier 1. |
| T-005 | PENDING | Category collapsed by default confirmed in T-004; category export waits on barrel (T-006). |
| T-006 | PENDING | Barrel export — Tier 2. |
| T-023 | PENDING | Timing runtime helper — Tier 2. |
