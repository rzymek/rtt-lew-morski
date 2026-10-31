import {G, R_Niem, ROLES} from "../globals";
import {ALT_HIGH, altitudeOf} from "../game/altitude";
import {hexesAround} from "../game/scenarios";
import {changeSide} from "../lifecycle/changeSide";
import {isEmpty} from "../generic/isEmpty";
import {canUnjam, shootersOf} from "./shooters";
import {canBomb} from "./bombers";
import {gunsReady} from "./aa_guns";
import {nextToReturn} from "./return_planes";

export function startCombat() {
  const planes = G.board.planes[G.active]
  if (planes.some(canUnjam) || planes.some(canBomb) || !isEmpty(shootersOf(G.active)) || !isEmpty(gunsReady())) {
    goto("combat")
  } else {
    endCombat()
  }
}

// 3.0: firing during the enemy's combat phase does not use up the shot in the plane's own phase.
export function endCombat() {
  delete G.selected_plane
  delete G.selected_gun
  changeSide()
  if (G.active === R_Niem) {
    G.stage++
    // 2.0
    log(`Etap ${G.stage}`)
  }
  G.shot = []
  G.aa_fired = []
  G.flown_over = {}
  enterReinforcements()
  goto(nextToReturn() ? "return_planes" : "move_planes")
}

// 9: an occupied entry hex gives way to the nearest free one.
function enterReinforcements() {
  const planes = G.board.planes[G.active]
  const entering = (G.reinforcements?.[G.active] ?? []).filter(it => it.stage === G.stage)
  for (const {plane, at, direction} of entering) {
    const occupied = Object.values(G.board.planes).flat()
      .filter(p => !p.destroyed && altitudeOf(p) === ALT_HIGH)
      .map(p => p.at)
    const hex = hexesAround(at, 5).find(it => !occupied.includes(it))!
    const offBoard = (G.off_board ?? []).filter(it => parseInt(it.plane.id) === G.active).length
    planes.push({plane, at: hex, direction, id: `${G.active}.${planes.length + offBoard}`})
    log(`${ROLES[G.active]}: posiłki ${plane.nazwa} na ${hex}`)
  }
  if (entering.length > 0)
    G.reinforcements![G.active] = G.reinforcements![G.active].filter(it => it.stage !== G.stage)
}
