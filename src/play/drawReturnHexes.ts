import {returnHexesLayer} from "./refs/returnHexesLayer";
import {getHexCenterInSVGCoords} from "./svg/getHexCenterInSVGCoords";
import {svgNS} from "@rzymek/rally-the-troops-module/client";

const RADIUS = 6
// Both sides may wait for the same hex: their badges stand side by side.
const SIDE_OFFSET = 6
const SIDE_COLORS = ['#444444', '#1f5fbf']

// 4.3.1: where the planes off the board may come back, and in how many stages.
export function drawReturnHexes() {
  returnHexesLayer.innerHTML = ""
  const soonest = new Map<string, number>()
  for (const {side, hexes, return_stage} of view.off_board ?? []) {
    // A plane with no free hex keeps waiting after its stage has passed.
    const stages = Math.max(0, return_stage - (view.stage ?? 0))
    for (const hex of hexes) {
      const key = `${side}:${hex}`
      soonest.set(key, Math.min(stages, soonest.get(key) ?? stages))
    }
  }
  for (const [key, stages] of soonest) {
    const [side, hex] = key.split(':')
    const isShared = soonest.has(`${1 - Number(side)}:${hex}`)
    drawBadge(hex, Number(side), stages, isShared)
  }
}

function drawBadge(hex: string, side: number, stages: number, isShared: boolean) {
  const center = getHexCenterInSVGCoords(hex)
  const x = center.x + (isShared ? (side === 0 ? -SIDE_OFFSET : SIDE_OFFSET) : 0)

  const circle = document.createElementNS(svgNS, 'circle')
  circle.setAttribute('cx', String(x))
  circle.setAttribute('cy', String(center.y))
  circle.setAttribute('r', String(RADIUS))
  circle.setAttribute('fill', SIDE_COLORS[side])
  circle.setAttribute('stroke', 'white')
  returnHexesLayer.appendChild(circle)

  const label = document.createElementNS(svgNS, 'text')
  label.setAttribute('x', String(x))
  label.setAttribute('y', String(center.y))
  label.setAttribute('fill', 'white')
  label.setAttribute('font-size', '9')
  label.setAttribute('font-weight', 'bold')
  label.setAttribute('text-anchor', 'middle')
  label.setAttribute('dominant-baseline', 'central')
  label.textContent = String(stages)
  returnHexesLayer.appendChild(label)
}
