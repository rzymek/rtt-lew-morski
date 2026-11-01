import {targetsLayer} from "./refs/targetsLayer";
import {getHexCenterInSVGCoords} from "./svg/getHexCenterInSVGCoords";
import {svgNS} from "@rzymek/rally-the-troops-module/client";

const MARKER_WIDTH = 28.222
const MARKER_HEIGHT = 34.572

// Strategic objects of the scenario.
export function drawTargets() {
  targetsLayer.innerHTML = ""
  for (const hex of view.targets ?? []) {
    const center = getHexCenterInSVGCoords(hex)
    const marker = document.createElementNS(svgNS, 'image')
    marker.setAttribute('href', './images/m_target.png')
    marker.setAttribute('x', String(center.x - MARKER_WIDTH / 2))
    marker.setAttribute('y', String(center.y - MARKER_HEIGHT / 2))
    marker.setAttribute('width', String(MARKER_WIDTH))
    marker.setAttribute('height', String(MARKER_HEIGHT))
    targetsLayer.appendChild(marker)
  }
}
