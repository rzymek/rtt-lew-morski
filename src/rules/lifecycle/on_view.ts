import "../rtt/framework.d.ts";
import {G, L, R, V} from "../globals";
import {movesMapFor} from "../game/hex";
import {fireLineHexes} from "../game/combat";
import {selectedPlaneOfTheActiveSide} from "../procedures/selectedPlaneOfTheActiveSide";
import {fireTarget} from "../procedures/shooters";

export function on_view() {
  V.board = G.board
  V.active_side = G.active as number
  V.shot = G.shot
  V.bombed = G.bombed
  V.targets = G.targets
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
        V.selected_plane = plane.id
        if (L.P === 'move_planes') {
          V.moves = movesMapFor(plane, G.board.planes, G.selected_altitude)
        } else {
          V.fire_line = fireLineHexes(plane)
          V.fire_target = fireTarget(plane, G.active as number)?.plane.id
        }
      }
    }
  }
}
