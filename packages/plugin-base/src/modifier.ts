import type {
  BrowserLyricRuntime,
  SceneOptionEntry,
  VideoSettings
} from "./index";

/**
 * A ModifierApplyContext is handed to every ModifierDefinition.apply call.
 * The modifier is expected to mutate the `element` (its own wrapper div)
 * imperatively (style writes) and return nothing.
 *
 * Modifiers are called every frame in the browser render shell. They are
 * pure with respect to inputs — side effects are confined to ctx.element.
 */
export interface ModifierApplyContext<TOptions> {
  element: HTMLDivElement;
  options: TOptions;
  frame: number;
  timeMs: number;
  video: VideoSettings;
  lyrics: BrowserLyricRuntime;
}

/**
 * Plugin contract for a component modifier. Modifiers wrap a component in
 * the render tree and imperatively style their own wrapper div. They are
 * registered in the browser shell the same way SceneComponentDefinition is.
 */
export interface ModifierDefinition<TOptions> {
  id: string;
  name: string;
  description?: string;
  options: SceneOptionEntry[];
  defaultOptions: TOptions;
  validate?: (raw: unknown) => TOptions;
  apply: (ctx: ModifierApplyContext<TOptions>) => void;
}

/**
 * Per-instance modifier entry stored on a SceneComponentInstance. Order in
 * the array is outermost-first — modifiers[0] wraps modifiers[1] wraps the
 * component.
 */
export interface ModifierInstance {
  id: string;
  modifierId: string;
  enabled: boolean;
  options: Record<string, unknown>;
}

export interface ValidatedModifierInstance extends ModifierInstance {
  modifierName: string;
}

/**
 * Serialized shape of a modifier definition, shipped from the renderer
 * host to the desktop UI so option panels can render without importing
 * the definition objects directly.
 */
export interface SerializedModifierDefinition {
  id: string;
  name: string;
  description?: string;
  options: SceneOptionEntry[];
  defaultOptions: Record<string, unknown>;
}
