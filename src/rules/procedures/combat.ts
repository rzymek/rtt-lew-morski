import {G, ROLES} from "../globals.js"
import type {PlaneInstance} from "../types"
import {isEmpty} from "@rzymek/rally-the-troops-module/rules"
import {describeShot, resolveShot} from "../game/combat.js"
import {next_plane, select_plane} from "./select_plane.js"
import {selectedPlaneOfTheActiveSide} from "./selectedPlaneOfTheActiveSide"
import {canUnjam, fireTarget, markShot, shootersOf} from "./shooters"
import {endCombat} from "./phases"
import {aaTargets, fireGun, gunsReady, selectGun} from "./aa_guns"

// Planes of `side` that can still shoot or try to unjam their guns in this phase.
export function combatActors(side: number): PlaneInstance[] {
  return G.board.planes[side].filter(plane => canUnjam(plane) || fireTarget(plane, side))
}

// What may still fire in this phase, so that ending it is confirmed.
function unusedShooters(): string[] {
  const names = shootersOf(G.active as number).map(plane => plane.plane.nazwa)
  const guns = gunsReady().length
  return [
    ...(names.length > 0 ? [`nie strzelały jeszcze samoloty, które mogą strzelać: ${names.join(", ")}`] : []),
    ...(guns > 0 ? [`działka p-lot gotowe do ostrzału: ${guns}`] : []),
  ]
}

export const combat = {
  inactive: "faza walki",

  prompt() {
    const initiative = "Faza walki – inicjatywa: " + ROLES[G.active as number]
    if (G.confirm_done) {
      prompt(`${initiative} – ${unusedShooters().join(", ")}. Zakończyć fazę walki?`)
      button("confirm_done", true)
      button("cancel", true)
      return
    }
    const guns = gunsReady()
    prompt(initiative + (guns.length > 0 ? ` – działka p-lot gotowe do ostrzału: ${guns.length}` : ""))
    button("done", true)

    combatActors(G.active as number).forEach(plane => {
      action("select_plane", plane.id)
      action("next_plane", plane.id)
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

    guns.forEach(gun => action("select_gun", gun))
    if (G.selected_gun !== undefined)
      aaTargets(G.selected_gun).forEach(target => action("aa_fire", target.id))
  },

  select_plane(planeId: string) {
    delete G.selected_gun
    select_plane(planeId)
  },

  next_plane(planeId: string) {
    delete G.selected_gun
    next_plane(planeId)
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
    if (!isEmpty(unusedShooters())) {
      push_undo()
      G.confirm_done = true
      return
    }
    endCombat()
  },

  confirm_done() {
    delete G.confirm_done
    endCombat()
  },

  cancel() {
    delete G.confirm_done
  },
};
