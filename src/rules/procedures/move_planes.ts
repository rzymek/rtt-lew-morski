import {G, ROLES, V} from "../globals.js"
import {movesMapFor, possibleMovesFor} from "../game/hex.js"
import {ALT_HIGH, ALT_LOW, ALT_VERY_LOW, ALTITUDE_NAMES, altitudeOf, canChangeAltitude} from "../game/altitude";
import {planesInFirelane} from "./planesInFirelane";
import {changeSide, otherSide} from "../lifecycle/changeSide";
import {select_plane} from "./select_plane.js";
import {isEmpty} from "../generic/isEmpty";
import {selectedPlaneOfTheActiveSide} from "./selectedPlaneOfTheActiveSide";

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
    } else {
      prompt(`faza ruchu samolotów ${ROLES[G.active]}`)
    }
    button("done", (V!.unmoved ?? []).length === 0)
    if (selected !== undefined) {
      for (const hex of possibleMovesFor(selected, G.selected_altitude)) {
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

  wysoko() {
    selectAltitude(ALT_HIGH)
  },

  nisko() {
    selectAltitude(ALT_LOW)
  },

  bardzo_nisko() {
    selectAltitude(ALT_VERY_LOW)
  },

  move_hex(target: string) {
    if (G.selected_plane === undefined) return
    const plane = selectedPlaneOfTheActiveSide();
    const moves = movesMapFor(plane!, G.selected_altitude)
    if (!(target in moves)) return
    push_undo()
    plane!.at = target
    plane!.direction = moves[target]
    plane!.altitude = G.selected_altitude ?? altitudeOf(plane!)
    if (!G.moved) G.moved = []
    set_add(G.moved, G.selected_plane)
    delete G.selected_plane
    delete G.selected_altitude
  },
};
