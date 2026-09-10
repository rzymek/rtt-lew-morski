import "../rtt/framework.d.ts";
import {G, L, R, V} from "../globals";
import {movesMapFor} from "../game/hex";
import {fireLineHexes} from "../game/combat";

export function on_view() {
  V!.board = G.board
  V!.active_side = G.active as number
  if (R === G.active) {
    if (L!.P === 'move_planes') {
      const moved = G.moved ?? []
      V!.unmoved = G.board.planes[G.active as number]
        .map((_, idx) => idx)
        .filter(idx => !set_has(moved, idx))
    }
    if (L!.P === 'combat_initiative' || L!.P === 'combat_reaction') {
      V!.shot = G.shot ?? []
    }
    if (G.selected_plane !== undefined) {
      const plane = G.board.planes[G.active as number][G.selected_plane]
      if (plane) {
        V!.selected_at = plane.at
        if (L!.P === 'move_planes') {
          V!.moves = movesMapFor(plane)
        } else {
          V!.fire_line = fireLineHexes(plane)
        }
      }
    }
  }
}
