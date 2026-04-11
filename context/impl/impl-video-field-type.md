---
created: "2026-04-11T00:00:00Z"
last_edited: "2026-04-11T00:00:00Z"
---
# Implementation Tracking: video-field-type

Build site: context/plans/build-site.md

| Task | Status | Notes |
|------|--------|-------|
| T-007 | DONE | Added `video` variant to SceneOptionField union in packages/core/src/types/scene-options.ts. Commit a05c0c6. |
| T-009 | DONE | Extended getMimeType with mp4/webm/mov/mkv; image behavior preserved. Commit a05c0c6. |
| T-013 | DONE | Added `video` to FilePickKind and getFileFilters (mp4/webm/mov/mkv). Commit a05c0c6. |
| T-008 | DONE | Added "video" branch to validateField; extracted validateFileField shared helper used by both image and video. Test added. Commit 897972d. |
| T-010 | DONE | createCachedAssetBody + loadCachedAssetBody now accept kind parameter. Video path reads bytes directly + content-type from MIME. Image path unchanged. Cache-key format stable. 5 tests. Commit 897972d. |
| T-011 | PENDING | Preload loop includes video. Tier 2. |
| T-012 | PENDING | Asset route content-type + conditional range. Tier 3. |
| T-014 | DONE | OptionField and ComponentDetailsEditor now use onPickFile(fieldId, kind) unified callback. Image call sites pass "image" kind. No image-specific callback remains. Commit 897972d. |
| T-015 | PENDING | Editor field dispatch video pill. Tier 2. |
| T-016 | PENDING | End-to-end verification with throwaway component. Tier 4. |
