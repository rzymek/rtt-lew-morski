import {data} from "./game/data.js"
import type {FrameState, StateDefinition} from "@rzymek/rally-the-troops-module/rules"
import type {View} from "../shared/view"
import {ROLE_NAMES} from "../shared/shared"
import type {GameState} from "./types.js"

// framework.js assigns these and links to them by name: they have to stay declared at the top level of this bundle.

/** The game state. G.L, G.seed, G.log and G.undo are managed by the framework. */
export let G: GameState
/** The local scope of the current state. "P", "I" and "L" are reserved. */
export let L: FrameState
/** The index of the role an action or view is being handled for. */
export let R!: number
/** The view being generated for the client. */
export let V: View

/** States and procedures */
export const P: Record<string, StateDefinition | string | Array<() => void>> = {}

export const ROLES = [...ROLE_NAMES]
export const R_Niem = 0
export const R_Bryt = 1
export const sides = [R_Niem, R_Bryt];
export const planes = data.planes
