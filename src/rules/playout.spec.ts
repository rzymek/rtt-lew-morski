import {existsSync} from "node:fs";
import path from "node:path";
import {describe, expect, it} from "vitest";
import {playRandomGames} from "@rzymek/rally-the-troops-module/testing";

/** The built rules: `RTT_DIR=<dir> CI=1 pnpm exec vite build` first. */
const rulesPath = path.resolve(process.env.RTT_DIR ?? "../../server", "public/lew-morski/rules.js")
const games = Number(process.env.PLAYOUT_GAMES ?? 5)

/** Random games have to come to an end: no state may leave the active player only actions that go nowhere. */
describe.skipIf(!existsSync(rulesPath))("random playouts", () => {
  it(`end, ${games} of them`, () => {
    const unfinished = playRandomGames({rulesPath, games})
      .filter(game => game.result === undefined)
      .map(game => `game ${game.game} after ${game.steps} steps: ${game.state.L?.P}, ${game.state.log[game.state.log.length - 1]}`)
    expect(unfinished).toEqual([])
  }, 600_000)
})
