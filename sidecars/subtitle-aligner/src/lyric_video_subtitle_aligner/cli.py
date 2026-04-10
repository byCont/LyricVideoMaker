from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

import stable_whisper


EventType = Literal["progress", "error", "result"]


@dataclass(frozen=True)
class Request:
    mode: Literal["transcribe", "align"]
    audio_path: Path
    output_path: Path
    language: str | None
    lyrics_text_path: Path | None
    model_name: str
    device: str


def emit(event_type: EventType, **payload: Any) -> None:
    message = {"type": event_type, **payload}
    print(f"LVM_EVENT\t{json.dumps(message, ensure_ascii=True)}", flush=True)


def parse_args() -> Request:
    parser = argparse.ArgumentParser()
    parser.add_argument("--request-json", required=True)
    raw = json.loads(parser.parse_args().request_json)

    mode = raw.get("mode")
    if mode not in {"transcribe", "align"}:
        raise ValueError('mode must be "transcribe" or "align".')

    audio_path = Path(str(raw.get("audioPath", ""))).expanduser().resolve()
    output_path = Path(str(raw.get("outputPath", ""))).expanduser().resolve()
    language = raw.get("language")
    normalized_language = None if language in (None, "", "auto") else str(language)

    lyrics_text = raw.get("lyricsTextPath")
    lyrics_text_path = None if lyrics_text in (None, "") else Path(str(lyrics_text)).expanduser().resolve()
    if mode == "align" and lyrics_text_path is None:
        raise ValueError("lyricsTextPath is required for alignment.")

    model_name = str(raw.get("modelName") or "base")
    requested_device = raw.get("device")
    device = detect_device() if requested_device in (None, "", "auto") else str(requested_device)

    return Request(
        mode=mode,
        audio_path=audio_path,
        output_path=output_path,
        language=normalized_language,
        lyrics_text_path=lyrics_text_path,
        model_name=model_name,
        device=device,
    )


def detect_device() -> str:
    try:
        import torch

        if torch.cuda.is_available():
            return "cuda"
    except Exception:
        pass

    return "cpu"


def validate_request(request: Request) -> None:
    if not request.audio_path.is_file():
        raise FileNotFoundError(f'Audio file not found: "{request.audio_path}"')

    if request.mode == "align":
        assert request.lyrics_text_path is not None
        if not request.lyrics_text_path.is_file():
            raise FileNotFoundError(f'Lyrics text file not found: "{request.lyrics_text_path}"')
        if request.language is None:
            raise ValueError("Alignment requires a language.")

    request.output_path.parent.mkdir(parents=True, exist_ok=True)


def read_lyrics_text(path: Path) -> str:
    content = path.read_text(encoding="utf-8")
    normalized = content.replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.strip() for line in normalized.split("\n")]
    non_empty_lines = [line for line in lines if line]
    if not non_empty_lines:
        raise ValueError("Lyrics text file is empty.")

    # stable-ts uses line breaks to split plain text during alignment when original_split=True.
    return "\n".join(non_empty_lines)


def run(request: Request) -> Path:
    validate_request(request)

    emit("progress", stage="loading-model", progress=10, message=f'Loading Whisper model "{request.model_name}"')
    model = stable_whisper.load_model(request.model_name, device=request.device)

    if request.mode == "transcribe":
        emit("progress", stage="transcribing", progress=45, message="Transcribing audio")
        result = model.transcribe(
            str(request.audio_path),
            language=request.language,
            verbose=None,
        )
    else:
        emit("progress", stage="reading-lyrics", progress=20, message="Reading lyrics text")
        assert request.lyrics_text_path is not None
        lyrics_text = read_lyrics_text(request.lyrics_text_path)
        emit("progress", stage="aligning", progress=55, message="Aligning lyrics to audio")
        result = model.align(
            str(request.audio_path),
            lyrics_text,
            language=request.language,
            original_split=True,
            verbose=None,
        )

    emit("progress", stage="writing-srt", progress=90, message="Writing SRT output")
    result.to_srt_vtt(str(request.output_path), word_level=False)
    return request.output_path


def main() -> int:
    try:
        request = parse_args()
        output_path = run(request)
        emit(
            "result",
            outputPath=str(output_path),
            mode=request.mode,
            language=request.language or "auto",
            device=request.device,
            modelName=request.model_name,
        )
        return 0
    except Exception as exc:
        emit("error", message=str(exc), errorType=type(exc).__name__)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
