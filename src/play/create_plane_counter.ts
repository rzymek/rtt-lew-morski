import {ViewPlaneInstance} from "./viewPlaneInstance";
import {getHexCenterInSVGCoords} from "./svg/getHexCenterInSVGCoords";
import {planePlaceholder} from "./refs/planePlaceholder";
import {NS_XLINK} from "./svg/svgNS";
import jammedSvg from "./markers/jammed.svg?raw";

export function createPlaneCounter(plane: ViewPlaneInstance) {
  const center = getHexCenterInSVGCoords(plane.at)
  const imgSrc = `./${plane.plane.img}${plane.damaged ? '_' : ''}.jpg`
  const imgW = parseFloat(planePlaceholder!.getAttribute('width')!)
  const imgH = parseFloat(planePlaceholder!.getAttribute('height')!)

  const counter = planePlaceholder!.cloneNode(false) as SVGImageElement
  counter.removeAttribute('id')
  counter.setAttributeNS(NS_XLINK, 'xlink:href', imgSrc)
  counter.setAttribute('href', imgSrc)
  counter.setAttribute('x', String(center.x - imgW / 2))
  counter.setAttribute('y', String(center.y - imgH / 2))
  counter.setAttribute('transform', `rotate(${plane.direction * 60}, ${center.x}, ${center.y})`)

  if(plane.jammed) {
    // TODO: mark with jammedSvg
  }
  return counter;
}