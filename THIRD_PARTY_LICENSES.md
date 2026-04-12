# Third-Party Licenses

Lyric Video Maker bundles or redistributes the following third-party
software components. The main Lyric Video Maker application is
proprietary and governed by `EULA.txt`. Each component listed below
remains governed by its own license, which controls over the EULA to
the extent of any conflict for that component.

This document is informational. The authoritative license texts live
in the files referenced below and inside the installed application
bundle (e.g. `LICENSES.chromium.html`, `LICENSES.chromium-headless.html`
inside the bundled headless Chromium, and each Python package's
`*.dist-info/LICENSE` file inside the frozen subtitle sidecar).

---

## Summary by license family

| Family        | Components                                                                                      |
|---------------|--------------------------------------------------------------------------------------------------|
| **LGPL**      | Electron's internal ffmpeg.dll                                                                  |
| **BSD-3**     | Chromium, PyTorch, NumPy, LLVM / llvmlite, SymPy, mpmath, NetworkX, fsspec, torchaudio, colorama |
| **BSD-2**     | Numba, OpenH264, libwebp                                                                        |
| **Apache-2.0**| @puppeteer/browsers, Microsoft TypeScript runtime, regex, urllib3, Requests                     |
| **MIT**       | Electron, React, React DOM, chrome-remote-interface, OpenAI Whisper, stable-ts, tiktoken, Jinja2, MarkupSafe, tqdm, idna, ms, debug, and most npm dependencies |
| **MPL-2.0**   | certifi (Mozilla CA bundle), tqdm (dual MIT/MPL)                                                |
| **PSF-2.0**   | CPython standard library, typing_extensions                                                     |
| **Unlicense / Public Domain** | filelock                                                                            |
| **Proprietary redistribution** | Intel OpenMP runtime (libiomp5md.dll) bundled inside torch                         |

---

## Components in detail

### 1. Runtime dependency on user-installed FFmpeg

Lyric Video Maker does not bundle, install, or distribute FFmpeg.
FFmpeg is a separate program, obtained by the end user from
<https://ffmpeg.org/> or a package manager (winget, scoop, chocolatey,
homebrew). On first launch, Lyric Video Maker probes well-known
install locations and the system `PATH`; if FFmpeg is missing, the
application offers an in-app helper that can install it via the
Windows Package Manager or accept a user-supplied executable path.

At render and preview time, Lyric Video Maker invokes the user's
existing FFmpeg installation as a separate operating system process
via `child_process.spawn`, passing arguments on the command line and
communicating only over standard input, output, and error pipes.
Because no copy of FFmpeg is conveyed as part of this software, the
FFmpeg project's GNU GPL / LGPL does not attach any obligations to
Lyric Video Maker itself. FFmpeg and its dependencies remain governed
by their own upstream licenses, which the end user accepts when
installing FFmpeg through their chosen channel.

---

### 2. Electron (MIT) and Chromium (BSD-3-Clause + many)

**What we ship.** Electron 35.x provides the `LyricVideoMaker.exe`
runtime together with Chromium's rendering libraries, V8, Node.js,
and all the DLL files at the root of the installed directory
(`chrome_100_percent.pak`, `icudtl.dat`, `libEGL.dll`, `libGLESv2.dll`,
`vulkan-1.dll`, `vk_swiftshader.dll`, `d3dcompiler_47.dll`,
`ffmpeg.dll`, and so on).

**Electron license.** MIT License. Full text included in the
application bundle as `LICENSE`.

**Chromium license.** Chromium is distributed under a permissive
BSD-3-Clause license together with a very large collection of
third-party notices covering every upstream library that Chromium
links against. These are included verbatim in the application bundle
as `LICENSES.chromium.html`. That file must be preserved.

**Electron internal `ffmpeg.dll`.** Electron's internal build of
FFmpeg (bundled as `ffmpeg.dll` next to `LyricVideoMaker.exe`) is an
LGPL-licensed build with proprietary codec support stripped out. It
is used only by Chromium's `<video>` and `<audio>` elements inside
the renderer process and is unrelated to the user-installed
`ffmpeg.exe` that Lyric Video Maker invokes for rendering.

---

### 3. Headless renderer toolchain (@puppeteer/browsers, chrome-remote-interface, bundled Chromium)

