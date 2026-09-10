import {G, V, P} from "../globals.js"
import {movesMapFor, possibleMovesFor} from "../game/hex.js"

export const movePlanes = {
  inactive: "faza ruchu samolotów",

  prompt() {
    prompt("faza ruchu samolotów")
    button("done", (V!.unmoved as number[]).length === 0)
    if (G.selected_plane !== undefined) {
      const plane = G.board.planes[G.active as number][G.selected_plane]
      for (const hex of possibleMovesFor(plane!)) {
        action("move_hex", hex)
      }
      action("select_plane", G.selected_plane)
    } else {
      const moved = G.moved ?? []
      G.board.planes[G.active as number].forEach((_, idx) => {
        if (!set_has(moved, idx))
          action("select_plane", idx)
      })
    }
  },

  done() {
    G.moved = []
    delete G.selected_plane
    goto("combat_initiative")
  },

  select_plane(planeIdx: number) {
    if (G.selected_plane === planeIdx) {
      delete G.selected_plane
    } else {
      G.selected_plane = planeIdx
    }
  },

  move_hex(target: string) {
    if (G.selected_plane === undefined) return
    const plane = G.board.planes[G.active as number][G.selected_plane]
    const moves = movesMapFor(plane!)
    if (!(target in moves)) return
    push_undo()
    plane!.at = target
    plane!.direction = moves[target]
    if (!G.moved) G.moved = []
    set_add(G.moved, G.selected_plane)
    delete G.selected_plane
  },
};
