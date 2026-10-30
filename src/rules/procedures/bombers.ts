import type {PlaneInstance} from "../types";
import {G} from "../globals";
import {bombsLeft} from "../game/bombs";

// 7.0.2, 7.0.4: the hexes flown over this stage that the plane has not bombed yet.
export function bombableHexes(plane: PlaneInstance): string[] {
  if (plane.destroyed || bombsLeft(plane) <= 0) return []
  return G.flown_over?.[plane.id] ?? []
}

export function canBomb(plane: PlaneInstance): boolean {
  return bombableHexes(plane).length > 0
}

export function dropBomb(plane: PlaneInstance, hex: string) {
  plane.bombs_dropped = (plane.bombs_dropped ?? 0) + 1
  G.flown_over![plane.id] = G.flown_over![plane.id].filter(it => it !== hex)
  // 7.0.7: only strategic objects get the marker.
  if (G.targets?.includes(hex)) {
    G.bombed ??= []
    set_add(G.bombed, hex)
  }
}