**@puppeteer/browsers.** Apache License 2.0. Used at build time to
download a pinned Chromium revision into the application's bundled
browser cache. The package's `LICENSE` file is preserved inside
`resources/app/node_modules/@puppeteer/browsers/`.

**chrome-remote-interface.** MIT License. Copyright (c) 2025 Andrea
Cardaci. Used at runtime to drive the bundled Chromium over the
Chrome DevTools Protocol. The package's `LICENSE` file is preserved
inside `resources/app/node_modules/chrome-remote-interface/`.

**Bundled Chromium build.** A second Chromium build (separate from the
Electron runtime) is downloaded by `@puppeteer/browsers` and shipped
inside the application as
`resources/app/.chromium-cache/chromium/<platform>-<buildId>/`. This is
an upstream open-source Chromium build covered by the same
BSD-3-Clause license and third-party notices described in section 2
above. The `LICENSES.chromium-headless.html` file (and any other
license files) shipped inside the bundled directory must be preserved.

---

### 4. React and React DOM

- **React** — MIT License. Facebook, Inc. and contributors.
- **React DOM** — MIT License. Facebook, Inc. and contributors.

Source: <https://github.com/facebook/react>.

---

### 5. Other npm dependencies bundled inside `resources/app/node_modules/`

These packages are included as transitive dependencies of
@puppeteer/browsers, chrome-remote-interface, React, and
(historically) ffmpeg-static. They are all permissively licensed:

| Package | License |
|---|---|
| `@chenglou/pretext` | MIT |
| `@derhuerst/http-basic` | ISC |
| `agent-base`, `https-proxy-agent` | MIT |
| `buffer-from`, `concat-stream`, `inherits` | MIT / BSD |
| `caseless`, `parse-cache-control`, `progress` | MIT |
| `debug`, `ms` | MIT |
| `env-paths` | MIT |
| `http-response-object` | MIT |
| `js-tokens`, `loose-envify` | MIT |
| `readable-stream`, `safe-buffer`, `string_decoder`, `typedarray`, `util-deprecate` | MIT |
| `scheduler` | MIT |

Each package's `LICENSE` file is preserved inside its npm package
directory. Lyric Video Maker does not modify any of these packages.

---

### 6. Python runtime (PSF License)

The subtitle generator is shipped as a PyInstaller-frozen standalone
executable. PyInstaller bundles a copy of the CPython interpreter
together with the Python standard library. Python is distributed
under the Python Software Foundation License (PSF-2.0), a BSD-style
permissive license that explicitly permits redistribution as part of
a larger work. The PSF License text is available at
<https://docs.python.org/3/license.html>.

---

### 7. PyTorch, torchaudio, and related PyTorch Foundation projects

- **PyTorch (`torch`)** — BSD 3-Clause "New" or "Revised" License.
  Copyright (c) 2016 - present Facebook, Inc. and PyTorch contributors.
  Bundled as shared libraries (`torch.dll`, `torch_cpu.dll`,
  `torch_python.dll`, `c10.dll`, and friends) inside the frozen
  sidecar under
  `resources/app/sidecars/subtitle-aligner/bin/lyric-video-subtitle-aligner/`.
- **torchaudio** — BSD 2-Clause License. Copyright (c) 2018-present
  Facebook, Inc. and torchaudio contributors.

The `torch/LICENSE` and `torch/NOTICE` files bundled inside the
PyInstaller output contain the full copyright statements for PyTorch
and all of its own third-party dependencies (Caffe2, XNNPACK,
cpuinfo, pthreadpool, FBGEMM, sleef, fmt, libuv, and many more).
These NOTICE files must be preserved.

---

### 8. Intel OpenMP Runtime (`libiomp5md.dll`)

PyTorch's CPU build ships a copy of Intel's OpenMP runtime as
`torch/lib/libiomp5md.dll` and `libiompstubs5md.dll`. These files are
redistributable under Intel's runtime distribution license, which
permits bundling with end-user applications. The applicable notice is
included in PyTorch's NOTICE file alongside PyTorch's own license.

---

### 9. OpenAI Whisper and `stable-ts`

- **`openai-whisper`** — MIT License. Copyright (c) 2022 OpenAI. The
  license file is preserved inside
  `openai_whisper-*.dist-info/licenses/LICENSE` within the frozen
  sidecar.
