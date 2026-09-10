import "../rtt/framework.d.ts";
import type {PlaneInstance, Board} from "../types.js"
import {hexStep} from "./hex.js"

// [atk][dist-1] = [min, max] roll to hit (2d6); null = no hit possible
// Roll 2 or 12 always causes gun jam regardless of this table.
export const COMBAT_TABLE: ([number, number] | null)[][] = [
  [null, null, null, null, null],                      // atk 0
  [[10, 11], [11, 11], null, null, null],              // atk 1
  [[9, 11], [10, 11], [11, 11], null, null],           // atk 2
  [[8, 11], [9, 11], [10, 11], [11, 11], null],        // atk 3
  [[7, 11], [8, 11], [9, 11], [10, 11], [11, 11]],    // atk 4
  [[6, 11], [7, 11], [8, 11], [9, 11], [10, 11]],     // atk 5
]

export function fireLineHexes(plane: PlaneInstance): string[] {
  const hexes: string[] = []
  let pos: string | null = plane.at
  for (let i = 0; i < 5; i++) {
    pos = hexStep(pos, plane.direction)
    if (!pos) break
    hexes.push(pos)
  }
  return hexes
}

export interface FireTarget {
  side: number
  idx: number
  plane: PlaneInstance
  distance: number
}

// Returns {side, idx, plane, distance} of first (closest) plane on fire line, or null.
// Any plane (friendly or enemy) blocks further fire.
export function firstOnFireLine(attackerPlane: PlaneInstance, allPlanes: Board['planes']): FireTarget | null {
  const byHex: Record<string, { side: number, idx: number, plane: PlaneInstance }> = {}
  for (const [sideStr, sidePlanes] of Object.entries(allPlanes)) {
    const side = parseInt(sideStr)
    sidePlanes.forEach((p, idx) => {
      if (p && !p.destroyed) byHex[p.at] = {side, idx, plane: p}
    })
  }
  const line = fireLineHexes(attackerPlane)
  for (let d = 0; d < line.length; d++) {
    if (line[d] in byHex)
      return {...byHex[line[d]], distance: d + 1}
  }
  return null
}

export interface ShotResult {
  roll: number
  atk: number
  result: string
}

export function resolveShot(attackerPlane: PlaneInstance, targetPlane: PlaneInstance, distance: number): ShotResult {
  const atk = Math.max(0, attackerPlane.plane.sila_ataku)
  const roll = (random(6) + 1) + (random(6) + 1)

  if (roll === 2 || roll === 12) {
    attackerPlane.jammed = true
    return {roll, atk, result: 'zacięcie karabinów'}
  }

  const tableRow = Math.min(atk, COMBAT_TABLE.length - 1)
  const range = COMBAT_TABLE[tableRow][distance - 1]
  if (range && roll >= range[0] && roll <= range[1]) {
    if (targetPlane.damaged) {
      targetPlane.destroyed = true
      return {roll, atk, result: 'zestrzelony'}
    } else {
      targetPlane.damaged = true
      return {roll, atk, result: 'uszkodzony'}
    }
  }
  return {roll, atk, result: 'pudło'}
}
