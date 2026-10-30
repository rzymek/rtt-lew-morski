import {ViewPlaneInstance} from "./viewPlaneInstance";
import {getHexCenterInSVGCoords} from "./svg/getHexCenterInSVGCoords";
import {planePlaceholder} from "./refs/planePlaceholder";
import {NS_XLINK, svgNS} from "./svg/svgNS";
import jammedSvg from "./markers/jammed.svg?raw";
import {createSvgMarkerAt} from "./svg/createSvgMarkerAt";

// Indexed by altitude; planes flying high carry no marker.
const ALTITUDE_MARKERS = [undefined, './images/m_L.jpg', './images/m_VL.jpg']
const ALTITUDE_MARKER_ASPECT = 14 / 80

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

  const altitudeMarker = ALTITUDE_MARKERS[plane.altitude ?? 0]
  if (altitudeMarker) {
    const markerH = imgW * ALTITUDE_MARKER_ASPECT
    const marker = document.createElementNS(svgNS, 'image')
    marker.setAttribute('href', altitudeMarker)
    marker.setAttribute('x', String(center.x - imgW / 2))
    marker.setAttribute('y', String(center.y + imgH / 2 - markerH))
    marker.setAttribute('width', String(imgW))
    marker.setAttribute('height', String(markerH))
    marker.setAttribute('transform', rotation)
    marker.style.pointerEvents = 'none'
    group.appendChild(marker)
  }

  if (plane.jammed) {
    group.appendChild(createSvgMarkerAt(center, jammedSvg))
  }

  // 2.2: the series of bombs still on board, instead of the plane card.
  const bombs = (plane.plane.udzwig_bomb ?? 0) - (plane.bombs_dropped ?? 0)
  if (bombs > 0) {
    const badge = document.createElementNS(svgNS, 'text')
    badge.textContent = `💣${bombs}`
    badge.setAttribute('x', String(center.x + imgW / 2))
    badge.setAttribute('y', String(center.y - imgH / 2))
    badge.setAttribute('font-size', '6')
    badge.setAttribute('text-anchor', 'end')
    badge.setAttribute('dominant-baseline', 'hanging')
    badge.setAttribute('fill', 'white')
    badge.setAttribute('stroke', 'black')
    badge.setAttribute('stroke-width', '0.3')
    badge.style.pointerEvents = 'none'
    group.appendChild(badge)
  }

  return group;
}