import type {PlaneData} from "./game/data.js"
import type {Reinforcement} from "./game/scenarios.js"
import type {SunEdge} from "./game/sun.js"

export interface PlaneInstanceDef {
  plane: PlaneData
  at: string
  direction: number
  altitude?: number
  damaged?: boolean
  // Out of the game: shot down, or left the board for good.
  destroyed?: boolean
  // 8.1: out of the game, yet not shot down.
  left_board?: boolean
  jammed?: boolean
  bombs_dropped?: number
}

export interface PlaneInstance extends PlaneInstanceDef {
  id: string;
}

export interface Board {
  planes: Record<number, PlaneInstance[]>
}

export interface FrameState {
  P: string
  I: number
  L: FrameState | null
  $?: unknown
  message?: string
  [key: string]: unknown
}

export interface GameState {
  active: number;
  seed: number
  log: string[]
  undo: any[]
  L: FrameState | null
  board: Board
  stage: number
  reinforcements?: Record<number, Reinforcement[]>
  targets?: string[]
  moved?: number[]
  selected_plane?: string
  selected_altitude?: number
  shot?: string[]
  flown_over?: Record<string, string[]>
  bombed?: string[]
  aa_guns?: string[]
  aa_fired?: string[]
  selected_gun?: string
  sun?: SunEdge
  vp?: Record<number, number>
  min_vp?: Record<number, number>
  all_targets_vp?: number
  result?: string
}

export interface ViewState {
  log: string[]
  prompt: string | null
  actions: Record<string, number | (string | number)[]>
  board?: Board
  active_side?: number
  unmoved?: string[],
  moves?: Record<string, number>
  selected_plane?: string
  fire_line?: string[]
  fire_target?: string
  shot?: string[]
  bombed?: string[]
  targets?: string[]
  aa_guns?: string[]
  aa_fired?: string[]
  selected_gun?: string
  sun?: SunEdge
  sun_hexes?: string[]
  vp?: Record<number, number>
  min_vp?: Record<number, number>
}

export interface StateDefinition {
  inactive?: string
  _begin?: () => void
  _end?: () => void
  _resume?: () => void
  prompt?: () => void
  [action: string]: unknown
}
