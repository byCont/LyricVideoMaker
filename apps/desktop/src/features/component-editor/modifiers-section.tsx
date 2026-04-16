import React, { useState } from "react";
import {
  isSceneOptionCategory,
  type ModifierInstance,
  type SceneComponentInstance,
  type SerializedModifierDefinition
} from "@lyric-video-maker/core";
import { InfoTip, OptionCategorySection, OptionField } from "../../components/ui/form-fields";

export function ModifiersSection({
  instance,
  modifierDefinitions,
  fonts,
  onAddModifier,
  onRemoveModifier,
  onMoveModifier,
  onToggleModifierEnabled,
  onModifierOptionChange
}: {
  instance: SceneComponentInstance;
  modifierDefinitions: SerializedModifierDefinition[];
  fonts: string[];
  onAddModifier: (modifier: SerializedModifierDefinition) => void;
  onRemoveModifier: (modifierId: string) => void;
  onMoveModifier: (modifierId: string, direction: -1 | 1) => void;
  onToggleModifierEnabled: (modifierId: string) => void;
  onModifierOptionChange: (modifierId: string, optionId: string, value: unknown) => void;
}) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const modifiers = instance.modifiers ?? [];
  const definitionById = new Map(modifierDefinitions.map((def) => [def.id, def]));

  return (
    <section className="inspector-section modifiers-section">
      <div className="inspector-section-header">
        <div className="section-title-row">
          <h3>Modifiers</h3>
          <InfoTip text="Wrap this component with modifiers — transform, fade, opacity, visibility. Apply outermost-first." />
        </div>
        <div className="modifiers-add">
          <button
            type="button"
            className="button"
            onClick={() => setAddMenuOpen((value) => !value)}
          >
            + Add modifier
          </button>
          {addMenuOpen && (
            <ul className="modifiers-add-menu" role="menu">
              {modifierDefinitions.map((modifier) => (
                <li key={modifier.id}>
                  <button
                    type="button"
                    className="modifiers-add-menu-item"
                    onClick={() => {
                      onAddModifier(modifier);
                      setAddMenuOpen(false);
                    }}
                    title={modifier.description}
                  >
                    {modifier.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {modifiers.length === 0 ? (
        <p className="empty-state">
          No modifiers. Add one above — e.g. a Transform modifier to position this component.
        </p>
      ) : (
        <ol className="modifier-list">
          {modifiers.map((modifier, index) => {
            const definition = definitionById.get(modifier.modifierId);
            return (
              <ModifierRow
                key={modifier.id}
                instanceId={instance.id}
                modifier={modifier}
                definition={definition}
                fonts={fonts}
                canMoveUp={index > 0}
                canMoveDown={index < modifiers.length - 1}
                onRemove={() => onRemoveModifier(modifier.id)}
                onMoveUp={() => onMoveModifier(modifier.id, -1)}
                onMoveDown={() => onMoveModifier(modifier.id, 1)}
                onToggleEnabled={() => onToggleModifierEnabled(modifier.id)}
                onOptionChange={(optionId, value) =>
                  onModifierOptionChange(modifier.id, optionId, value)
                }
              />
            );
          })}
        </ol>
      )}
    </section>
  );
}

function ModifierRow({
  instanceId,
  modifier,
  definition,
  fonts,
  canMoveUp,
  canMoveDown,
  onRemove,
  onMoveUp,
  onMoveDown,
  onToggleEnabled,
  onOptionChange
}: {
  instanceId: string;
  modifier: ModifierInstance;
  definition: SerializedModifierDefinition | undefined;
  fonts: string[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleEnabled: () => void;
  onOptionChange: (optionId: string, value: unknown) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  if (!definition) {
    return (
      <li className="modifier-row modifier-row-unknown">
        <header className="modifier-row-header">
          <strong>Unknown modifier</strong>
          <span className="modifier-row-id">{modifier.modifierId}</span>
          <button type="button" className="button button-ghost" onClick={onRemove}>
            Remove
          </button>
        </header>
      </li>
    );
  }

  const inputPrefix = `${instanceId}-${modifier.id}`;
  const topLevel = definition.options.filter((option) => !isSceneOptionCategory(option));
  const categorized = definition.options.filter(isSceneOptionCategory);

  return (
    <li className={`modifier-row${modifier.enabled ? "" : " modifier-row-disabled"}`}>
      <header className="modifier-row-header">
        <button
          type="button"
          className="modifier-row-disclosure"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "▾" : "▸"}
        </button>
        <strong className="modifier-row-name">{definition.name}</strong>
        <div className="modifier-row-actions">
          <label className="checkbox-inline" title="Enabled">
            <input type="checkbox" checked={modifier.enabled} onChange={onToggleEnabled} />
            <span>On</span>
          </label>
          <button
            type="button"
            className="icon-button"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            title="Move up"
            aria-label="Move modifier up"
          >
            ↑
          </button>
          <button
            type="button"
            className="icon-button"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            title="Move down"
            aria-label="Move modifier down"
          >
            ↓
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={onRemove}
            title="Remove"
            aria-label="Remove modifier"
          >
            ×
          </button>
        </div>
      </header>

      {expanded && (
        <div className="modifier-row-body">
          {topLevel.length > 0 && (
            <div className="option-list top-level-options">
              {topLevel.map((field) => (
                <OptionField
                  key={field.id}
                  field={field}
                  inputPrefix={inputPrefix}
                  value={modifier.options[field.id]}
                  fonts={fonts}
                  onChange={(value) => onOptionChange(field.id, value)}
                  onPickFile={() => undefined}
                />
              ))}
            </div>
          )}
          {categorized.map((category) => (
            <OptionCategorySection key={category.id} category={category}>
              {category.options.map((field) => (
                <OptionField
                  key={field.id}
                  field={field}
                  inputPrefix={inputPrefix}
                  value={modifier.options[field.id]}
                  fonts={fonts}
                  onChange={(value) => onOptionChange(field.id, value)}
                  onPickFile={() => undefined}
                />
              ))}
            </OptionCategorySection>
          ))}
        </div>
      )}
    </li>
  );
}
