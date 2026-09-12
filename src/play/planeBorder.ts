import {ViewPlaneInstance} from "./viewPlaneInstance";
import {getHexCenterInSVGCoords} from "./svg/getHexCenterInSVGCoords";
import {svgNS} from "./svg/svgNS";

export function planeBorder(selectedPlane: ViewPlaneInstance, color: string, planePlaceholder: SVGImageElement) {
  const center = getHexCenterInSVGCoords(selectedPlane.at)
  const w = parseFloat(planePlaceholder.getAttribute('width')!) + 2
  const h = parseFloat(planePlaceholder.getAttribute('height')!) + 2
  const r = document.createElementNS(svgNS, 'rect')
  r.setAttribute('x', String(center.x - w / 2))
  r.setAttribute('y', String(center.y - h / 2))
  r.setAttribute('width', String(w))
  r.setAttribute('height', String(h))
  r.setAttribute('fill', 'none')
  r.setAttribute('stroke', color)
  r.setAttribute('stroke-width', '2')
  if (selectedPlane)
    r.setAttribute('transform', `rotate(${selectedPlane.direction * 60}, ${center.x}, ${center.y})`)
  r.style.pointerEvents = 'none'
  return r
}