- **`stable-ts`** — MIT License. Copyright (c) Jianfu Zhang and
  contributors. License file preserved inside
  `stable_ts-*.dist-info/licenses/LICENSE`.

**Model weights.** OpenAI Whisper downloads its speech recognition
model weights (e.g. `base.pt`, `small.pt`) from an OpenAI-hosted CDN
the first time a model is requested. The weights are licensed under
the MIT License and the Whisper model card; we do not bundle the
weights inside the application.

---

### 10. Scientific Python stack

| Package | License | Copyright holder |
|---|---|---|
| `numpy` | BSD 3-Clause | NumPy Developers |
| `numba` | BSD 2-Clause | Anaconda, Inc. |
| `llvmlite` | BSD 3-Clause + LLVM Exception | Anaconda, Inc. |
| `sympy` | BSD 3-Clause | SymPy Development Team |
| `mpmath` | BSD 3-Clause | Fredrik Johansson and contributors |
| `networkx` | BSD 3-Clause | NetworkX Developers |
| `fsspec` | BSD 3-Clause | Anaconda, Inc. |
| `filelock` | The Unlicense (public domain) | Benedikt Schmitt |
| `tiktoken` | MIT | OpenAI |
| `regex` | Apache-2.0 | Matthew Barnett |
| `tqdm` | MIT / MPL-2.0 (dual) | tqdm developers |
| `more-itertools` | MIT | Erik Rose and contributors |
| `typing_extensions` | PSF-2.0 | Python Software Foundation |

Each package's `*.dist-info/LICENSE` (or `licenses/` directory) is
preserved inside the frozen sidecar. No modifications are made to
these packages; they are installed unmodified via pip and captured
by PyInstaller.

---

### 11. HTTP client stack

| Package | License | Copyright holder |
|---|---|---|
| `requests` | Apache-2.0 | Kenneth Reitz and contributors |
| `urllib3` | MIT | Andrey Petrov and contributors |
| `charset-normalizer` | MIT | Ahmed TAHRI |
| `idna` | BSD 3-Clause | Kim Davies, Internet Assigned Numbers Authority |
| `certifi` | MPL-2.0 | Kenneth Reitz |

`certifi` embeds a copy of the Mozilla CA certificate bundle under
the terms of the Mozilla Public License 2.0. We redistribute the
bundle unmodified. Users who wish to substitute their own CA bundle
may do so by replacing `certifi/cacert.pem` inside the frozen
sidecar.

---

### 12. Template and text helpers

- **Jinja2** — BSD 3-Clause. Copyright (c) Armin Ronacher and Jinja2
  contributors.
- **MarkupSafe** — BSD 3-Clause. Copyright (c) Armin Ronacher.
- **colorama** — BSD 3-Clause. Copyright (c) Jonathan Hartley.

---

### 13. Google Fonts (runtime, not bundled)

The Lyric Video Maker renderer fetches font files at render time
from the Google Fonts CDN (`https://fonts.googleapis.com/css2` and
its associated `fonts.gstatic.com` origin). These fonts are not
bundled with the installer. Each font is licensed by its individual
upstream author, typically under the SIL Open Font License 1.1 or a
permissive license identified on the font's Google Fonts page. Users
who render without internet access will see font loading failures;
substitute fonts can be provided by the end user at runtime.

---

## Preservation requirements

When redistributing Lyric Video Maker, the following files must be
preserved inside the distribution so that recipients can read the
original license notices:

- `EULA.txt` at the root of the installed application directory.
- `THIRD_PARTY_LICENSES.md` at the root of the installed application
  directory (this document).
- `LICENSE` and `LICENSES.chromium.html` at the root of the installed
  application directory (Electron + Chromium).
- All `LICENSE`, `NOTICE`, and `ThirdPartyNotices.txt` files under
  `resources/app/node_modules/@puppeteer/browsers/` and
  `resources/app/node_modules/chrome-remote-interface/`.
- Chromium license files distributed inside
  `resources/app/.chromium-cache/chromium/<platform>-<buildId>/`
  (e.g. `LICENSES.chromium-headless.html`).
- Every `*.dist-info/LICENSE` (and `licenses/` subdirectory) found
  inside the frozen subtitle sidecar at
  `resources/app/sidecars/subtitle-aligner/bin/lyric-video-subtitle-aligner/`.
