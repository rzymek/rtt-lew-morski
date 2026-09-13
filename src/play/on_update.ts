import {planeBorder} from "./planeBorder";
import {clearHexHighlights, highlightHexes} from "./highlightHexes";
import {hexOverlay} from "./refs/hexOverlay";
import {createPlaneCounter} from "./createPlaneCounter";
import "./rtt.d.ts";

export function onUpdate() {
  action_button("undo", "Undo")
  action_button("done", "Done")

  document.querySelectorAll('#hexes .action').forEach(el => el.classList.remove('action'))

  view.actions?.move_hex
    ?.map(id => document.getElementById(id))
    ?.forEach(el => el?.classList.remove('action'))

  hexOverlay!.innerHTML = ""

  if (view.unmoved) {
    const activePlanes = view.board.planes[view.active_side] ?? []
    for (const id of view.unmoved) {
      const plane = activePlanes.find(it => it.id === id)
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

  clearHexHighlights();
  highlightHexes(view.actions?.move_hex, '#8080ff');
  highlightHexes(view.fire_line, '#ff4444');

  // Draw planes
  const unitsLayer = document.getElementById("units")!
  unitsLayer.innerHTML = ""

  Object.entries(view.board.planes).forEach(([roleStr, planes]) => {
    const roleIdx = parseInt(roleStr)
    const isActiveSide = roleIdx === view.active_side

    planes.forEach((plane, idx) => {
      if (!plane || plane.destroyed) return
      if (!document.getElementById(plane.at)) return
      const counter = createPlaneCounter(plane);

      // Dim planes that have already shot this phase
      const hasShot = view.shot?.includes(idx)
      if (isActiveSide && hasShot && !plane.damaged)
        counter.setAttribute('opacity', '0.55')

      if (isActiveSide && view.actions?.select_plane?.includes(plane.id)) {
        counter.style.cursor = 'pointer'
        counter.addEventListener('click', e => {
          e.stopPropagation()
          send_action("select_plane", plane.id)
        })
      }

      unitsLayer.appendChild(counter)
    })
  })
}