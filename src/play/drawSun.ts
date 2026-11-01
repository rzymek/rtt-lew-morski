import {sunLayer} from "./refs/sunLayer";
import {getHexCenterInSVGCoords} from "./svg/getHexCenterInSVGCoords";
import {svgNS} from "@rzymek/rally-the-troops-module/client";

const THICKNESS = 8
const HEX_SIZE = 24

// 2.3, 5.0.1: the shield along the outer side of the edge hexes, kept within the map.
export function drawSun() {
  sunLayer.innerHTML = ""
  if (!view.sun || !view.sun_hexes) return
  const centers = view.sun_hexes.map(getHexCenterInSVGCoords)
  const xs = centers.map(it => it.x)
  const ys = centers.map(it => it.y)
  const {width, height} = document.querySelector<SVGSVGElement>('#mapwrap svg')!.viewBox.baseVal
  const vertical = view.sun !== 'S'
  const length = (vertical ? Math.max(...ys) - Math.min(...ys) : Math.max(...xs) - Math.min(...xs)) + HEX_SIZE
  const middle = (values: number[]) => (Math.min(...values) + Math.max(...values)) / 2
  const cx = view.sun === 'W' ? Math.max(THICKNESS / 2, xs[0] - HEX_SIZE / 2)
    : view.sun === 'E' ? Math.min(width - THICKNESS / 2, xs[0] + HEX_SIZE / 2)
      : middle(xs)
  const cy = view.sun === 'S' ? Math.min(height - THICKNESS / 2, Math.max(...ys) + HEX_SIZE / 2) : middle(ys)

  const shield = document.createElementNS(svgNS, 'image')
  shield.setAttribute('href', './images/sun1.jpg')
  shield.setAttribute('preserveAspectRatio', 'none')
  shield.setAttribute('x', String(cx - length / 2))
  shield.setAttribute('y', String(cy - THICKNESS / 2))
  shield.setAttribute('width', String(length))
  shield.setAttribute('height', String(THICKNESS))
  if (vertical) shield.setAttribute('transform', `rotate(90, ${cx}, ${cy})`)
  sunLayer.appendChild(shield)
}
