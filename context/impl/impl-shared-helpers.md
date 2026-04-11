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
| T-002 | DONE | Category entry surfaces all nine fields with off-canvas (-200..300), oversized (max 500), full rotation range (-360..360). Commit 14b4e10. |
| T-003 | DONE | computeTransformStyle in transform-runtime.ts — pure function, anchor translation first, rotation around visual center, flips via scale(). 24 tests. Commit 14b4e10. |
| T-005 | DONE | timingCategory has defaultExpanded: false. Covered by existing shared-timing test. |
| T-006 | PENDING | Barrel export — Tier 2. |
| T-023 | PENDING | Timing runtime helper — Tier 2. |
