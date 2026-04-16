# Scenes & Components

Lyric Video Maker builds videos from **scenes** composed of **components**. Understanding how these work is key to creating the video you want.

## What is a Scene?

A scene is a saved arrangement of components — a reusable template for your video's visual layout. For example, the built-in "Single Image Lyrics" scene includes a background image, an optional color overlay, and lyrics display.

Scenes can come from three sources:

- **Built-in** — Ship with the app.
- **User** — Scenes you've saved yourself.
- **Plugin** — Added by installed plugins.

You can select a scene from the dropdown in the Scene Editor (click the **Scene** button at the top of the Scene Builder panel). When you pick a different scene and the current scene already has components, a dialog asks how to apply it:

- **Replace** — Swap the entire scene, removing all current components.
- **Add to Existing** — Keep the current scene and append the new scene's components to the stack.

If the current scene has no components the new scene is loaded directly without prompting.

## What is a Component?

A component is a single visual layer in your video. Components stack on top of each other — the first component in the list draws at the back, the last draws in front.

Each component has its own set of configurable options that control how it looks — colors, fonts, sizes, audio response, filters, and so on. Click a component in the Scene Builder to view and edit its options in the panel below.

Position, timing, opacity, and visibility are not part of a component's own options. They are controlled by **modifiers** — a shared, stackable set of wrappers that can be added to any component. See [Modifiers](#modifiers) below.

## Built-in Components

### Background Color

Fills the frame with a solid color or gradient. Useful for darkening a background image so lyrics are more readable.

**Options:**
| Option | Default | Description |
|--------|---------|-------------|
| Mode | Gradient | Solid or Gradient fill |
| Color | `#09090f` | Fill color (solid mode) |
| Opacity | 60% | Fill transparency (solid mode) |
| Direction | Top to Bottom | Gradient angle (8 directions) |
| Start Color | `#09090f` | Gradient start color |
| Start Opacity | 60% | Gradient start transparency |
| End Color | `#09090f` | Gradient end color |
| End Opacity | 60% | Gradient end transparency |

Available gradient directions: Top to Bottom, Bottom to Top, Left to Right, Right to Left, and all four diagonal combinations.

### Lyrics by Line

The main lyric display component. Shows each subtitle cue one at a time with configurable styling and animations.

**Lyrics options:**
| Option | Default | Description |
|--------|---------|-------------|
| Lyric Size | 72px | Font size (24–180) |
| Force Single Line | Off | Prevent line wrapping |
| Horizontal Padding | 140 | Left/right padding |
| Lyric Font | Roboto | Google Fonts font family |
| Lyric Color | White | Text color |
| Lyric Position | Bottom | Vertical placement (Top / Middle / Bottom) |

**Fade In / Fade Out** (collapsible):
| Option | Default | Description |
|--------|---------|-------------|
| Fade Time | 180ms | Duration of the fade (0–5000ms) |
| Easing | Ease Out / Ease In | Animation curve |

**Border** (collapsible):
| Option | Default | Description |
|--------|---------|-------------|
| Enable Border | Off | Toggle text border |
| Border Color | Black | Border color |
| Border Thickness | 4 | Border width (0–20) |

**Shadow** (collapsible):
| Option | Default | Description |
|--------|---------|-------------|
| Enable Shadow | On | Toggle text shadow |
| Shadow Color | Black | Shadow color |
| Shadow Intensity | 55% | Shadow strength |

### Equalizer

An audio-reactive visualizer that responds to your music in real time. Supports bar and line graph modes.

**Layout:**
| Option | Default | Description |
|--------|---------|-------------|
| Bar Orientation | Horizontal | Direction of the bars |
| Inner Padding | 24 | Padding inside the component |

**Graph:**
| Option | Default | Description |
|--------|---------|-------------|
| Graph Mode | Bars | Bars or Line rendering |
| Line Style | Stroke | Stroke or filled Area (line mode) |
| Line Baseline | Bottom | Where lines anchor from |

**Bars:**
| Option | Default | Description |
|--------|---------|-------------|
| Bar Count | 28 | Number of bars (4–128) |
| Bar Gap | 6 | Space between bars |
| Corner Radius | 999 | Bar corner rounding |
| Min / Max Bar Scale | 12% / 100% | Height range |
| Layout Mode | Mirrored | Single, Mirrored, or Split |
| Growth Direction | Outward | Where bars grow from |

**Audio Response** (collapsible):
| Option | Default | Description |
|--------|---------|-------------|
| Min / Max Frequency | 40 / 3200 Hz | Frequency range to visualize |
| Analysis FPS | 48 | Audio sample rate |
| Sensitivity | 1.4 | Response strength (0.1–4.0) |
| Smoothing | 35% | Frame-to-frame smoothing |
| Attack / Release | 35 / 240ms | Response and decay speed |
| Band Distribution | Log | Linear or logarithmic |

