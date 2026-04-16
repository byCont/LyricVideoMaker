import type React from "react";
import { withAlpha } from "../../shared/color";
import type { EqualizerLayout, EqualizerOptions } from "./types";

export function getEqualizerLayout(options: EqualizerOptions): EqualizerLayout {
  const isHorizontal = options.barOrientation === "horizontal";

  return {
    isHorizontal,
    lineBaseline: options.lineBaseline,
    wrapperStyle: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      padding: `${Math.max(0, options.innerPadding / 2)}px`,
      pointerEvents: "none"
    } satisfies React.CSSProperties,
    plateStyle: {
      position: "absolute",
      inset: 0,
      background: withAlpha(options.backgroundPlateColor, options.backgroundPlateOpacity / 100),
      borderRadius: `${Math.max(12, options.cornerRadius)}px`
    } satisfies React.CSSProperties,
    trackStyle: {
      position: "relative",
      display: "flex",
      flexDirection: isHorizontal ? "row" : "column",
      gap: `${options.graphMode === "line" ? 0 : options.barGap}px`,
      width: "100%",
      height: "100%",
      alignItems: "stretch",
      justifyContent: "stretch",
      overflow: "hidden"
    } satisfies React.CSSProperties
  };
}
