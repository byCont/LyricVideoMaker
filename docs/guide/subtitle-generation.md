# Subtitle Generation

Lyric Video Maker includes built-in AI-powered subtitle generation. It uses [Whisper](https://github.com/openai/whisper) to either transcribe audio from scratch or align existing lyrics to the music.

## Opening the Generator

In the Project Setup panel, next to the subtitle file picker, click **Generate SRT**. This opens the subtitle generation dialog.

::: info
You must have an audio file loaded before generating subtitles.
:::

## Generation Modes

### Full Transcription

Transcribes the audio directly — no lyrics needed. The AI listens to the song and generates timed subtitle lines.

Best for when you don't have the lyrics written down, or for speech/narration.

### Alignment

Aligns a provided lyrics text file against the audio. You supply a plain text file (`.txt`) with one lyric line per non-empty line, and the AI matches each line to the correct timing in the song.

Best for when you already have accurate lyrics and just need the timing.

## Language Selection

Choose the language of the audio to improve accuracy:

- English
- Spanish
- French
- German
- Italian
- Portuguese
- Japanese
- Korean

In **Full Transcription** mode, an additional **Auto Detect** option is available that lets the AI identify the language automatically.

## Generating Subtitles

1. Choose your **mode** (Full Transcription or Alignment).
2. If using Alignment mode, click **Pick TXT** to select your lyrics text file.
3. Select the **language** of the audio.
4. Click **Generate SRT**.

A progress bar shows the generation status. You can click **Cancel Generation** at any time.

When generation completes, the SRT file is automatically loaded into your project. The output file path is shown in the status message.

## Tips

- **Alignment mode is more accurate** when you have correct lyrics. It produces better timing than full transcription.
- **One line per lyric** in your text file. Each non-empty line becomes a subtitle cue.
- If results aren't perfect, you can edit the generated `.srt` file in any text editor and reload it.
