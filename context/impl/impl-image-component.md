---
created: "2026-04-11T00:00:00Z"
last_edited: "2026-04-11T00:00:00Z"
---
# Implementation Tracking: image-component

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-034 | DONE | Minimal stub with TODO image field so T-040 test passes. No collision with background-image. Commit 8be7b50. |
| T-040 | DONE | Test verifies flattened options contain an image-type field that the existing preload loop iterates. No new asset-pipeline code added. Commit 8be7b50. |
| T-035 | PENDING | Full options contract (Source, Fit, Appearance, Effects, Filters, Transform, Timing). Tier 3. |
| T-036 | PENDING | Schema order. Tier 4. |
| T-037 | PENDING | Default renders nothing until path chosen. Tier 4. |
| T-038 | PENDING | Fit modes, filters, corner radius. Tier 4. |
| T-039 | PENDING | Border, shadow, glow, tint. Tier 4. |
| T-041 | PENDING | Per-frame opacity. Tier 4. |
