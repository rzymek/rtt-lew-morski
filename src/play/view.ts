import {ViewPlaneInstance} from "./viewPlaneInstance";

export interface View {
  board: { planes: Record<number, ViewPlaneInstance[]> }
  active_side: number
  actions?: {
    move_hex?: string[]
    select_plane?: string[]
    wysoko?: number
    nisko?: number
    bardzo_nisko?: number
    attack?: number
    unjam?: number
    bomb?: string[]
    place_gun?: string[]
    select_gun?: string[]
    aa_fire?: string[]
    deselect?: number
    leave_board?: number
    undo?: number
    done?: number
  }
  unmoved?: string[]
  selected_plane?: string
  fire_line?: string[]
  fire_target?: string
  shot?: string[]
  bombed?: string[]
  targets?: string[]
  aa_guns?: string[]
  aa_fired?: string[]
  selected_gun?: string
  sun?: 'E' | 'S' | 'W'
  sun_hexes?: string[]
  vp?: Record<number, number>
  min_vp?: Record<number, number>
}