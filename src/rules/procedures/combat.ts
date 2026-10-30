import {G, ROLES} from "../globals.js"
import {resolveShot} from "../game/combat.js"
import {select_plane} from "./select_plane.js"
import {selectedPlaneOfTheActiveSide} from "./selectedPlaneOfTheActiveSide"
import {canUnjam, fireTarget, markShot} from "./shooters"
import {endCombat} from "./phases"
import {bombableHexes, canBomb, dropBomb} from "./bombers"
import {bombsLeft} from "../game/bombs"

export const combat = {
  inactive: "faza walki",

  prompt() {
    const myPlanes = G.board.planes[G.active as number] ?? []

    prompt("Faza walki – inicjatywa: " + ROLES[G.active as number])
    button("done", true)

    myPlanes.forEach((plane) => {
      if (canUnjam(plane) || canBomb(plane) || fireTarget(plane, G.active as number))
        action("select_plane", plane.id)
    })

    const plane = selectedPlaneOfTheActiveSide()
    if (plane && canUnjam(plane)) {
      button("unjam", true)
    } else if (plane && fireTarget(plane, G.active as number)) {
      button("attack", true)
    }
    if (plane) {
      bombableHexes(plane).forEach(hex => action("bomb", hex))
      // Counters on the hexes to bomb pass their clicks through, this plane's own included.
      if (canBomb(plane)) button("deselect", true)
    }
  },

  select_plane,

  deselect() {
    delete G.selected_plane
  },

  bomb(hex: string) {
    const plane = selectedPlaneOfTheActiveSide()
    if (!plane || !bombableHexes(plane).includes(hex)) return

    push_undo()
    dropBomb(plane, hex)
    log(`${ROLES[G.active as number]} zrzuca bomby na ${hex} (pozostało serii: ${bombsLeft(plane)})`)
    if (!canBomb(plane)) delete G.selected_plane
  },

  attack() {
    const plane = selectedPlaneOfTheActiveSide()
    const hit = plane && fireTarget(plane, G.active as number)
    if (!plane || !hit) return

    clear_undo()
    markShot(plane)
    const targetPlane = G.board.planes[hit.side][hit.idx]
    const {roll, atk, result} = resolveShot(plane, targetPlane!, hit.distance)
    log(`${ROLES[G.active as number]} atakuje [SA:${atk} odl:${hit.distance} rzut:${roll}] → ${result}`)
    delete G.selected_plane
  },

  unjam() {
    const plane = selectedPlaneOfTheActiveSide()
    if (!plane || !canUnjam(plane)) return
    clear_undo()
    markShot(plane)
    const roll = random(6) + 1
    if (roll === 6) {
      delete plane.jammed
      log(`${ROLES[G.active as number]} odblokował karabiny (rzut:${roll}) – sukces`)
    } else {
      log(`${ROLES[G.active as number]} nie odblokował karabinów (rzut:${roll})`)
    }
    delete G.selected_plane
  },

  done() {
    endCombat()
  },
};
