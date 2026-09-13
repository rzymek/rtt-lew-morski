import {action_button, send_action, view} from "./rtt";
import {planeBorder} from "./planeBorder";
import {highlightHexes} from "./highlightHexes";
import {getHexCenterInSVGCoords} from "./svg/getHexCenterInSVGCoords";
import {NS_XLINK, svgNS} from "./svg/svgNS";
import {hexOverlay} from "./refs/hexOverlay";
import {planePlaceholder} from "./refs/planePlaceholder";

export function onUpdate() {
  action_button("undo", "Undo")
  action_button("done", "Done")
  if (view.actions?.attack !== undefined)
    action_button("attack", "Atakuj!")
  if (view.actions?.unjam !== undefined)
    action_button("unjam", "Odblokuj karabiny")

  document.querySelectorAll('#hexes use.action').forEach(el => el.classList.remove('action'))
  if (view.actions?.move_hex) {
    for (const id of view.actions.move_hex) {
      const el = document.getElementById(id)
      if (el) el.classList.add('action')
    }
  }

  hexOverlay!.innerHTML = ""

  if (view.unmoved) {
    const activePlanes = view.board.planes[view.active_side] ?? []
    for (const idx of view.unmoved) {
      const plane = activePlanes[idx]
      if (!plane || !document.getElementById(plane.at)) continue
      const rect = planeBorder(plane, 'yellow');
      hexOverlay!.appendChild(rect)
    }
  }

  if (view.selected_at) {
    const selectedPlane = Object.values(view.board.planes).flat().find(p => p?.at === view.selected_at)
    if (selectedPlane) {
      const rect = planeBorder(selectedPlane, 'blue');
      hexOverlay!.append(rect)
    }
  }

  highlightHexes(view.actions?.move_hex, '#8080ff');
  highlightHexes(view.fire_line, '#ff4444');

  // Draw planes
  const unitsLayer = document.getElementById("units")!
  unitsLayer.innerHTML = ""

  const imgW = parseFloat(planePlaceholder!.getAttribute('width')!)
  const imgH = parseFloat(planePlaceholder!.getAttribute('height')!)

  Object.entries(view.board.planes).forEach(([roleStr, planes]) => {
    const roleIdx = parseInt(roleStr)
    const isActiveSide = roleIdx === view.active_side

    planes.forEach((plane, idx) => {
      if (!plane || plane.destroyed) return
      if (!document.getElementById(plane.at)) return

      const center = getHexCenterInSVGCoords(plane.at)
      const imgSrc = `./${plane.plane.img}.jpg`

      const clone = planePlaceholder!.cloneNode(false) as SVGImageElement
      clone.removeAttribute('id')
      clone.setAttributeNS(NS_XLINK, 'xlink:href', imgSrc)
      clone.setAttribute('href', imgSrc)
      clone.setAttribute('x', String(center.x - imgW / 2))
      clone.setAttribute('y', String(center.y - imgH / 2))
      clone.setAttribute('transform', `rotate(${plane.direction * 60}, ${center.x}, ${center.y})`)

      // Dim planes that have already shot this phase
      const hasShot = view.shot?.includes(idx)
      if (isActiveSide && hasShot && !plane.damaged)
        clone.setAttribute('opacity', '0.55')

      if (isActiveSide && view.actions?.select_plane?.includes(idx)) {
        clone.style.cursor = 'pointer'
        clone.addEventListener('click', e => {
          e.stopPropagation()
          send_action("select_plane", idx)
        })
      }

      unitsLayer.appendChild(clone)

      // Damage overlay: red X drawn on top of the image
      if (plane.damaged) {
        const sz = Math.min(imgW, imgH) * 0.55
        const x1 = center.x - sz / 2, y1 = center.y - sz / 2
        const x2 = center.x + sz / 2, y2 = center.y + sz / 2
        for (const [ax, ay, bx, by] of [[x1, y1, x2, y2], [x2, y1, x1, y2]]) {
          const line = document.createElementNS(svgNS, 'line')
          line.setAttribute('x1', String(ax));
          line.setAttribute('y1', String(ay))
          line.setAttribute('x2', String(bx));
          line.setAttribute('y2', String(by))
          line.setAttribute('stroke', '#cc0000')
          line.setAttribute('stroke-width', '2.5')
          line.setAttribute('stroke-linecap', 'round')
          line.style.pointerEvents = 'none'
          unitsLayer.appendChild(line)
        }
      }

      // Gun-jam badge
      if (plane.jammed) {
        const badge = document.createElementNS(svgNS, 'rect')
        badge.setAttribute('x', String(center.x - 9))
        badge.setAttribute('y', String(center.y - imgH / 2 - 1))
        badge.setAttribute('width', '18')
        badge.setAttribute('height', '9')
        badge.setAttribute('rx', '2')
        badge.setAttribute('fill', '#cc6600')
        badge.style.pointerEvents = 'none'
        unitsLayer.appendChild(badge)
        const label = document.createElementNS(svgNS, 'text')
        label.setAttribute('x', String(center.x))
        label.setAttribute('y', String(center.y - imgH / 2 + 7))
        label.setAttribute('text-anchor', 'middle')
        label.setAttribute('font-size', '6')
        label.setAttribute('font-family', 'sans-serif')
        label.setAttribute('fill', '#fff')
        label.style.pointerEvents = 'none'
        label.textContent = 'JAM'
        unitsLayer.appendChild(label)
      }
    })
  })
}