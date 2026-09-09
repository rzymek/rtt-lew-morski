import type {PlaneData} from "./data.js"

export interface PlaneInstance {
  plane: PlaneData
  at: string
  direction: number
  damaged?: boolean
  destroyed?: boolean
  jammed?: boolean
}

export interface Board {
  planes: Record<number, (PlaneInstance | null)[]>
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
  active: number | string | string[] | null
  seed: number
  log: string[]
  undo: any[]
  L: FrameState | null
  board: Board
  targets?: string[]
  moved?: number[]
  selected_plane?: number
  shot?: number[]
  result?: string
}

export interface ViewState {
  log: string[]
  prompt: string | null
  actions: Record<string, number | (string | number)[]>
  board?: Board
  active_side?: number
  unmoved?: number[]
  moves?: Record<string, number>
  selected_at?: string
  fire_line?: string[]
  shot?: number[]
}

export interface StateDefinition {
  inactive?: string
  _begin?: () => void
  _end?: () => void
  _resume?: () => void
  prompt?: () => void
  [action: string]: unknown
}
