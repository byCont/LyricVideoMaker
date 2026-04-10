import React from "react";
import type {
  SceneComponentInstance,
  SerializedSceneComponentDefinition
} from "@lyric-video-maker/core";
import { isSceneOptionCategory } from "@lyric-video-maker/core";
import { OptionCategorySection, OptionField } from "./form-fields";

export function ComponentDetailsEditor({
  component,
  instance,
  fonts,
  onOptionChange,
  onPickImage
}: {
  component: SerializedSceneComponentDefinition;
  instance: SceneComponentInstance;
  fonts: string[];
  onOptionChange: (optionId: string, value: unknown) => void;
  onPickImage: (optionId: string) => void;
}) {
  const topLevelOptions = component.options.filter((option) => !isSceneOptionCategory(option));
  const categorizedOptions = component.options.filter(isSceneOptionCategory);

  return (
    <section className="panel inspector-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Inspector</p>
          <h2>{component.name}</h2>
        </div>
      </div>

      <div className="inspector-layout">
        {topLevelOptions.length > 0 ? (
          <section className="inspector-section">
            <div className="inspector-section-header">
              <h3>Core Options</h3>
              <p>Change the primary fields for this component instance.</p>
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
                  onPickImage={() => onPickImage(field.id)}
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
                  onPickImage={() => onPickImage(field.id)}
                />
              ))}
            </OptionCategorySection>
          </section>
        ))}
      </div>
    </section>
  );
}
