import {G, R_Bryt, R_Niem, ROLES} from "../globals.js"
import {firstOnFireLine, resolveShot} from "../game/combat.js"
import {select_plane} from "./select_plane.js"
import {selectedPlaneOfTheActiveSide} from "./selectedPlaneOfTheActiveSide"

export const combat = {
  inactive: "faza walki",

  _begin() {
    G.shot = []
  },

  prompt() {
    const enemySide = G.active === R_Niem ? R_Bryt : R_Niem
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
        const target = firstOnFireLine(plane, G.board.planes)
        if (target && target.side === enemySide)
          button("attack", true)
      }
    }
  },

  select_plane,

  attack() {
    const plane = selectedPlaneOfTheActiveSide()
    if (!plane || plane.jammed || plane.destroyed) return
    const enemySide = G.active === R_Niem ? R_Bryt : R_Niem
    const hit = firstOnFireLine(plane, G.board.planes)
    if (!hit || hit.side !== enemySide) return

    push_undo()
    set_add(G.shot!, plane.id)
    const targetPlane = G.board.planes[hit.side][hit.idx]
    const {roll, atk, result} = resolveShot(plane, targetPlane!, hit.distance)
    log(`${ROLES[G.active as number]} atakuje [SA:${atk} odl:${hit.distance} rzut:${roll}] → ${result}`)
    delete G.selected_plane
  },

  unjam() {
    const plane = selectedPlaneOfTheActiveSide()
    if (!plane || !plane.jammed) return
    push_undo()
    set_add(G.shot!, plane.id)
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
    delete G.selected_plane
    G.active = G.active === R_Niem ? R_Bryt : R_Niem
    goto("combat_reaction")
  },
};
