import { KernelError } from "../errors";

export class MissionError extends KernelError {
  constructor(message: string) {
    super(message);
    this.name = "MissionError";
  }
}

export class MissionNotFoundError extends MissionError {
  constructor(missionId: string) {
    super(`Mission "${missionId}" was not found`);
    this.name = "MissionNotFoundError";
  }
}

export class MissionDefinitionNotFoundError extends MissionError {
  constructor(definitionId: string) {
    super(`Mission definition "${definitionId}" is not registered`);
    this.name = "MissionDefinitionNotFoundError";
  }
}

export class MissionTransitionError extends MissionError {
  constructor(missionId: string, from: string, to: string) {
    super(`Mission "${missionId}" cannot transition from ${from} to ${to}`);
    this.name = "MissionTransitionError";
  }
}

export class MissionCancelledError extends MissionError {
  constructor(missionId: string) {
    super(`Mission "${missionId}" was cancelled`);
    this.name = "MissionCancelledError";
  }
}