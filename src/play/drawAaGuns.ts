import {aaGunsLayer} from "./refs/aaGunsLayer";
import {getHexCenterInSVGCoords} from "./svg/getHexCenterInSVGCoords";
import {svgNS} from "./svg/svgNS";

const MARKER_WIDTH = 12
const MARKER_HEIGHT = MARKER_WIDTH * 77 / 88

// In the corner of the hex, not to cover a plane above the gun.
export function drawAaGuns() {
  aaGunsLayer.innerHTML = ""
  for (const hex of view.aa_guns ?? []) {
    const center = getHexCenterInSVGCoords(hex)
    const x = center.x + 1, y = center.y + 1
    const marker = document.createElementNS(svgNS, 'image')
    marker.setAttribute('href', './images/m_antia.png')
    marker.setAttribute('x', String(x))
    marker.setAttribute('y', String(y))
    marker.setAttribute('width', String(MARKER_WIDTH))
    marker.setAttribute('height', String(MARKER_HEIGHT))
    if (view.aa_fired?.includes(hex)) marker.setAttribute('opacity', '0.55')

    const isSelected = hex === view.selected_gun
    const isSelectable = view.actions?.select_gun?.includes(hex)
    if (isSelected || isSelectable) {
      const ring = document.createElementNS(svgNS, 'rect')
      ring.setAttribute('x', String(x))
      ring.setAttribute('y', String(y))
      ring.setAttribute('width', String(MARKER_WIDTH))
      ring.setAttribute('height', String(MARKER_HEIGHT))
      ring.setAttribute('fill', 'none')
      ring.setAttribute('stroke', isSelected ? 'blue' : 'red')
      ring.style.pointerEvents = 'none'
      aaGunsLayer.appendChild(ring)
      marker.style.cursor = 'pointer'
      marker.addEventListener('click', e => {
        e.stopPropagation()
        send_action("select_gun", hex)
      })
    } else {
      marker.style.pointerEvents = 'none'
    }
    aaGunsLayer.appendChild(marker)
  }
}
