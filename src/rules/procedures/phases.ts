import {G} from "../globals";
import {changeSide} from "../lifecycle/changeSide";
import {isEmpty} from "../generic/isEmpty";
import {canUnjam, shootersOf} from "./shooters";
import {canBomb} from "./bombers";

export function startCombat() {
  const planes = G.board.planes[G.active]
  if (planes.some(canUnjam) || planes.some(canBomb) || !isEmpty(shootersOf(G.active))) {
    goto("combat")
  } else {
    endCombat()
  }
}

// 3.0: firing during the enemy's combat phase does not use up the shot in the plane's own phase.
export function endCombat() {
  delete G.selected_plane
  changeSide()
  G.shot = []
  G.flown_over = {}
  goto("move_planes")
}
