import {planeBorder} from "./planeBorder";
import {hexOverlay} from "./refs/hexOverlay";
import {expandedStackLayer} from "./refs/expandedStackLayer";
import {planePlaceholder} from "./refs/planePlaceholder";
import {createPlaneCounter} from "./createPlaneCounter";
import {getHexCenterInSVGCoords} from "./svg/getHexCenterInSVGCoords";
import {svgNS} from "./svg/svgNS";
import {ViewPlaneInstance} from "./viewPlaneInstance";

let expandedHex: string | undefined

export function collapseStack() {
  if (expandedHex === undefined) return
  expandedHex = undefined
  drawPlanes()
}

// Lays the planes out in a column around their hex, kept within the map. Draws the backdrop.
function expandStack(planes: ViewPlaneInstance[]): Map<string, DOMPoint> {
  const center = getHexCenterInSVGCoords(planes[0].at)
  // Enough room for the counters not to overlap, whatever their rotation.
  const spacing = Math.hypot(
    parseFloat(planePlaceholder.getAttribute('width')!),
    parseFloat(planePlaceholder.getAttribute('height')!),
  )
  const height = spacing * planes.length
  const mapHeight = document.querySelector<SVGSVGElement>('#mapwrap svg')!.viewBox.baseVal.height
  const top = Math.max(0, Math.min(center.y - height / 2, mapHeight - height))

  const backdrop = document.createElementNS(svgNS, 'rect')
  backdrop.setAttribute('x', String(center.x - spacing / 2))
  backdrop.setAttribute('y', String(top))
  backdrop.setAttribute('width', String(spacing))
  backdrop.setAttribute('height', String(height))
  backdrop.setAttribute('rx', '4')
  backdrop.setAttribute('fill', 'black')
  backdrop.setAttribute('fill-opacity', '0.5')
  expandedStackLayer.appendChild(backdrop)

  return new Map(planes.map((plane, i) => [plane.id, new DOMPoint(center.x, top + spacing * (i + 0.5))]))
}

export function drawPlanes() {
  const unitsLayer = document.getElementById("units")!
  unitsLayer.innerHTML = ""
  hexOverlay.innerHTML = ""
  expandedStackLayer.innerHTML = ""

  const planes = Object.entries(view.board.planes)
    .flatMap(([roleStr, planes]) => planes
      .filter(plane => plane && !plane.destroyed && document.getElementById(plane.at))
      .map(plane => ({plane, isActiveSide: parseInt(roleStr) === view.active_side})))
    // Higher value = flying lower, so the lowest planes are drawn first and end up covered.
    .sort((a, b) => (b.plane.altitude ?? 0) - (a.plane.altitude ?? 0))

  const planesAt = (hex: string) => planes.map(it => it.plane).filter(plane => plane.at === hex)

  const expanded = expandedHex === undefined ? [] : planesAt(expandedHex)
  if (expanded.length < 2) expandedHex = undefined
  // Reversed, so the highest plane is at the top of the column.
  const expandedCenters = expandedHex === undefined ? new Map<string, DOMPoint>() : expandStack(expanded.reverse())

  const addBorder = (plane: ViewPlaneInstance, color: string) => {
    const center = expandedCenters.get(plane.id)
    const layer = center ? expandedStackLayer : hexOverlay
    layer.appendChild(planeBorder(plane, color, center))
  }

  for (const {plane} of planes) {
    if (view.unmoved?.includes(plane.id)) addBorder(plane, 'yellow')
  }
  for (const {plane} of planes) {
    if (plane.id === view.selected_plane) addBorder(plane, 'blue')
  }

  for (const {plane, isActiveSide} of planes) {
    const center = expandedCenters.get(plane.id)
    const counter = createPlaneCounter(plane, center);

    // Dim planes that have already shot this phase
    const hasShot = view.shot?.includes(plane.id)
    if (isActiveSide && hasShot && !plane.damaged) {
      counter.setAttribute('opacity', '0.55')
    }

    const isSelectable = view.actions?.select_plane?.includes(plane.id)
    if (isSelectable) addBorder(plane, 'red')

    if (!center && planesAt(plane.at).length > 1) {
      if (view.actions?.move_hex?.includes(plane.at)) {
        // Let clicks through to the hex underneath
        counter.style.pointerEvents = 'none'
      } else {
        counter.style.cursor = 'pointer'
        counter.addEventListener('click', e => {
          e.stopPropagation()
          expandedHex = plane.at
          drawPlanes()
        })
      }
    } else if (isSelectable) {
      counter.style.cursor = 'pointer'
      counter.addEventListener('click', e => {
        e.stopPropagation()
        expandedHex = undefined
        send_action("select_plane", plane.id)
      })
    } else if (!center) {
      // Let clicks through to the hex underneath
      counter.style.pointerEvents = 'none'
    }

    if (center) {
      expandedStackLayer.appendChild(counter)
    } else {
      unitsLayer.appendChild(counter)
    }
  }
}
