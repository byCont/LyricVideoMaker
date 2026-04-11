# -*- mode: python ; coding: utf-8 -*-
#
# PyInstaller spec file for the Lyric Video Maker subtitle aligner sidecar.
#
# The frozen output is built into dist-frozen/lyric-video-subtitle-aligner/
# (overridden via command line flags) and contains lyric-video-subtitle-aligner.exe
# plus all of its runtime dependencies, so the end user does not need
# Python installed to generate subtitles.
#
# Notes on package selection:
#   - stable_whisper and whisper pull in torch, numba, llvmlite, regex,
#     tiktoken, tqdm, and friends. We use collect_all for each package
#     that ships compiled extensions or data files, so that every
#     submodule, DLL, and runtime asset gets pulled into the bundle.
#   - torch is the heaviest of the bunch and is known to need
#     collect_all to catch its dynamically-loaded kernels.
#   - We exclude developer-only packages (pip, setuptools, distutils,
#     tkinter) to reduce the frozen bundle size.

from PyInstaller.utils.hooks import collect_all

datas: list = []
binaries: list = []
hiddenimports: list = []

_collect_targets = (
    "stable_whisper",
    "whisper",
    "torch",
    "torchaudio",
    "numpy",
    "numba",
    "llvmlite",
    "tiktoken",
    "tiktoken_ext",
    "regex",
    "tqdm",
    "more_itertools",
    "jinja2",
    "sympy",
    "networkx",
    "filelock",
    "fsspec",
    "requests",
    "urllib3",
    "charset_normalizer",
    "idna",
    "certifi",
    "typing_extensions",
)

for _pkg in _collect_targets:
    _datas, _binaries, _hiddenimports = collect_all(_pkg)
    datas += _datas
    binaries += _binaries
    hiddenimports += _hiddenimports

a = Analysis(
    ["src/lyric_video_subtitle_aligner/cli.py"],
    pathex=["src"],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        "tkinter",
        "pip",
        "_distutils_hack",
        "distutils",
        "setuptools",
        "pkg_resources",
        "IPython",
        "matplotlib",
        "pandas",
        "pytest",
    ],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="lyric-video-subtitle-aligner",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name="lyric-video-subtitle-aligner",
)
