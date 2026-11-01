import {bombedLayer} from "./refs/bombedLayer";
import {getHexCenterInSVGCoords} from "./svg/getHexCenterInSVGCoords";
import {svgNS} from "@rzymek/rally-the-troops-module/client";

const MARKER_SIZE = 20

// 7.0.7: strategic objects that were hit.
export function drawBombed() {
  bombedLayer.innerHTML = ""
  for (const hex of view.bombed ?? []) {
    const center = getHexCenterInSVGCoords(hex)
    const marker = document.createElementNS(svgNS, 'image')
    marker.setAttribute('href', './images/m_bombarded.jpg')
    marker.setAttribute('x', String(center.x - MARKER_SIZE / 2))
    marker.setAttribute('y', String(center.y - MARKER_SIZE / 2))
    marker.setAttribute('width', String(MARKER_SIZE))
    marker.setAttribute('height', String(MARKER_SIZE))
    bombedLayer.appendChild(marker)
  }
}