**Colors** (collapsible):
| Option | Default | Description |
|--------|---------|-------------|
| Color Mode | Gradient | Solid, Gradient, or Intensity |
| Primary Color | `#7DE2FF` | Main bar color |
| Secondary Color | `#00A8E8` | Gradient end color |
| Opacity | 85% | Overall transparency |

**Effects** (collapsible):
| Option | Default | Description |
|--------|---------|-------------|
| Enable Glow | On | Glow effect around bars |
| Glow Color | `#7DE2FF` | Glow color |
| Cap Style | Rounded | Square or Rounded bar caps |

### Static Text

Fixed text that stays on screen for the duration (or a timed portion) of the video. Useful for song titles, artist credits, or watermarks.

**Content:**
| Option | Default | Description |
|--------|---------|-------------|
| Text | "Static Text" | The text to display |
| Case | As Typed | Uppercase, lowercase, or Title Case |
| Enable Tokens | Off | Use dynamic text tokens |

**Typography:**
| Option | Default | Description |
|--------|---------|-------------|
| Font Family | Roboto | Google Fonts font |
| Font Size | 72px | Size (8–400) |
| Font Weight | 600 | Boldness (100–900) |
| Letter Spacing | 0 | Character spacing |
| Line Height | 1.15 | Line spacing multiplier |
| Align | Center | Text alignment |

**Color:**
| Option | Default | Description |
|--------|---------|-------------|
| Color | White | Text color |
| Color Mode | Solid | Solid or Gradient fill |

**Box:**
| Option | Default | Description |
|--------|---------|-------------|
| Backdrop Enabled | Off | Background box behind text |
| Backdrop Color | Black | Box color |
| Backdrop Opacity | 60% | Box transparency |
| Backdrop Radius | 12 | Corner rounding |

### Shape

Geometric primitives with fill, stroke, and effects. Useful for decorative elements, dividers, or frames.

**Geometry:**
| Option | Default | Description |
|--------|---------|-------------|
| Shape | Rectangle | Rectangle, Circle, Ellipse, Triangle, Line, or Regular Polygon |
| Polygon Sides | 6 | Sides (3–12) for polygon mode |
| Corner Radius | 0 | Corner rounding (0–200) |

**Fill:**
| Option | Default | Description |
|--------|---------|-------------|
| Fill Enabled | On | Toggle fill |
| Fill Mode | Solid | Solid or Gradient |
| Fill Color | `#4da3ff` | Fill color |
| Fill Opacity | 100% | Fill transparency |

**Stroke:**
| Option | Default | Description |
|--------|---------|-------------|
| Stroke Enabled | Off | Toggle outline |
| Stroke Color | White | Outline color |
| Stroke Width | 2 | Outline thickness |

### Image

A static or positioned image layer. Use it for logos, overlays, or decorative elements.

**Source:**
| Option | Description |
|--------|-------------|
| Image Source | Pick an image (PNG, JPG, WebP) |

**Fit:**
| Option | Default | Description |
|--------|---------|-------------|
| Fit Mode | Contain | Contain, Cover, Fill, or None |
| Preserve Aspect Ratio | On | Maintain proportions |

**Appearance:**
| Option | Default | Description |
|--------|---------|-------------|
| Corner Radius | 0 | Corner rounding |

**Effects** include border, tint, shadow, glow, and image filters (grayscale, blur, brightness, contrast, saturation).

