import {ViewPlaneInstance} from "./viewPlaneInstance";

export interface View {
  board: { planes: Record<number, (ViewPlaneInstance | null)[]> }
  active_side: number
  actions?: {
    move_hex?: string[]
    select_plane?: number[]
    attack?: number
    unjam?: number
    undo?: number
    done?: number
  }
  unmoved?: number[]
  selected_at?: string
  fire_line?: string[]
  shot?: number[]
}