import {G, ROLES} from "../globals.js"
import {describeShot, resolveShot} from "../game/combat.js"
import {select_plane} from "./select_plane.js"
import {selectedPlaneOfTheActiveSide} from "./selectedPlaneOfTheActiveSide"
import {canUnjam, fireTarget, markShot} from "./shooters"
import {endCombat} from "./phases"
import {aaTargets, fireGun, gunsReady, selectGun} from "./aa_guns"

export const combat = {
  inactive: "faza walki",

  prompt() {
    const myPlanes = G.board.planes[G.active as number] ?? []

    const initiative = "Faza walki – inicjatywa: " + ROLES[G.active as number]
    prompt(initiative)
    button("done", true)

    myPlanes.forEach((plane) => {
      if (canUnjam(plane) || fireTarget(plane, G.active as number))
        action("select_plane", plane.id)
    })

    const plane = selectedPlaneOfTheActiveSide()
    if (plane && canUnjam(plane)) {
      button("unjam", true)
    } else if (plane) {
      const hit = fireTarget(plane, G.active as number)
      if (hit) {
        prompt(`${initiative} – ${describeShot(plane, hit.plane, hit.distance)}`)
        button("attack", true)
      }
    }

    gunsReady().forEach(gun => action("select_gun", gun))
    if (G.selected_gun !== undefined)
      aaTargets(G.selected_gun).forEach(target => action("aa_fire", target.id))
  },

  select_plane(planeId: string) {
    delete G.selected_gun
    select_plane(planeId)
  },

  select_gun: selectGun,

  aa_fire: fireGun,

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
      // 5.3.4
      plane.unjammed_stage = G.stage
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
