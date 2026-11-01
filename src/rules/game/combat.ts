import type {PlaneInstance, Board} from "../types.js"
import {hexStep} from "@rzymek/rally-the-troops-module/rules"
import {altitudeOf, planeStats} from "./altitude.js"
import {cloudPenalty, isInCloud} from "./clouds.js"
import {sunPenalty} from "./sun.js"
import {scorePlaneLost} from "./victory.js"

// [atk][dist-1] = [min, max] roll to hit (2d6); null = no hit possible
// Roll 2 or 12 always causes gun jam regardless of this table.
export const COMBAT_TABLE: ([number, number] | null)[][] = [
  [null, null, null, null, null],                      // atk 0
  [[9, 11], [10, 11], [11, 11], null, null],           // atk 1
  [[8, 11], [9, 11], [10, 11], [11, 11], null],        // atk 2
  [[7, 11], [8, 11], [9, 11], [10, 11], [11, 11]],     // atk 3
  [[6, 11], [7, 11], [8, 11], [9, 11], [10, 11]],      // atk 4
  [[5, 11], [6, 11], [7, 11], [8, 11], [9, 11]],       // atk 5
]

export function fireLineHexes(plane: PlaneInstance): string[] {
  const hexes: string[] = []
  let pos: string | null = plane.at
  // 5.0.5
  const range = isInCloud(plane) ? 1 : 5
  for (let i = 0; i < range; i++) {
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
// Any plane (friendly or enemy) at the attacker's altitude blocks further fire; other altitudes are out of reach (5.2).
export function firstOnFireLine(attackerPlane: PlaneInstance, allPlanes: Board['planes']): FireTarget | null {
  const byHex: Record<string, { side: number, idx: number, plane: PlaneInstance }> = {}
  for (const [sideStr, sidePlanes] of Object.entries(allPlanes)) {
    const side = parseInt(sideStr)
    sidePlanes.forEach((p, idx) => {
      if (p && !p.destroyed && altitudeOf(p) === altitudeOf(attackerPlane)) byHex[p.at] = {side, idx, plane: p}
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

export interface ShotRoll extends ShotResult {
  hit: boolean
}

// 5.0.1, 5.0.2, 5.0.7
function attackStrength(attackerPlane: PlaneInstance, targetPlane: PlaneInstance): number {
  return Math.max(0, planeStats(attackerPlane).sila_ataku - cloudPenalty(attackerPlane) - cloudPenalty(targetPlane) - sunPenalty(attackerPlane, targetPlane))
}

function hitRange(atk: number, distance: number): [number, number] | null {
  return COMBAT_TABLE[Math.min(atk, COMBAT_TABLE.length - 1)][distance - 1]
}

const isJam = (roll: number) => roll === 2 || roll === 12

// Rolls a shot without touching the target, so that hits can be applied simultaneously (5.4).
export function rollShot(attackerPlane: PlaneInstance, targetPlane: PlaneInstance, distance: number): ShotRoll {
  const atk = attackStrength(attackerPlane, targetPlane)
  const roll = (random(6) + 1) + (random(6) + 1)

  if (isJam(roll)) {
    attackerPlane.jammed = true
    return {roll, atk, hit: false, result: 'zacięcie karabinów'}
  }

  const range = hitRange(atk, distance)
  const hit = !!range && roll >= range[0] && roll <= range[1]
  return {roll, atk, hit, result: hit ? 'trafienie' : 'pudło'}
}

// The number of the 36 outcomes of 2d6 that sum up to a value matching the predicate.
function waysToRoll(matches: (roll: number) => boolean): number {
  let ways = 0
  for (let d1 = 1; d1 <= 6; d1++)
    for (let d2 = 1; d2 <= 6; d2++)
      if (matches(d1 + d2)) ways++
  return ways
}

export function hitChance(atk: number, distance: number): number {
  const range = hitRange(atk, distance)
  return range ? waysToRoll(roll => !isJam(roll) && roll >= range[0] && roll <= range[1]) / 36 : 0
}

const percent = (chance: number) => `${Math.round(chance * 100)}%`

// All that makes up the odds of a shot, for the player about to fire it.
export function describeShot(attackerPlane: PlaneInstance, targetPlane: PlaneInstance, distance: number): string {
  const modifiers: [string, number][] = [
    ["chmura atakującego", cloudPenalty(attackerPlane)],
    ["chmura celu", cloudPenalty(targetPlane)],
    ["słońce", sunPenalty(attackerPlane, targetPlane)],
  ]
  const base = planeStats(attackerPlane).sila_ataku
  const atk = attackStrength(attackerPlane, targetPlane)
  const applied = modifiers.filter(([, value]) => value > 0).map(([name, value]) => `${name} −${value}`)
  const strength = [`SA ${base}${attackerPlane.damaged ? " (uszkodzony)" : ""}`, ...applied].join(", ")
  const total = applied.length > 0 ? ` = SA ${atk}` : ""
  const range = hitRange(atk, distance)
  const rolls = range ? `rzut ${range[0]}–${range[1]}` : "bez szans"
  return `${strength}${total}, odległość ${distance}: ${rolls} – trafienie ${percent(hitChance(atk, distance))}, zacięcie ${percent(waysToRoll(isJam) / 36)}`
}

export function applyHit(targetPlane: PlaneInstance): string {
  if (targetPlane.damaged) {
    targetPlane.destroyed = true
    scorePlaneLost(targetPlane)
    return 'zestrzelony'
  }
  targetPlane.damaged = true
  return 'uszkodzony'
}

export function resolveShot(attackerPlane: PlaneInstance, targetPlane: PlaneInstance, distance: number): ShotResult {
  const shot = rollShot(attackerPlane, targetPlane, distance)
  return {...shot, result: shot.hit ? applyHit(targetPlane) : shot.result}
}
