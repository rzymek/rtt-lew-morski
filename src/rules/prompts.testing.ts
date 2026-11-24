import {offered} from "@rzymek/rally-the-troops-module/testing";

/** [verb, argument] for each action a state's prompt offers, grouped by verb. Only for specs. */
export const offeredActions = (state: {prompt(): void}): [string, string][] =>
  Object.entries(offered(state).actions).flatMap(([verb, args]) => args.map(arg => [verb, arg] as [string, string]))

/** The buttons a state's prompt offers enabled. Only for specs. */
export const enabledButtons = (state: {prompt(): void}): string[] =>
  Object.entries(offered(state).buttons).filter(([, enabled]) => enabled).map(([name]) => name)
