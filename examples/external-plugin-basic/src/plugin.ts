import type {
  BrowserLyricRuntime,
  LyricRuntime,
  LyricVideoPluginActivation,
  LyricVideoPluginHost,
  SceneComponentDefinition
} from "@lyric-video-maker/plugin-types";

interface CaptionOptions extends Record<string, unknown> {
  textColor: string;
  backgroundColor: string;
  fontSize: number;
}

interface CaptionState extends Record<string, unknown> {
  text: string;
  textColor: string;
  backgroundColor: string;
  fontSize: number;
}

const defaultOptions: CaptionOptions = {
  textColor: "#ffffff",
  backgroundColor: "#111827",
  fontSize: 72
};

const options: SceneComponentDefinition<CaptionOptions>["options"] = [
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

export function activate(host: LyricVideoPluginHost): LyricVideoPluginActivation {
  const { React } = host;

  const captionBoxComponent: SceneComponentDefinition<CaptionOptions> = {
    id: "example.caption-box",
    name: "Caption Box",
    description: "Centered caption box driven by current lyric cue.",
    staticWhenMarkupUnchanged: false,
    options,
    defaultOptions,
    browserRuntime: {
      runtimeId: "example.caption-box",
      browserScript: `
        window.__registerLiveDomRuntime("example.caption-box", {
          mount: function(layer, initialState) {
            var box = document.createElement("div");
            box.style.position = "absolute";
            box.style.left = "50%";
            box.style.top = "50%";
            box.style.transform = "translate(-50%, -50%)";
            box.style.maxWidth = "80%";
            box.style.padding = "28px 42px";
            box.style.borderRadius = "8px";
            box.style.textAlign = "center";
            box.style.fontFamily = "Arial, sans-serif";
            box.style.fontWeight = "800";
            box.style.lineHeight = "1.1";
            box.style.boxShadow = "0 20px 60px rgba(0, 0, 0, 0.35)";
            layer.appendChild(box);
            this.update({ box: box }, initialState || {});
            return { box: box };
          },
          update: function(handle, state) {
            handle.box.textContent = state.text || "";
            handle.box.style.color = state.textColor || "#ffffff";
            handle.box.style.background = state.backgroundColor || "#111827";
            handle.box.style.fontSize = String(state.fontSize || 72) + "px";
          }
        });
      `,
      getInitialState({ options, lyrics }) {
        return getCaptionState(options, lyrics);
      },
      getFrameState({ options, lyrics }) {
        return getCaptionState(options, lyrics);
      }
    },
    Component({ options, lyrics }) {
      const state = getCaptionState(options, lyrics);
      return React.createElement(
        "div",
        {
          style: {
            position: "absolute",
            inset: 0,
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
              color: state.textColor,
              background: state.backgroundColor,
              fontSize: state.fontSize,
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)"
            }
          },
          state.text
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
            options: defaultOptions
          }
        ]
      }
    ]
  };
}

function getCaptionState(
  options: CaptionOptions,
  lyrics: LyricRuntime | BrowserLyricRuntime
): CaptionState {
  return {
    text: lyrics.current?.text ?? "External caption plugin",
    textColor: options.textColor,
    backgroundColor: options.backgroundColor,
    fontSize: options.fontSize
  };
}
