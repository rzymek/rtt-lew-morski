import {G, R_Niem, ROLES, V} from "../globals.js"
import {canLeaveSouth, flightsFor, possibleMovesFor} from "../game/hex.js"
import {ALT_HIGH, ALT_LOW, ALT_VERY_LOW, ALTITUDE_NAMES, altitudeOf, canChangeAltitude} from "../game/altitude";
import {shootersOf} from "./shooters";
import {startCombat} from "./phases";
import {changeSide, otherSide} from "../lifecycle/changeSide";
import {select_plane} from "./select_plane.js";
import {isEmpty} from "../generic/isEmpty";
import {selectedPlaneOfTheActiveSide} from "./selectedPlaneOfTheActiveSide";
import type {PlaneInstance} from "../types";

const ALTITUDE_ACTIONS: [string, number][] = [
  ["wysoko", ALT_HIGH],
  ["nisko", ALT_LOW],
  ["bardzo_nisko", ALT_VERY_LOW],
]

function selectAltitude(altitude: number) {
  const plane = selectedPlaneOfTheActiveSide();
  if (!plane || !canChangeAltitude(plane, altitude)) return
  if (altitude === altitudeOf(plane)) {
    delete G.selected_altitude
  } else {
    G.selected_altitude = altitude
  }
}

// 8.1
function canLeaveBoard(plane: PlaneInstance): boolean {
  return G.active === R_Niem && canLeaveSouth(plane, G.board.planes, G.selected_altitude)
}

export const movePlanes = {
  inactive: "faza ruchu samolotów",

  prompt() {
    const selected = selectedPlaneOfTheActiveSide();
    if (selected !== undefined) {
      const altitude = G.selected_altitude ?? altitudeOf(selected)
      prompt(`faza ruchu samolotów ${ROLES[G.active]} – koniec ruchu na wysokości: ${ALTITUDE_NAMES[altitude]}`)
      for (const [verb, level] of ALTITUDE_ACTIONS) {
        button(verb, level !== altitude && canChangeAltitude(selected, level))
      }
      if (canLeaveBoard(selected)) button("leave_board")
    } else {
      prompt(`faza ruchu samolotów ${ROLES[G.active]}`)
    }
    button("done", (V!.unmoved ?? []).length === 0)
    if (selected !== undefined) {
      for (const hex of possibleMovesFor(selected, G.board.planes, G.selected_altitude)) {
        action("move_hex", hex)
      }
      action("select_plane", G.selected_plane)
    } else {
      const moved = G.moved ?? []
      G.board.planes[G.active].forEach((plane) => {
        if (!plane.destroyed && !set_has(moved, plane.id)) {
          action("select_plane", plane.id)
        }
      })
    }
  },

  done() {
    G.moved = []
    delete G.selected_plane
    if (!isEmpty(shootersOf(otherSide(G.active)))) {
      changeSide();
      return goto("moved_into_firelane");
    }
    startCombat()
  },

  select_plane,

  wysoko() {
    selectAltitude(ALT_HIGH)
  },

  nisko() {
    selectAltitude(ALT_LOW)
  },

  bardzo_nisko() {
    selectAltitude(ALT_VERY_LOW)
  },

  // 8.1: the plane does not come back. It is out of the game, but the enemy gets no points for it.
  leave_board() {
    const plane = selectedPlaneOfTheActiveSide();
    if (!plane || !canLeaveBoard(plane)) return
    push_undo()
    plane.destroyed = true
    plane.left_board = true
    delete G.selected_plane
    delete G.selected_altitude
    log(`${ROLES[G.active]}: ${plane.plane.nazwa} opuszcza planszę`)
  },

  move_hex(target: string) {
    if (G.selected_plane === undefined) return
    const plane = selectedPlaneOfTheActiveSide();
    const flights = flightsFor(plane!, G.board.planes, G.selected_altitude)
    if (!(target in flights)) return
    push_undo()
    plane!.at = target
    plane!.direction = flights[target].direction
    plane!.altitude = G.selected_altitude ?? altitudeOf(plane!)
    G.flown_over ??= {}
    G.flown_over[plane!.id] = flights[target].path
    if (!G.moved) G.moved = []
    set_add(G.moved, G.selected_plane)
    delete G.selected_plane
    delete G.selected_altitude
  },
};
