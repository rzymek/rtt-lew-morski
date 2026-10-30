import "../rtt/framework.d.ts";
import {PlaneInstance} from "../types";
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

export function hexStep(id: string, dir: number): string | null {
  const [a, b] = parseHex(id)
  if (a === null) return null
  const [da, db] = DIR_OFFSETS[dir]
  const na = a + da, nb = b + db
  if (na < 0 || nb < 0) return null
  return hexId(na, nb)
}

// Returns {hexId: finalDirection} for all valid destinations.
// Prefers straight path over turning for tie-breaking on direction.
// The range depends on the altitude the plane will end its move at.
export function movesMapFor(plane: PlaneInstance, altitude = altitudeOf(plane)): Record<string, number> {
  const maxMp = maxSpeedAt(plane, altitude)
  const minMp = planeStats(plane).predkosc_min
  const turnDist = planeStats(plane).zwrotnosc
  const dir = plane.direction
  const moves: Record<string, number> = {}

  // Precompute straight path (index = steps taken from start)
  const straight: (string | null)[] = [plane.at]
  for (let s = 1; s <= maxMp; s++)
    straight.push(hexStep(straight[s - 1]!, dir))

  // No turn: final direction unchanged
  for (let d = minMp; d <= maxMp; d++)
    if (straight[d]) moves[straight[d]!] = dir

  // One turn of ±60° after at least turnDist straight steps,
  // followed by at least 1 hex in the new direction
  for (const dTurn of [-1, +1]) {
    const newDir = ((dir + dTurn) + 6) % 6
    for (let s = turnDist; s < maxMp; s++) {
      if (!straight[s]) break
      let pos: string | null = straight[s]
      for (let r = 1; s + r <= maxMp; r++) {
        pos = hexStep(pos!, newDir)
        if (!pos) break
        if (s + r >= minMp && !(pos in moves))
          moves[pos] = newDir
      }
    }
  }

  return moves
}

export function possibleMovesFor(plane: PlaneInstance, altitude = altitudeOf(plane)): string[] {
  const result: string[] = []
  for (const h of Object.keys(movesMapFor(plane, altitude)))
    set_add(result, h)
  return result
}
