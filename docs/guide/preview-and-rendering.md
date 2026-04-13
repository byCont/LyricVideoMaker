# Preview & Rendering

## Frame Preview

The preview panel shows a single rendered frame of your video at the current timeline position. It activates once you have both an audio file and a subtitle file loaded (and FFmpeg configured).

### Navigating the Timeline

**Timeline scrubber** — The slider at the bottom of the preview panel lets you drag to any point in the video. The current timestamp and frame number appear in the top-right corner.

**Jump buttons** on the right side give you quick access to key positions:

| Button | Action |
|--------|--------|
| **Start** | Jump to the first frame (0:00) |
| **Previous Cue** | Jump to the previous subtitle's start time |
| **Current Cue** | Jump to the active subtitle's start time |
| **Next Cue** | Jump to the next subtitle's start time |
| **End** | Jump to the last frame |

::: tip
Use the cue jump buttons to quickly check how each lyric line looks. Step through your entire video cue-by-cue to spot any styling issues.
:::

### Preview States

The preview panel shows different messages depending on the current state:

- **"FFmpeg is not configured"** — Set up FFmpeg from the menu or the banner link.
- **"Pick audio and subtitle files"** — Load both files in the Project Setup panel.
- **"Preview paused while a full render is active"** — The preview pauses during rendering to free up resources.
- **"Rendering preview frame..."** — A frame is being generated.

## Render Settings

Configure render settings in the **Output / Render** and **Video** sections of the Project Setup panel.

### Video Dimensions

Choose a **Size preset** for common resolutions:

| Preset | Resolution |
|--------|-----------|
| 4K | 3840 x 2160 |
| 2K | 2560 x 1440 |
| 1080p | 1920 x 1080 |
| 720p | 1280 x 720 |
| 1024 Square | 1024 x 1024 |
| Custom | Enter any width and height (minimum 16px) |

### Frame Rate

Choose a **FPS preset** or set a custom value:

| Preset | FPS |
|--------|-----|
| 15 fps | 15 |
| 20 fps | 20 |
| 30 fps | 30 |
| 60 fps | 60 |
| Custom | Any value (minimum 1) |

### Encoding

Choose the output format:

| Encoding | Format | Codec |
|----------|--------|-------|
| x264 | MP4 | H.264 |
| x265 | MP4 | H.265 (HEVC) |
| WebM | WebM | VP9 video + Opus audio |

### Quality

Each encoding has three quality levels. Lower CRF values produce higher quality at larger file sizes.

**x264 (H.264):**
| Preset | CRF | Notes |
|--------|-----|-------|
| Smaller file | 28 | Faster encoding |
| Balanced | 23 | Good default |
| High quality | 18 | Slower encoding |

**x265 (H.265):**
| Preset | CRF | Notes |
|--------|-----|-------|
| Smaller file | 32 | Faster encoding |
| Balanced | 28 | Good default |
| High quality | 23 | Slower encoding |

**WebM (VP9):**
| Preset | CRF | Notes |
|--------|-----|-------|
| Smaller file | 38 | Faster encoding |
| Balanced | 32 | Good default |
| High quality | 28 | Slower encoding |

### Render Threads

Controls how many Chromium workers render frames in parallel. More threads = faster rendering, but more memory usage. Start with the default and increase if you have RAM to spare.

## Rendering a Video

1. Configure your files, scene, and settings.
2. Click **Render MP4** (or **Render WebM**) at the bottom of the Project Setup panel.
3. A progress dialog appears showing:
   - Current rendering phase (preparing, rendering, muxing)
   - Progress bar and percentage
   - Current FPS and ETA
4. Click **Cancel Render** at any time to abort.
5. When complete, your video is saved to the output path you chose.

### Render Phases

| Phase | What happens |
|-------|-------------|
| **Preparing** | Audio analysis and component pre-computation |
| **Rendering** | Each frame is rendered by Chromium workers |
| **Muxing** | Frames and audio are combined into the final video file |

::: warning
The preview panel pauses during a full render. It resumes automatically when the render completes or is cancelled.
:::
