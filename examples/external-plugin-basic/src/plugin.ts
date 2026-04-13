import type {
  LyricRuntime,
  LyricVideoPluginActivation,
  LyricVideoPluginHost,
  SceneComponentDefinition,
  TransformOptions,
  TimingOptions
} from "@lyric-video-maker/plugin-base";

interface CaptionOptions extends TransformOptions, TimingOptions, Record<string, unknown> {
  textColor: string;
  backgroundColor: string;
  fontSize: number;
}

export function activate(host: LyricVideoPluginHost): LyricVideoPluginActivation {
  const { React } = host;
  const {
    transformCategory,
    timingCategory,
    DEFAULT_TRANSFORM_OPTIONS,
    DEFAULT_TIMING_OPTIONS,
    computeTransformStyle,
    computeTimingOpacity
  } = host.transform;

  const defaultOptions: CaptionOptions = {
    ...DEFAULT_TRANSFORM_OPTIONS,
    ...DEFAULT_TIMING_OPTIONS,
    textColor: "#ffffff",
    backgroundColor: "#111827",
    fontSize: 72
  };

  const options: SceneComponentDefinition<CaptionOptions>["options"] = [
    transformCategory,
    timingCategory,
    { id: "textColor", label: "Text color", type: "color", defaultValue: "#ffffff" },
    { id: "backgroundColor", label: "Background color", type: "color", defaultValue: "#111827" },
    {
      id: "fontSize",
      label: "Font size",
      type: "number",
      defaultValue: 72,
      min: 24,
      max: 180,
      step: 1
    }
  ];

  const captionBoxComponent: SceneComponentDefinition<CaptionOptions> = {
    id: "example.caption-box",
    name: "Caption Box",
    description: "Centered caption box driven by current lyric cue.",
    staticWhenMarkupUnchanged: false,
    options,
    defaultOptions,
    Component({ options, lyrics, video, timeMs }) {
      const text = lyrics.current?.text ?? "External caption plugin";
      const transformStyle = computeTransformStyle(options, video);
      const opacity = computeTimingOpacity(timeMs, options);
      return React.createElement(
        "div",
        {
          style: {
            ...transformStyle,
            opacity,
            display: "grid",
            placeItems: "center",
            background: "transparent"
          }
        },
        React.createElement(
          "div",
          {
            style: {
              maxWidth: "80%",
              padding: "28px 42px",
              borderRadius: 8,
              textAlign: "center",
              fontFamily: "Arial, sans-serif",
              fontWeight: 800,
              lineHeight: 1.1,
              color: options.textColor,
              background: options.backgroundColor,
              fontSize: options.fontSize,
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)"
            }
          },
          text
        )
      );
    }
  };

  return {
    components: [captionBoxComponent],
    scenes: [
      {
        id: "example.caption-demo",
        name: "Example Caption Demo",
        description: "External plugin scene using the caption box component.",
        source: "plugin",
        readOnly: true,
        components: [
          {
            id: "caption-box-1",
            componentId: "example.caption-box",
            enabled: true,
            options: defaultOptions as Record<string, unknown>
          }
        ]
      }
    ]
  };
}
