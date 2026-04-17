import React, { useMemo, useState } from "react";
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
  const [modifierToAddId, setModifierToAddId] = useState<string>(
    modifierDefinitions[0]?.id ?? ""
  );
  const modifiers = instance.modifiers ?? [];
  const definitionById = useMemo(
    () => new Map(modifierDefinitions.map((def) => [def.id, def])),
    [modifierDefinitions]
  );

  const activeAddId = modifierToAddId || modifierDefinitions[0]?.id || "";

  const handleAdd = () => {
    const def = definitionById.get(activeAddId);
    if (def) {
      onAddModifier(def);
    }
  };

  return (
    <section className="inspector-section modifiers-section">
      <div className="inspector-section-header">
        <div className="section-title-row">
          <h3>Modifiers</h3>
          <InfoTip text="Wrap this component with modifiers — transform, fade, opacity, visibility. Apply outermost-first." />
        </div>
      </div>

      {modifiers.length === 0 ? (
        <p className="empty-state modifiers-empty-state">
          No modifiers. Add one below — e.g. a Transform modifier to position this component.
        </p>
      ) : (
        <div className="modifier-list">
          {modifiers.map((modifier, index) => {
            const definition = definitionById.get(modifier.modifierId);
            return (
              <ModifierRow
                key={modifier.id}
                instanceId={instance.id}
                modifier={modifier}
                definition={definition}
                fonts={fonts}
                index={index}
                isFirst={index === 0}
                isLast={index === modifiers.length - 1}
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
        </div>
      )}

      {modifierDefinitions.length > 0 && (
        <div className="modifiers-add-row">
          <label className="field workspace-compact-field">
            <span>Add modifier</span>
            <select
              value={activeAddId}
              onChange={(event) => setModifierToAddId(event.target.value)}
            >
              {modifierDefinitions.map((def) => (
                <option key={def.id} value={def.id} title={def.description}>
                  {def.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="primary workspace-add-button"
            onClick={handleAdd}
            disabled={!activeAddId}
          >
            Add
          </button>
        </div>
      )}
    </section>
  );
}

function ModifierRow({
  instanceId,
  modifier,
  definition,
  fonts,
  index,
  isFirst,
  isLast,
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
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleEnabled: () => void;
  onOptionChange: (optionId: string, value: unknown) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  if (!definition) {
    return (
      <div className="modifier-row modifier-row-unknown">
        <div className="modifier-row-main">
          <span className="workspace-component-order modifier-row-order">{index + 1}</span>
          <div className="modifier-row-copy">
            <span className="workspace-nav-title">Unknown modifier</span>
            <span className="workspace-nav-subtitle">{modifier.modifierId}</span>
          </div>
          <div className="workspace-component-actions modifier-row-actions">
            <button
              type="button"
              className="secondary danger icon-button"
              onClick={onRemove}
              aria-label="Remove modifier"
              title="Remove"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inputPrefix = `${instanceId}-${modifier.id}`;
  const topLevel = definition.options.filter((option) => !isSceneOptionCategory(option));
  const categorized = definition.options.filter(isSceneOptionCategory);
  const rowClass = `modifier-row${modifier.enabled ? "" : " modifier-row-disabled"}${
    expanded ? " is-expanded" : ""
  }`;

  return (
    <div className={rowClass}>
      <div className="modifier-row-main">
        <button
          type="button"
          className="modifier-row-select"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          title={definition.description}
        >
          <span className="modifier-row-chevron" aria-hidden="true">
            {expanded ? "▾" : "▸"}
          </span>
          <span className="workspace-component-order modifier-row-order">{index + 1}</span>
          <span className="modifier-row-copy">
            <span className="workspace-nav-title">{definition.name}</span>
            <span className="workspace-nav-subtitle">
              {modifier.enabled ? "Enabled" : "Disabled"}
            </span>
          </span>
        </button>

        <div className="workspace-component-actions modifier-row-actions">
          <button
            type="button"
            className={`secondary icon-button ${modifier.enabled ? "is-active" : ""}`}
            onClick={onToggleEnabled}
            aria-label={`${modifier.enabled ? "Disable" : "Enable"} ${definition.name}`}
            title={modifier.enabled ? "Disable" : "Enable"}
          >
            {modifier.enabled ? "On" : "Off"}
          </button>
          <button
            type="button"
            className="secondary icon-button"
            disabled={isFirst}
            onClick={onMoveUp}
            title="Move up"
            aria-label={`Move ${definition.name} up`}
          >
            ↑
          </button>
          <button
            type="button"
            className="secondary icon-button"
            disabled={isLast}
            onClick={onMoveDown}
            title="Move down"
            aria-label={`Move ${definition.name} down`}
          >
            ↓
          </button>
          <button
            type="button"
            className="secondary danger icon-button"
            onClick={onRemove}
            title="Remove"
            aria-label={`Remove ${definition.name}`}
          >
            ×
          </button>
        </div>
      </div>

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
    </div>
  );
}
