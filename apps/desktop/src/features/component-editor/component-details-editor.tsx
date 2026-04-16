import React from "react";
import type {
  SceneComponentInstance,
  SerializedModifierDefinition,
  SerializedSceneComponentDefinition
} from "@lyric-video-maker/core";
import { isSceneOptionCategory } from "@lyric-video-maker/core";
import { InfoTip, OptionCategorySection, OptionField } from "../../components/ui/form-fields";
import { ModifiersSection } from "./modifiers-section";

export function ComponentDetailsEditor({
  component,
  instance,
  fonts,
  modifierDefinitions,
  onOptionChange,
  onPickFile,
  onAddModifier,
  onRemoveModifier,
  onMoveModifier,
  onToggleModifierEnabled,
  onModifierOptionChange
}: {
  component: SerializedSceneComponentDefinition;
  instance: SceneComponentInstance;
  fonts: string[];
  modifierDefinitions: SerializedModifierDefinition[];
  onOptionChange: (optionId: string, value: unknown) => void;
  /** Generalized file-pick callback: identifier + kind. */
  onPickFile: (optionId: string, kind: "image" | "video" | "image-list") => void;
  onAddModifier: (modifier: SerializedModifierDefinition) => void;
  onRemoveModifier: (modifierId: string) => void;
  onMoveModifier: (modifierId: string, direction: -1 | 1) => void;
  onToggleModifierEnabled: (modifierId: string) => void;
  onModifierOptionChange: (modifierId: string, optionId: string, value: unknown) => void;
}) {
  const topLevelOptions = component.options.filter((option) => !isSceneOptionCategory(option));
  const categorizedOptions = component.options.filter(isSceneOptionCategory);

  return (
    <section className="panel inspector-panel">

      <div className="inspector-layout">
        <ModifiersSection
          instance={instance}
          modifierDefinitions={modifierDefinitions}
          fonts={fonts}
          onAddModifier={onAddModifier}
          onRemoveModifier={onRemoveModifier}
          onMoveModifier={onMoveModifier}
          onToggleModifierEnabled={onToggleModifierEnabled}
          onModifierOptionChange={onModifierOptionChange}
        />

        {topLevelOptions.length > 0 ? (
          <section className="inspector-section">
            <div className="inspector-section-header">
              <div className="section-title-row">
                <h3>Core Options</h3>
                <InfoTip text="Change the primary fields for this component instance." />
              </div>
            </div>

            <div className="option-list top-level-options">
              {topLevelOptions.map((field) => (
                <OptionField
                  key={field.id}
                  field={field}
                  inputPrefix={instance.id}
                  value={instance.options[field.id]}
                  fonts={fonts}
                  onChange={(value) => onOptionChange(field.id, value)}
                  onPickFile={(kind) => onPickFile(field.id, kind)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {categorizedOptions.map((category) => (
          <section key={category.id} className="inspector-section">
            <OptionCategorySection category={category}>
              {category.options.map((field) => (
                <OptionField
                  key={field.id}
                  field={field}
                  inputPrefix={instance.id}
                  value={instance.options[field.id]}
                  fonts={fonts}
                  onChange={(value) => onOptionChange(field.id, value)}
                  onPickFile={(kind) => onPickFile(field.id, kind)}
                />
              ))}
            </OptionCategorySection>
          </section>
        ))}
      </div>
    </section>
  );
}
