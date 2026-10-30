import {G, ROLES} from "../globals.js"
import {resolveShot} from "../game/combat.js"
import {select_plane} from "./select_plane.js"
import {selectedPlaneOfTheActiveSide} from "./selectedPlaneOfTheActiveSide"
import {fireTarget, markShot} from "./shooters"
import {endCombat} from "./phases"

export const combat = {
  inactive: "faza walki",

  prompt() {
    const myPlanes = G.board.planes[G.active as number] ?? []
    const shot = G.shot ?? []

    prompt("Faza walki – inicjatywa: " + ROLES[G.active as number])
    button("done", true)

    myPlanes.forEach((plane) => {
      if (plane && !plane.destroyed)
        action("select_plane", plane.id)
    })

    const plane = selectedPlaneOfTheActiveSide()
    if (plane && !set_has(shot, plane.id) && !plane.destroyed) {
      if (plane.jammed) {
        button("unjam", true)
      } else {
        if (fireTarget(plane, G.active as number))
          button("attack", true)
      }
    }
  },

  select_plane,

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
    if (!plane || !plane.jammed || set_has(G.shot ?? [], plane.id)) return
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
