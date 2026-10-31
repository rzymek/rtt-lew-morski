import "../rtt/framework.d.ts";
import {Board, PlaneInstance} from "../types";
import {altitudeOf, maxSpeedAt, planeStats} from "./altitude";

// Clockwise from North: N, NE, SE, S, SW, NW
export const DIR_OFFSETS: [number, number][] = [
  [0, +1], [+1, +1], [+1, 0],
  [0, -1], [-1, -1], [-1, 0],
]

export function parseHex(id: string): [number, number] | [null, null] {
  const m = id && id.match(/^A(\d+)\.B(\d+)$/)
  return m ? [parseInt(m[1]), parseInt(m[2])] : [null, null]
}

export function hexId(a: number, b: number): string {
  return `A${String(a).padStart(2, '0')}.B${String(b).padStart(2, '0')}`
}

export function hexDistance(from: string, to: string): number {
  const [a1, b1] = parseHex(from) as [number, number]
  const [a2, b2] = parseHex(to) as [number, number]
  const da = a2 - a1, db = b2 - b1
  return Math.max(Math.abs(da), Math.abs(db), Math.abs(da - db))
}

export function hexStep(id: string, dir: number): string | null {
  const [a, b] = parseHex(id)
  if (a === null) return null
  const [da, db] = DIR_OFFSETS[dir]
  const na = a + da, nb = b + db
  if (na < 0 || nb < 0) return null
  return hexId(na, nb)
}

export interface Flight {
  direction: number
  // Hexes entered on the way, destination included.
  path: string[]
}

function occupiedAt(allPlanes: Board['planes'], altitude: number): string[] {
  return Object.values(allPlanes).flat()
    .filter(p => !p.destroyed && altitudeOf(p) === altitude)
    .map(p => p.at)
}

function crossesSouthEdge(hex: string, direction: number): boolean {
  const [a, b] = parseHex(hex) as [number, number]
  const [da, db] = DIR_OFFSETS[direction]
  return b + db < Math.floor((a + da) / 2)
}

// 8.1: whether the plane can fly off the board through the south edge. That takes the last movement point at most.
export function canLeaveSouth(plane: PlaneInstance, allPlanes: Board['planes'], altitude = altitudeOf(plane)): boolean {
  const occupied = occupiedAt(allPlanes, altitude)
  const maxSteps = maxSpeedAt(plane, altitude) - 1
  const turnDist = planeStats(plane).zwrotnosc
  const dir = plane.direction
  // The hexes passed, the starting one included.
  const walk = (from: string, direction: number, steps: number): string[] => {
    const hexes = [from]
    for (let s = 0; s < steps; s++) {
      const next = hexStep(hexes[s], direction)
      if (!next || occupied.includes(next)) break
      hexes.push(next)
    }
    return hexes
  }
  return walk(plane.at, dir, maxSteps).some((hex, steps) =>
    crossesSouthEdge(hex, dir) || (steps >= turnDist && [dir + 5, dir + 1].some(turned =>
      walk(hex, turned % 6, maxSteps - steps).some(it => crossesSouthEdge(it, turned % 6))
    ))
  )
}

// Returns {hexId: flight} for all valid destinations.
// Prefers straight path over turning for tie-breaking on direction.
// The range depends on the altitude the plane will end its move at.
// 4.1.1: hexes occupied at that altitude can neither be entered nor flown through.
export function flightsFor(plane: PlaneInstance, allPlanes: Board['planes'], altitude = altitudeOf(plane)): Record<string, Flight> {
  const maxMp = maxSpeedAt(plane, altitude)
  const minMp = planeStats(plane).predkosc_min
  const turnDist = planeStats(plane).zwrotnosc
  const dir = plane.direction
  const moves: Record<string, Flight> = {}
  const occupied = occupiedAt(allPlanes, altitude)
  const enter = (from: string | null, direction: number): string | null => {
    const next = from && hexStep(from, direction)
    return next && !occupied.includes(next) ? next : null
  }

  // Precompute straight path (index = steps taken from start)
  const straight: (string | null)[] = [plane.at]
  for (let s = 1; s <= maxMp; s++)
    straight.push(enter(straight[s - 1], dir))

  // No turn: final direction unchanged
  for (let d = minMp; d <= maxMp; d++)
    if (straight[d]) moves[straight[d]!] = {direction: dir, path: straight.slice(1, d + 1) as string[]}

  // One turn of ±60° after at least turnDist straight steps,
  // followed by at least 1 hex in the new direction
  for (const dTurn of [-1, +1]) {
    const newDir = ((dir + dTurn) + 6) % 6
    for (let s = turnDist; s < maxMp; s++) {
      if (!straight[s]) break
      let pos: string | null = straight[s]
      const path = straight.slice(1, s + 1) as string[]
      for (let r = 1; s + r <= maxMp; r++) {
        pos = enter(pos, newDir)
        if (!pos) break
        path.push(pos)
        if (s + r >= minMp && !(pos in moves))
          moves[pos] = {direction: newDir, path: [...path]}
      }
    }
  }

  return moves
}

// Returns {hexId: finalDirection} for all valid destinations.
export function movesMapFor(plane: PlaneInstance, allPlanes: Board['planes'], altitude = altitudeOf(plane)): Record<string, number> {
  const flights = flightsFor(plane, allPlanes, altitude)
  return Object.fromEntries(Object.entries(flights).map(([hex, flight]) => [hex, flight.direction]))
}

export function possibleMovesFor(plane: PlaneInstance, allPlanes: Board['planes'], altitude = altitudeOf(plane)): string[] {
  const result: string[] = []
  for (const h of Object.keys(movesMapFor(plane, allPlanes, altitude)))
    set_add(result, h)
  return result
}
