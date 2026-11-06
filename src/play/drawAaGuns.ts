import {aaGunsLayer} from "./refs/aaGunsLayer";
import {clickableAaGunsLayer} from "./refs/clickableAaGunsLayer";
import {getHexCenterInSVGCoords} from "./svg/getHexCenterInSVGCoords";
import {svgNS} from "@rzymek/rally-the-troops-module/client";

const MARKER_WIDTH = 12
const MARKER_HEIGHT = MARKER_WIDTH * 77 / 88
const RING_PADDING = 1.5

// In the corner of the hex, not to cover a plane above the gun.
export function drawAaGuns() {
  aaGunsLayer.innerHTML = ""
  clickableAaGunsLayer.innerHTML = ""
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
      ring.setAttribute('x', String(x - RING_PADDING))
      ring.setAttribute('y', String(y - RING_PADDING))
      ring.setAttribute('width', String(MARKER_WIDTH + 2 * RING_PADDING))
      ring.setAttribute('height', String(MARKER_HEIGHT + 2 * RING_PADDING))
      ring.setAttribute('fill', 'none')
      ring.setAttribute('stroke', isSelected ? 'blue' : 'red')
      ring.setAttribute('stroke-width', '1.5')
      ring.style.pointerEvents = 'none'
      // A gun ready to fire pulses, not to be missed in the corner of a hex.
      if (!isSelected) {
        const pulse = document.createElementNS(svgNS, 'animate')
        pulse.setAttribute('attributeName', 'opacity')
        pulse.setAttribute('values', '1;0.2;1')
        pulse.setAttribute('dur', '1.2s')
        pulse.setAttribute('repeatCount', 'indefinite')
        ring.appendChild(pulse)
      }
      clickableAaGunsLayer.appendChild(ring)
      marker.style.cursor = 'pointer'
      marker.addEventListener('click', e => {
        e.stopPropagation()
        send_action("select_gun", hex)
      })
      clickableAaGunsLayer.appendChild(marker)
    } else {
      marker.style.pointerEvents = 'none'
      aaGunsLayer.appendChild(marker)
    }
  }
}