To fade the image in/out or change its overall transparency, add the **Timing** or **Opacity** modifier (see [Modifiers](#modifiers)).

### Video

An embedded video clip layer. Use it for animated backgrounds, overlays, or picture-in-picture.

**Source:**
| Option | Default | Description |
|--------|---------|-------------|
| Video Source | — | Pick a video file (MP4, WebM, MOV, MKV) |
| Muted | On | Mute the video's audio |

**Playback:**
| Option | Default | Description |
|--------|---------|-------------|
| Playback Mode | Sync with Song | Sync, Loop, Play Once (Clamp), or Play Once (Hide) |
| Video Start Offset | 0ms | Skip into the video |
| Playback Speed | 1.0x | Speed multiplier (0.1–8.0) |

**Fit:**
| Option | Default | Description |
|--------|---------|-------------|
| Fit Mode | Contain | Contain, Cover, or Fill |
| Corner Radius | 0 | Corner rounding |

**Appearance** and **Effects** are similar to the Image component — opacity, tint, filters, border, shadow, and glow.

### Slideshow

An animated slideshow that cycles through multiple images with transitions, timing modes, and an optional Ken Burns (zoom/pan) effect.

**Source:**
| Option | Description |
|--------|-------------|
| Images | Pick multiple image files (PNG, JPG, WebP) |

**Slide Timing:**
| Option | Default | Description |
|--------|---------|-------------|
| Timing Mode | Fixed Duration | Fixed Duration or Align to Lyrics |
| Slide Duration | 5000ms | Time per slide (500–60000ms) |
| Transition Duration | 1000ms | Transition length (0–10000ms) |
| Initial Delay | 0ms | Delay before first slide (0–30000ms) |

**Behavior:**
| Option | Default | Description |
|--------|---------|-------------|
| Slide Order | Sequential | Sequential, Shuffle, or Random |
| Repeat Mode | Loop | Loop, Single Pass, or Hold Last |
| Random Seed | 0 | Seed for shuffle/random (0 = random) |

**Transition:**
| Option | Default | Description |
|--------|---------|-------------|
| Transition Type | Crossfade | None, Crossfade, Slide (4 dirs), Zoom In/Out, Dissolve, Wipe Left/Right |
| Transition Easing | Ease In-Out | Linear, Ease In, Ease Out, Ease In-Out |

**Ken Burns Effect:**
| Option | Default | Description |
|--------|---------|-------------|
| Enabled | Off | Toggle slow zoom/pan animation |
| Scale | 10% | Zoom amount (1–50%) |
| Randomize Direction | On | Random pan direction per slide |

**Fit:**
| Option | Default | Description |
|--------|---------|-------------|
| Fit Mode | Cover | Contain, Cover, Fill, or None |

**Appearance** and **Effects** are similar to the Image component — opacity, corner radius, border, tint, shadow, glow, and image filters (grayscale, blur, brightness, contrast, saturation).

## Modifiers

A **modifier** is a stackable wrapper that adjusts how a component is positioned, timed, or displayed — without touching the component's own options. Every component instance has its own ordered list of modifiers. The same component can appear twice in a scene with completely different modifier stacks.

Each modifier in the list wraps the next one, with the component at the innermost layer. Reordering the stack changes how effects compose — a rotation applied outside a fade behaves differently than the reverse.

### Managing Modifiers

In the Component Editor, the **Modifiers** section sits above the component's own options. For each component you can:

- **Add** a modifier with the **+ Add modifier** button.
- **Toggle** a modifier on/off with the `On` checkbox (keeps it in the stack but inactive).
- **Reorder** with the ↑/↓ buttons — outermost first.
- **Remove** with the × button.
- **Expand** a row to edit its options.

A component with no modifiers will fill the full frame and always be visible. Add a Transform modifier to place it, add a Timing modifier to schedule it, and so on.

### Built-in Modifiers

#### Transform

Positions, sizes, rotates, and flips the wrapped component within the video frame.

| Option | Default | Description |
|--------|---------|-------------|
| X / Y | 0 | Position offset (% of canvas) |
| Width / Height | 100% | Size relative to frame |
| Anchor | Top Left | Reference point for positioning |
| Rotation | 0° | Rotation angle |
| Flip | None | Horizontal or vertical flip |

#### Timing

Schedules when a component is visible and fades it in/out around that window.

| Option | Default | Description |
|--------|---------|-------------|
| Start Time | 0ms | When the component becomes visible |
| End Time | — | When it hides (blank = to end of song) |
| Fade In | 0ms | Fade-in duration |
| Fade Out | 0ms | Fade-out duration |
| Easing | Linear | Fade curve (Linear, Ease In, Ease Out, Ease In-Out) |

#### Opacity

A constant transparency multiplier, 0–100%. Stacks multiplicatively with other opacity-affecting modifiers.

| Option | Default | Description |
|--------|---------|-------------|
| Opacity | 100 | Percent opacity (0 = hidden, 100 = fully opaque) |

#### Visibility

A hard on/off toggle. Unlike Opacity or Timing, this removes the wrapped component from layout entirely when off — useful for soloing a layer during editing or authoring a preset with a component pre-configured but disabled.

| Option | Default | Description |
|--------|---------|-------------|
| Visible | On | Show or hide the component |

### Tips

- **Position anything** — add a Transform modifier.
- **Fade in and out** — add a Timing modifier.
- **Dim a layer globally** — add an Opacity modifier.
- **Blink on/off over time** — combine Opacity with Timing, or stack multiple Timing modifiers with different windows.

Plugins can contribute additional modifiers that appear in the **+ Add modifier** menu alongside the built-ins.

## Working with Components

### Adding a component

Use the **Add component** dropdown in the Scene Builder to choose a component type, then click **Add**.

### Reordering layers

Components render bottom-to-top. The first component in the list is the furthest back. Use the up/down arrow buttons to reorder.

### Saving your scene

After arranging your components the way you like, click the **Scene** button, then **Save as User Scene** to save it as a reusable preset. Saved scenes appear in the scene preset dropdown for future projects.
