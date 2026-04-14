import type { TimingEasing } from "../../shared";
import type { SlideshowTransition, TransitionStyle } from "./types";

function applyEasing(t: number, easing: TimingEasing): number {
  switch (easing) {
    case "ease-in":
      return t * t;
    case "ease-out":
      return 1 - (1 - t) * (1 - t);
    case "ease-in-out":
      return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    case "linear":
    default:
      return t;
  }
}

export function computeTransitionStyle(
  type: SlideshowTransition,
  rawProgress: number,
  easing: TimingEasing
): TransitionStyle {
  const p = applyEasing(Math.max(0, Math.min(1, rawProgress)), easing);

  switch (type) {
    case "none":
      return p < 0.5
        ? { outgoing: { opacity: 1, transform: "" }, incoming: { opacity: 0, transform: "" } }
        : { outgoing: { opacity: 0, transform: "" }, incoming: { opacity: 1, transform: "" } };

    case "crossfade":
      return {
        outgoing: { opacity: 1 - p, transform: "" },
        incoming: { opacity: p, transform: "" }
      };

    case "slide-left":
      return {
        outgoing: { opacity: 1, transform: `translateX(${-p * 100}%)` },
        incoming: { opacity: 1, transform: `translateX(${(1 - p) * 100}%)` }
      };

    case "slide-right":
      return {
        outgoing: { opacity: 1, transform: `translateX(${p * 100}%)` },
        incoming: { opacity: 1, transform: `translateX(${-(1 - p) * 100}%)` }
      };

    case "slide-up":
      return {
        outgoing: { opacity: 1, transform: `translateY(${-p * 100}%)` },
        incoming: { opacity: 1, transform: `translateY(${(1 - p) * 100}%)` }
      };

    case "slide-down":
      return {
        outgoing: { opacity: 1, transform: `translateY(${p * 100}%)` },
        incoming: { opacity: 1, transform: `translateY(${-(1 - p) * 100}%)` }
      };

    case "zoom-in":
      return {
        outgoing: { opacity: 1 - p, transform: `scale(${1 + p * 0.5})` },
        incoming: { opacity: p, transform: `scale(${0.5 + p * 0.5})` }
      };

    case "zoom-out":
      return {
        outgoing: { opacity: 1 - p, transform: `scale(${1 - p * 0.5})` },
        incoming: { opacity: p, transform: `scale(${1.5 - p * 0.5})` }
      };

    case "dissolve":
      return {
        outgoing: { opacity: 1 - p, transform: "" },
        incoming: { opacity: p * p, transform: "" }
      };

    case "wipe-left":
      return {
        outgoing: { opacity: 1, transform: "", clipPath: `inset(0 ${p * 100}% 0 0)` },
        incoming: { opacity: 1, transform: "", clipPath: `inset(0 0 0 ${(1 - p) * 100}%)` }
      };

    case "wipe-right":
      return {
        outgoing: { opacity: 1, transform: "", clipPath: `inset(0 0 0 ${p * 100}%)` },
        incoming: { opacity: 1, transform: "", clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }
      };

    default:
      return {
        outgoing: { opacity: 1 - p, transform: "" },
        incoming: { opacity: p, transform: "" }
      };
  }
}
