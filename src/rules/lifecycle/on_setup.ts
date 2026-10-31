import {G, R_Niem, R_Bryt} from "../globals.js"
import "../rtt/framework.d.ts";
import {PlaneInstance, PlaneInstanceDef} from "../types";
import {Deployment, hexesAround, SCENARIOS} from "../game/scenarios";
import {SUN_EDGE_NAMES, sunEdgeFor} from "../game/sun";

export const scenarios = Object.keys(SCENARIOS)

function withIds(def: Record<number, PlaneInstanceDef[]>): Record<number, PlaneInstance[]> {
  return Object
    .entries(def)
    .map(([side, planes]) => ({
      [side]: planes.map((plane, idx) => ({...plane, id: `${side}.${idx}`}))
    }))
    .reduce((acc, it) => ({
      ...acc,
      ...it
    }), {})
}

// 9.3: players choose the starting hexes in the manual, here each plane gets the next one nearest to the center.
function deploy({center, radius, direction, planes}: Deployment): PlaneInstanceDef[] {
  const hexes = hexesAround(center, radius)
  return planes.map((plane, idx) => ({plane, at: hexes[idx], direction}))
}

export function on_setup(scenario: string, _options: unknown) {
  const {brytyjczycy, niemcy, targets} = SCENARIOS[scenario]
  G.board = {
    planes: withIds({
      [R_Bryt]: brytyjczycy.deployments.flatMap(deploy),
      [R_Niem]: niemcy.deployments.flatMap(deploy),
    })
  }
  G.reinforcements = {
    [R_Bryt]: brytyjczycy.reinforcements ?? [],
    [R_Niem]: niemcy.reinforcements ?? [],
  }
  G.stage = 1
  G.targets = targets
  G.moved = []
  G.shot = []
  G.flown_over = {}
  G.bombed = []
  // 5.0.1
  G.sun = sunEdgeFor(random(6) + 1)
  log(`Słońce: ${SUN_EDGE_NAMES[G.sun]}`)
  G.aa_guns = []
  G.aa_fired = []
  if (brytyjczycy.aa_guns) {
    G.active = R_Bryt
    call("place_aa_guns", {count: brytyjczycy.aa_guns})
  } else {
    G.active = R_Niem
    call("move_planes")
  }
}
