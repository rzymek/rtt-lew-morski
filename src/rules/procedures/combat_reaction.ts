import {G, P, ROLES, R_Niem, R_Bryt} from "../globals.js"
import {firstOnFireLine, resolveShot} from "../game/combat.js"

export const combatReaction = {
  inactive: "faza reakcji",

  _begin() {
    G.shot = []
  },

  prompt() {
    const initiativeSide = G.active === R_Niem ? R_Bryt : R_Niem
    const myPlanes = G.board.planes[G.active as number] ?? []
    const shot = G.shot ?? []

    prompt("Faza walki – reakcja: " + ROLES[G.active as number])
    button("done", true)

    // Only planes that have an initiative-side target on their fire line may react
    myPlanes.forEach((plane, idx) => {
      if (!plane || plane.destroyed || plane.jammed) return
      if (set_has(shot, idx)) return
      const target = firstOnFireLine(plane, G.board.planes)
      if (target && target.side === initiativeSide)
        action("select_plane", idx)
    })
    // Also allow deselect of current selection
    if (G.selected_plane !== undefined)
      action("select_plane", G.selected_plane)

    if (G.selected_plane !== undefined) {
      const idx = G.selected_plane
      const plane = myPlanes[idx]
      if (plane && !set_has(shot, idx) && !plane.destroyed && !plane.jammed) {
        const target = firstOnFireLine(plane, G.board.planes)
        if (target && target.side === initiativeSide)
          button("attack", true)
      }
    }
  },

  select_plane(idx: number) {
    if (G.selected_plane === idx) delete G.selected_plane
    else G.selected_plane = idx
  },

  attack() {
    const idx = G.selected_plane
    if (idx === undefined) return
    const myPlanes = G.board.planes[G.active as number] ?? []
    const plane = myPlanes[idx]
    if (!plane || plane.jammed || plane.destroyed) return
    const initiativeSide = G.active === R_Niem ? R_Bryt : R_Niem
    const hit = firstOnFireLine(plane, G.board.planes)
    if (!hit || hit.side !== initiativeSide) return

    push_undo()
    set_add(G.shot!, idx)
    const targetPlane = G.board.planes[hit.side][hit.idx]
    const {roll, atk, result} = resolveShot(plane, targetPlane!, hit.distance)
    log(`${ROLES[G.active as number]} reaguje [SA:${atk} odl:${hit.distance} rzut:${roll}] → ${result}`)
    delete G.selected_plane
  },

  done() {
    delete G.selected_plane
    goto("move_planes")
  },
};
