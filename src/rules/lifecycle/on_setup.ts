import {G, R_Niem, R_Bryt} from "../globals.js"
import type {PlaneToPlace} from "../types";
import {Deployment, SCENARIOS} from "../game/scenarios";
import {SUN_EDGE_NAMES, sunEdgeFor} from "../game/sun";

export const scenarios = Object.keys(SCENARIOS)

// 9.3
function toPlace(side: number, deployments: Deployment[]): PlaneToPlace[] {
  return deployments
    .flatMap(({center, radius, direction, planes}) => planes.map(plane => ({center, radius, direction, plane})))
    .map((it, idx) => ({...it, id: `${side}.${idx}`}))
}

export function on_setup(scenario: string, _options: unknown) {
  const {brytyjczycy, niemcy, targets, all_targets_vp} = SCENARIOS[scenario]
  G.board = {planes: {[R_Niem]: [], [R_Bryt]: []}}
  G.to_place = {
    [R_Bryt]: toPlace(R_Bryt, brytyjczycy.deployments),
    [R_Niem]: toPlace(R_Niem, niemcy.deployments),
  }
  G.off_board = []
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
  // 8.0
  G.vp = {[R_Niem]: 0, [R_Bryt]: 0}
  G.min_vp = {[R_Niem]: niemcy.min_vp, [R_Bryt]: brytyjczycy.min_vp}
  G.all_targets_vp = all_targets_vp
  // 5.0.1
  G.sun = sunEdgeFor(random(6) + 1)
  log(`Słońce: ${SUN_EDGE_NAMES[G.sun]}`)
  G.aa_guns = []
  G.aa_fired = []
  G.active = R_Bryt
  if (brytyjczycy.aa_guns) {
    call("place_aa_guns", {count: brytyjczycy.aa_guns})
  } else {
    call("place_planes")
  }
}
