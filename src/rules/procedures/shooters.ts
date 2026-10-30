import type {PlaneInstance} from "../types";
import {G} from "../globals";
import {FireTarget, firstOnFireLine} from "../game/combat";

// The enemy plane `plane` may fire at right now, if any (5.3.1, 5.3.2, 5.3.4).
export function fireTarget(plane: PlaneInstance, side: number): FireTarget | null {
  if (plane.destroyed || plane.jammed || set_has(G.shot ?? [], plane.id)) return null
  const hit = firstOnFireLine(plane, G.board.planes)
  return hit && hit.side !== side ? hit : null
}

export function markShot(plane: PlaneInstance) {
  G.shot ??= []
  set_add(G.shot, plane.id)
}

export function shootersOf(side: number): PlaneInstance[] {
  return G.board.planes[side].filter(plane => fireTarget(plane, side))
}
