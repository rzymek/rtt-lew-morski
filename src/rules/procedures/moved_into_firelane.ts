import type {PlaneInstance} from "../types";
import {G, L, ROLES} from "../globals";
import {applyHit, describeShot, resolveShot, rollShot} from "../game/combat";
import {changeSide} from "../lifecycle/changeSide";
import {isEmpty} from "@rally-the-troops/module/rules";
import {select_plane} from "./select_plane";
import {selectedPlaneOfTheActiveSide} from "./selectedPlaneOfTheActiveSide";
import {fireTarget, markShot, shootersOf} from "./shooters";
import {startCombat} from "./phases";

function endReaction() {
  delete G.selected_plane
  changeSide()
  startCombat()
}

function afterShot() {
  delete G.selected_plane
  clear_undo()
  if (isEmpty(shootersOf(G.active))) endReaction()
}

function planeById(id: unknown): PlaneInstance {
  return Object.values(G.board.planes).flat().find(plane => plane.id === id)!
}

// 5.4: before the moving side's own attacks, enemy planes fire at those that ended their move on their fire line.
export const movedIntoFirelane = {
  inactive: "krzyżowanie się linii ognia",

  prompt() {
    shootersOf(G.active).forEach(plane => action("select_plane", plane.id))
    const selected = selectedPlaneOfTheActiveSide()
    const hit = selected && fireTarget(selected, G.active)
    const title = `krzyżowanie się linii ognia – ostrzał ${ROLES[G.active]}`
    prompt(hit ? `${title} – ${describeShot(selected, hit.plane, hit.distance)}` : title)
    button("attack", !!hit)
    button("done")
  },

  select_plane,

  attack() {
    const plane = selectedPlaneOfTheActiveSide()
    const hit = plane && fireTarget(plane, G.active)
    if (!plane || !hit) return
    markShot(plane)
    const shot = rollShot(plane, hit.plane, hit.distance)
    log(`${ROLES[G.active]} atakuje poza swoją fazą [SA:${shot.atk} odl:${hit.distance} rzut:${shot.roll}] → ${shot.result}`)
    if (!shot.hit) return afterShot()
    if (fireTarget(hit.plane, hit.side)?.plane.id === plane.id) {
      // Coinciding fire lines: the target shoots back before this hit takes effect.
      delete G.selected_plane
      changeSide()
      G.selected_plane = hit.plane.id
      clear_undo()
      return goto("return_fire", {shooter: plane.id, target: hit.plane.id})
    }
    log(`${ROLES[hit.side]}: ${applyHit(hit.plane)}`)
    afterShot()
  },

  done() {
    endReaction()
  },
}

function endReturnFire() {
  const target = planeById(L.target)
  log(`${ROLES[G.active]}: ${applyHit(target)}`)
  changeSide()
  goto("moved_into_firelane")
  afterShot()
}

export const returnFire = {
  inactive: "równoczesny ostrzał",

  prompt() {
    const plane = planeById(L.target)
    const hit = fireTarget(plane, G.active)
    const title = `Samolot ${ROLES[G.active]} został trafiony – może jeszcze odpowiedzieć ogniem`
    prompt(hit ? `${title} – ${describeShot(plane, hit.plane, hit.distance)}` : title)
    button("attack")
    button("done")
  },

  attack() {
    const plane = planeById(L.target)
    const hit = fireTarget(plane, G.active)
    if (hit) {
      markShot(plane)
      const {roll, atk, result} = resolveShot(plane, hit.plane, hit.distance)
      log(`${ROLES[G.active]} odpowiada ogniem [SA:${atk} odl:${hit.distance} rzut:${roll}] → ${result}`)
    }
    endReturnFire()
  },

  done() {
    endReturnFire()
  },
}
