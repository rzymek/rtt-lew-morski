import {G, R_Niem} from "../globals";
import {changeSide} from "../lifecycle/changeSide";
import {isEmpty} from "../generic/isEmpty";
import {shootersOf} from "./shooters";

export function startCombat() {
  const canUnjam = G.board.planes[G.active]
    .some(plane => plane.jammed && !plane.destroyed && !set_has(G.shot ?? [], plane.id))
  if (canUnjam || !isEmpty(shootersOf(G.active))) {
    goto("combat")
  } else {
    endCombat()
  }
}

// One stage (etap) covers both sides' phases, and a plane fires once per stage (5.3.1).
export function endCombat() {
  delete G.selected_plane
  changeSide()
  if (G.active === R_Niem) G.shot = []
  goto("move_planes")
}
