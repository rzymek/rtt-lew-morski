import "../rtt/framework.d.ts";
import {G, L, R, V} from "../globals";
import {movesMapFor} from "../game/hex";
import {fireLineHexes} from "../game/combat";
import {selectedPlaneOfTheActiveSide} from "../procedures/selectedPlaneOfTheActiveSide";

export function on_view() {
  V.board = G.board
  V.active_side = G.active as number
  if (R === G.active) {
    if (L.P === 'move_planes') {
      const moved = G.moved ?? []
      V.unmoved = G.board.planes[G.active as number]
        .filter(plane => !set_has(moved, [plane.id]))
        .map(plane => plane.id)
    }
    if (G.selected_plane !== undefined) {
      const plane = selectedPlaneOfTheActiveSide();
      if (plane) {
        V.selected_at = plane.at
        if (L.P === 'move_planes') {
          V.moves = movesMapFor(plane, G.selected_altitude)
        }
      }
    }
  }
}
