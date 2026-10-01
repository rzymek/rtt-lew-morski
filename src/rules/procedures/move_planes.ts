import {G, ROLES, V} from "../globals.js"
import {movesMapFor, possibleMovesFor} from "../game/hex.js"
import {planesInFirelane} from "./planesInFirelane";
import {changeSide, otherSide} from "../lifecycle/changeSide";
import {select_plane} from "./select_plane.js";
import {isEmpty} from "../generic/isEmpty";
import {selectedPlaneOfTheActiveSide} from "./selectedPlaneOfTheActiveSide";

export const movePlanes = {
  inactive: "faza ruchu samolotów",

  prompt() {
    prompt(`faza ruchu samolotów ${ROLES[G.active]}`)
    button("done", (V!.unmoved ?? []).length === 0)
    const selected = selectedPlaneOfTheActiveSide();
    if (selected !== undefined) {
      for (const hex of possibleMovesFor(selected)) {
        action("move_hex", hex)
      }
      action("select_plane", G.selected_plane)
    } else {
      const moved = G.moved ?? []
      G.board.planes[G.active].forEach((plane) => {
        if (!set_has(moved, plane.id)) {
          action("select_plane", plane.id)
        }
      })
    }
  },

  done() {
    G.moved = []
    delete G.selected_plane
    const friendlyPlanesInFirelanes = planesInFirelane(G.active);
    if (!isEmpty(friendlyPlanesInFirelanes)) {
      changeSide();
      return goto("moved_into_firelane");
    }
    const enemyTargets = planesInFirelane(otherSide(G.active))
    console.log({enemyTargets: enemyTargets.map(it=>it)})
    if (!isEmpty(enemyTargets)) {
      return goto("combat")
    }
    changeSide()
    goto("move_planes")
  },

  select_plane,

  move_hex(target: string) {
    if (G.selected_plane === undefined) return
    const plane = selectedPlaneOfTheActiveSide();
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
