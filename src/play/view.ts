import {ViewPlaneInstance} from "./viewPlaneInstance";

export interface View {
  board: { planes: Record<number, ViewPlaneInstance[]> }
  active_side: number
  actions?: {
    move_hex?: string[]
    select_plane?: string[]
    attack?: number
    unjam?: number
    undo?: number
    done?: number
  }
  unmoved?: string[]
  selected_at?: string
  fire_line?: string[]
  shot?: number[]
}