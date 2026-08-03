import { MissionDefinitionNotFoundError, MissionError } from "./mission-errors";
import type { MissionDefinition, MissionPayload } from "./mission-types";

/** Owns mission definition identity. Does not execute anything. */
export class MissionRegistry {
  private readonly definitions = new Map<string, MissionDefinition>();

  register<TInput extends MissionPayload, TResult extends MissionPayload>(
    definition: MissionDefinition<TInput, TResult>,
  ): void {
    if (this.definitions.has(definition.id)) {
      throw new MissionError(`Mission definition "${definition.id}" is already registered`);
    }
    this.definitions.set(definition.id, definition as unknown as MissionDefinition);
  }

  unregister(definitionId: string): boolean {
    return this.definitions.delete(definitionId);
  }

  has(definitionId: string): boolean {
    return this.definitions.has(definitionId);
  }

  get(definitionId: string): MissionDefinition | undefined {
    return this.definitions.get(definitionId);
  }

  require(definitionId: string): MissionDefinition {
    const definition = this.definitions.get(definitionId);
    if (!definition) throw new MissionDefinitionNotFoundError(definitionId);
    return definition;
  }

  list(): readonly MissionDefinition[] {
    return [...this.definitions.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  clear(): void {
    this.definitions.clear();
  }
}