import data from "./data.js"
import "./rtt/framework.d.ts"
import type {PlaneInstance, Board, FrameState, GameState, ViewState, StateDefinition} from "./types.js"
import {movesMapFor, possibleMovesFor} from "./hex.js"
import {firstOnFireLine, resolveShot, fireLineHexes as _fireLineHexes} from "./combat.js"

/* --- GAME DATA --- */

let G!: GameState
let L!: FrameState | null
let R!: number
let V!: ViewState | null
const P: Record<string, StateDefinition | string | Array<() => void>> = {}

const ROLES = ["Niemcy", "Brytyjczycy"];

const planes = data.planes
const R_Niem = 0
const R_Bryt = 1

/* --- SETUP --- */

/** Called by the framework when creating a new game.
 * G.seed, G.log, G.undo are already initialized.
 * You must set G.active to the starting player, then call the first state.
 */
export function on_setup(_scenario: string, _options: unknown) {
  G.board = {
    planes:
      {
        [R_Bryt]: [
          {plane: planes.SpitL, at: 'A10.B08', direction: 0},
          {plane: planes.Spit, at: 'A11.B08', direction: 1},
          {plane: planes.Spit, at: 'A09.B08', direction: 2},
        ],
        [R_Niem]: [
          {plane: planes.ME110, at: 'A40.B35', direction: 4},
          {plane: planes.ME110, at: 'A40.B36', direction: 4},

          {plane: planes.HE111, at: 'A41.B35', direction: 4},
          {plane: planes.HE111, at: 'A42.B35', direction: 4},
          {plane: planes.HE111, at: 'A39.B35', direction: 4},
          {plane: planes.HE111, at: 'A38.B35', direction: 4},
        ]
      }
  }
  G.targets = [
    'A06.B19', 'A16.B24',
  ]
  G.moved = []
  G.active = R_Niem
  call("move_planes")
}

/* --- VIEW --- */

// Called by the framework to build the view object for each player.
// V.log, V.prompt, V.actions are managed by the framework.
// Put everything the client needs to render the board here.
// IMPORTANT: never mutate G here!
export function on_view() {
  V!.board = G.board
  V!.active_side = G.active as number
  if (R === G.active) {
    if (L!.P === 'move_planes') {
      const moved = G.moved ?? []
      V!.unmoved = G.board.planes[G.active as number]
        .map((_, idx) => idx)
        .filter(idx => !set_has(moved, idx))
    }
    if (L!.P === 'combat_initiative' || L!.P === 'combat_reaction') {
      V!.shot = G.shot ?? []
    }
    if (G.selected_plane !== undefined) {
      const plane = G.board.planes[G.active as number][G.selected_plane]
      if (plane) {
        V!.selected_at = plane.at
        if (L!.P === 'move_planes') {
          V!.moves = movesMapFor(plane)
        } else {
          V!.fire_line = _fireLineHexes(plane)
        }
      }
    }
  }
}

/* --- STATES --- */

// The "take_turn" state is where both players spend all their time.
// The framework calls prompt() to get valid actions, then calls place(i)
// when the active player clicks a cell.

P.move_planes = {
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
}

/* --- COMBAT STATES --- */

// Turn order:
//   move_planes(Niem) → combat_initiative(Niem) → combat_reaction(Bryt)
//   → move_planes(Bryt) → combat_initiative(Bryt) → combat_reaction(Niem) → ...

P.combat_initiative = {
  inactive: "faza walki",

  _begin() {
    G.shot = []
  },

  prompt() {
    const enemySide = G.active === R_Niem ? R_Bryt : R_Niem
    const myPlanes = G.board.planes[G.active as number] ?? []
    const shot = G.shot ?? []

    prompt("Faza walki – inicjatywa: " + ROLES[G.active as number])
    button("done", true)

    myPlanes.forEach((plane, idx) => {
      if (plane && !plane.destroyed)
        action("select_plane", idx)
    })

    if (G.selected_plane !== undefined) {
      const idx = G.selected_plane
      const plane = myPlanes[idx]
      if (plane && !set_has(shot, idx) && !plane.destroyed) {
        if (plane.jammed) {
          button("unjam", true)
        } else {
          const target = firstOnFireLine(plane, G.board.planes)
          if (target && target.side === enemySide)
            button("attack", true)
        }
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
    const enemySide = G.active === R_Niem ? R_Bryt : R_Niem
    const hit = firstOnFireLine(plane, G.board.planes)
    if (!hit || hit.side !== enemySide) return

    push_undo()
    set_add(G.shot!, idx)
    const targetPlane = G.board.planes[hit.side][hit.idx]
    const {roll, atk, result} = resolveShot(plane, targetPlane!, hit.distance)
    log(`${ROLES[G.active as number]} atakuje [SA:${atk} odl:${hit.distance} rzut:${roll}] → ${result}`)
    delete G.selected_plane
  },

  unjam() {
    const idx = G.selected_plane
    if (idx === undefined) return
    const plane = G.board.planes[G.active as number][idx]
    if (!plane || !plane.jammed) return
    push_undo()
    set_add(G.shot!, idx)
    const roll = random(6) + 1
    if (roll === 6) {
      delete plane.jammed
      log(`${ROLES[G.active as number]} odblokował karabiny (rzut:${roll}) – sukces`)
    } else {
      log(`${ROLES[G.active as number]} nie odblokował karabinów (rzut:${roll})`)
    }
    delete G.selected_plane
  },

  done() {
    delete G.selected_plane
    G.active = G.active === R_Niem ? R_Bryt : R_Niem
    goto("combat_reaction")
  },
}

P.combat_reaction = {
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
}
