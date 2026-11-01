import {ViewPlaneInstance} from "../shared/view";
import {getHexCenterInSVGCoords} from "./svg/getHexCenterInSVGCoords";
import {planePlaceholder} from "./refs/planePlaceholder";
import {NS_XLINK, svgNS} from "@rzymek/rally-the-troops-module/client";
import jammedSvg from "./markers/jammed.svg?raw";
import {createSvgMarkerAt} from "@rzymek/rally-the-troops-module/client";

// Counter artwork size; the overlays below are drawn in its pixels.
const ART_SIZE = 80
const DAMAGED_BACKGROUND = '#a0a0a0'

// Indexed by altitude; planes flying high carry no tab.
const ALTITUDE_TABS = [
  undefined,
  {fill: '#1ad6b4', chevrons: [[83, 5]]},
  {fill: '#2f9e44', chevrons: [[81.5, 4.2], [86.8, 4.2]]},
]

// A tab outside the counter's rear edge, so that it covers none of the printed stats.
function altitudeTab(altitude: number): string {
  const tab = ALTITUDE_TABS[altitude]
  if (!tab) return ''
  const chevrons = tab.chevrons.map(([y, h]) => `M35 ${y}L40 ${y + h}L45 ${y}`).join('')
  return `<path d="M26 80h28l-6 13h-16z" fill="${tab.fill}" stroke="black"/>
    <path d="${chevrons}" fill="none" stroke="black" stroke-width="2.1"/>`
}

// 2.2: replaces the bomb load printed on the counter with the series of bombs still on board.
function bombsLeftDigit(plane: ViewPlaneInstance): string {
  if (!plane.plane.udzwig_bomb) return ''
  const bombs = plane.plane.udzwig_bomb - (plane.bombs_dropped ?? 0)
  return `<rect x="60" y="42" width="15" height="23" fill="${plane.damaged ? DAMAGED_BACKGROUND : 'white'}"/>
    <text x="67" y="61.5" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="26"
      text-anchor="middle" fill="${bombs > 0 ? '#2fb000' : '#8a8a8a'}">${bombs}</text>`
}

export function createPlaneCounter(plane: ViewPlaneInstance, center = getHexCenterInSVGCoords(plane.at)): SVGElement {
  const imgSrc = `./${plane.plane.img}${plane.damaged ? '_' : ''}.jpg`
  const imgW = parseFloat(planePlaceholder!.getAttribute('width')!)
  const imgH = parseFloat(planePlaceholder!.getAttribute('height')!)

  const counter = planePlaceholder!.cloneNode(false) as SVGImageElement
  counter.removeAttribute('id')
  counter.setAttributeNS(NS_XLINK, 'xlink:href', imgSrc)
  counter.setAttribute('href', imgSrc)
  counter.setAttribute('x', String(center.x - imgW / 2))
  counter.setAttribute('y', String(center.y - imgH / 2))
  const rotation = `rotate(${plane.direction * 60}, ${center.x}, ${center.y})`
  counter.setAttribute('transform', rotation)

  const group = document.createElementNS(svgNS, 'g')
  group.appendChild(counter)

  const overlays = document.createElementNS(svgNS, 'g')
  overlays.setAttribute('transform', `${rotation} translate(${center.x - imgW / 2}, ${center.y - imgH / 2}) scale(${imgW / ART_SIZE})`)
  overlays.style.pointerEvents = 'none'
  overlays.innerHTML = altitudeTab(plane.altitude ?? 0) + bombsLeftDigit(plane)
  group.appendChild(overlays)

  if (plane.jammed) {
    group.appendChild(createSvgMarkerAt(center, jammedSvg))
  }

  return group;
}