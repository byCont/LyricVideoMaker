# Getting Started

This guide walks you through installing Lyric Video Maker and creating your first lyric video.

## Download & Install

1. Go to the [Releases page](https://github.com/mrkmg/LyricVideoMaker/releases) on GitHub.
2. Download the installer for your platform (Windows).
3. Run the installer and follow the prompts.

## FFmpeg Setup

Lyric Video Maker uses [FFmpeg](https://ffmpeg.org/) to render and preview video frames. On first launch, if FFmpeg isn't found on your system, you'll be prompted to set it up.

You have several options:

- **Install via winget** — Runs `winget install --id=Gyan.FFmpeg` automatically (recommended on Windows).
- **Locate ffmpeg.exe** — Browse to an existing FFmpeg installation on your machine.
- **Open download page** — Opens the FFmpeg website so you can download it manually.
- **Continue without FFmpeg** — Use the app without preview or rendering (you can set up FFmpeg later from the menu).

The app searches common install locations automatically, including winget, Scoop, Chocolatey, and Program Files paths.

::: tip
If you skip FFmpeg setup, a banner at the top of the workspace will remind you. Click **Set up FFmpeg** at any time to configure it.
:::

## Prepare Your Files

To create a lyric video you need:

- **An audio file** — MP3 format.
- **A subtitle file** — SRT format with timed lyrics. Don't have one? Lyric Video Maker can [generate subtitles](/guide/subtitle-generation) from your audio using AI.

## Your First Video

### 1. Pick your audio

In the **Project Setup** panel on the left, click **Pick MP3** and select your song.

### 2. Add subtitles

Click **Pick SRT** and select your subtitle file. If you don't have one yet, click **Generate SRT** to create one from your audio — see the [Subtitle Generation](/guide/subtitle-generation) guide for details.

### 3. Choose an output location

Click **Save As** to choose where to save the rendered video. The default filename is `lyric-video.mp4`.

### 4. Preview your video

Once audio and subtitles are loaded, the **Frame Preview** panel comes alive. Use the timeline scrubber to move through the video and see how it looks. Use the jump buttons on the right to hop between subtitle cues.

### 5. Customize the look

The default scene ("Single Image Lyrics") includes a background image, an optional color wash, and lyrics. Click any component in the **Scene Builder** panel to customize it — change colors, fonts, sizes, and positioning in the options panel below.

See [Scenes & Components](/guide/scenes-and-components) for a full guide on customizing your video.

### 6. Render

When you're happy with the preview, click the **Render MP4** button at the bottom of the Project Setup panel. A progress dialog shows rendering status, FPS, and ETA. When it's done, your lyric video is ready to share.

## Next Steps

- [The Workspace](/guide/workspace) — Learn what each panel does
- [Scenes & Components](/guide/scenes-and-components) — Understand the component layer system
- [Preview & Rendering](/guide/preview-and-rendering) — Master the preview controls and render settings
- [Subtitle Generation](/guide/subtitle-generation) — Create SRT files from audio with AI
- [Plugins](/guide/plugins) — Extend the app with community plugins
