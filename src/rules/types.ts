import type {PlaneData} from "./game/data.js"

export interface PlaneInstanceDef {
  plane: PlaneData
  at: string
  direction: number
  altitude?: number
  damaged?: boolean
  destroyed?: boolean
  jammed?: boolean
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
  targets?: string[]
  moved?: number[]
  selected_plane?: string
  selected_altitude?: number
  shot?: string[]
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
}

export interface StateDefinition {
  inactive?: string
  _begin?: () => void
  _end?: () => void
  _resume?: () => void
  prompt?: () => void
  [action: string]: unknown
}
