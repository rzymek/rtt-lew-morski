import {G, R_Niem, R_Bryt, planes} from "../globals.js"
import "../rtt/framework.d.ts";
import {PlaneInstance, PlaneInstanceDef} from "../types";

function withIds(def: Record<number, PlaneInstanceDef[]>): Record<number, PlaneInstance[]> {
  return Object
    .entries(def)
    .map(([side, planes]) => ({
      [side]: planes.map((plane, idx) => ({...plane, id: `${side}.${idx}`}))
    }))
    .reduce((acc, it) => ({
      ...acc,
      ...it
    }), {})
}

export function on_setup(_scenario: string, _options: unknown) {
  G.board = {
    planes: withIds({
      [R_Bryt]: [
        {plane: planes.SpitL, at: 'A32.B30', direction: 0},
        {plane: planes.Spit, at: 'A32.B31', direction: 1},
        {plane: planes.Spit, at: 'A32.B32', direction: 2},
        // {plane: planes.SpitL, at: 'A10.B08', direction: 0},
        // {plane: planes.Spit, at: 'A11.B08', direction: 1},
        // {plane: planes.Spit, at: 'A09.B08', direction: 2},
      ],
      [R_Niem]: [
        {plane: planes.ME110, at: 'A40.B35', direction: 4},
        {plane: planes.ME110, at: 'A40.B36', direction: 4},

        {plane: planes.HE111, at: 'A41.B35', direction: 4},
        {plane: planes.HE111, at: 'A42.B35', direction: 4},
        {plane: planes.HE111, at: 'A39.B35', direction: 4},
        {plane: planes.HE111, at: 'A38.B35', direction: 4},
      ]
    })
  }
  G.targets = ['A06.B19', 'A16.B24']
  G.moved = []
  G.active = R_Niem
  call("move_planes")
}
