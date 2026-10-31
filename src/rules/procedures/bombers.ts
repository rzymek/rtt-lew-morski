import type {PlaneInstance} from "../types";
import {G} from "../globals";
import {bombsLeft} from "../game/bombs";
import {hasGun} from "./aa_guns";
import {scoreAllTargetsBombed, scoreBombOnTarget} from "../game/victory";

// 7.0.2, 7.0.4, 7.0.6: the strategic objects and AA guns flown over this stage that the plane has not bombed yet.
export function bombableHexes(plane: PlaneInstance): string[] {
  if (plane.destroyed || bombsLeft(plane) <= 0) return []
  return (G.flown_over?.[plane.id] ?? []).filter(hex => G.targets?.includes(hex) || hasGun(hex))
}

export function canBomb(plane: PlaneInstance): boolean {
  return bombableHexes(plane).length > 0
}

export function dropBomb(plane: PlaneInstance, hex: string) {
  plane.bombs_dropped = (plane.bombs_dropped ?? 0) + 1
  G.flown_over![plane.id] = G.flown_over![plane.id].filter(it => it !== hex)
  if (!G.targets?.includes(hex)) return
  scoreBombOnTarget(hex)
  // 7.0.7
  G.bombed ??= []
  if (set_has(G.bombed, hex)) return
  set_add(G.bombed, hex)
  if (G.bombed.length === G.targets.length) scoreAllTargetsBombed()
}
