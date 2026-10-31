import type {PlaneInstance} from "../types";
import {G, R_Bryt, R_Niem, ROLES} from "../globals";

// Table 1
const VP_BOMB_ON_TARGET = 3
const VP_FIGHTER_SHOT_DOWN = 2
const VP_BOMBER_SHOT_DOWN = 4
const VP_FIGHTER_LOST = -1
const VP_BOMBER_LOST = -2

// 8.0: the score can go below zero.
function addVp(side: number, points: number, reason: string) {
  G.vp ??= {[R_Niem]: 0, [R_Bryt]: 0}
  G.vp[side] += points
  log(`${ROLES[side]}: ${points > 0 ? "+" : ""}${points} PZ (${reason}) → ${G.vp[side]} PZ`)
}

// Table 1: the Me-110 carries bombs, but counts as a fighter.
export function scorePlaneLost(plane: PlaneInstance) {
  const name = plane.plane.nazwa
  if (parseInt(plane.id) === R_Bryt) {
    addVp(R_Bryt, VP_FIGHTER_LOST, `stracony ${name}`)
    addVp(R_Niem, VP_FIGHTER_SHOT_DOWN, `zestrzelony ${name}`)
  } else if (plane.plane.bombowiec) {
    addVp(R_Niem, VP_BOMBER_LOST, `stracony ${name}`)
    addVp(R_Bryt, VP_BOMBER_SHOT_DOWN, `zestrzelony ${name}`)
  } else {
    addVp(R_Niem, VP_FIGHTER_LOST, `stracony ${name}`)
    addVp(R_Bryt, VP_FIGHTER_SHOT_DOWN, `zestrzelony ${name}`)
  }
}

export function scoreBombOnTarget(hex: string) {
  addVp(R_Niem, VP_BOMB_ON_TARGET, `bomby na ${hex}`)
}

// 9.2
export function scoreAllTargetsBombed() {
  if (G.all_targets_vp) addVp(R_Niem, G.all_targets_vp, "zbombardowane wszystkie cele")
}

// 8.1: reinforcements yet to come count as well, or a side could lose before they enter.
function hasUnitsLeft(side: number): boolean {
  return G.board.planes[side].some(plane => !plane.destroyed)
    || (G.reinforcements?.[side] ?? []).length > 0
    || (side === R_Bryt && (G.aa_guns ?? []).length > 0)
}

export function isGameOver(): boolean {
  return !hasUnitsLeft(R_Niem) || !hasUnitsLeft(R_Bryt)
}

// 8.2: the fewest points missing, then the larger percentage of the required points. null = a draw.
// The manual does not say what happens when both sides reach their minimum: the same comparison decides.
export function winner(vp: Record<number, number>, min: Record<number, number>): number | null {
  const missing = (side: number) => min[side] - vp[side]
  // Cross-multiplied percentages, to stay away from comparing floats.
  const compared = missing(R_Bryt) - missing(R_Niem) || vp[R_Niem] * min[R_Bryt] - vp[R_Bryt] * min[R_Niem]
  return compared > 0 ? R_Niem : compared < 0 ? R_Bryt : null
}

function endGame() {
  const vp = G.vp!, min = G.min_vp!
  const score = [R_Niem, R_Bryt].map(side => `${ROLES[side]} ${vp[side]}/${min[side]} PZ`).join(", ")
  const side = winner(vp, min)
  delete G.selected_plane
  delete G.selected_altitude
  delete G.selected_gun
  if (side === null) {
    finish("Draw", `Remis: ${score}`)
  } else {
    const kind = vp[side] >= min[side] ? "pełne" : "minimalne"
    finish(side, `Wygrywają ${ROLES[side]} (${kind} zwycięstwo): ${score}`)
  }
}

export function checkGameEnd() {
  if (isGameOver()) endGame()
}

// Checked once an action is complete: simultaneous hits (5.4) must all be applied by then.
export function endingGame<T extends object>(state: T): T {
  return Object.fromEntries(Object.entries(state).map(([name, handler]) => [
    name,
    typeof handler === "function" && name !== "prompt"
      ? (argument: unknown) => {
        handler(argument)
        checkGameEnd()
      }
      : handler,
  ])) as T
}
