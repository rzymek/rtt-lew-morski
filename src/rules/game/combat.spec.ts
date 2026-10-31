import {expect, it, vi} from "vitest";
import {planes} from "../globals";
import type {PlaneData} from "./data";
import {rollShot} from "./combat";

// Table 2, the lowest roll that hits, up to 11: [attack strength, [by distance 1-5]]
const TABLE_2: [number, (number | null)[]][] = [
  [0, [null, null, null, null, null]],
  [1, [9, 10, 11, null, null]],
  [2, [8, 9, 10, 11, null]],
  [3, [7, 8, 9, 10, 11]],
  [4, [6, 7, 8, 9, 10]],
  [5, [5, 6, 7, 8, 9]],
];

function shoot(sila_ataku: number, distance: number, sum: number) {
  const dice = [Math.ceil(sum / 2) - 1, Math.floor(sum / 2) - 1];
  vi.stubGlobal("random", () => dice.shift());
  const attacker = {id: "1.0", plane: {...planes.Spit, sila_ataku} as PlaneData, at: "A20.B20", direction: 0};
  const target = {id: "0.0", plane: planes.HE111, at: "A20.B21", direction: 0};
  return rollShot(attacker, target, distance).hit;
}

const cases = TABLE_2.flatMap(([atk, row]) => row.map((from, i) => [atk, i + 1, from] as const));

it.each(cases)('attack strength %i, distance %i: hits from %s to 11', (atk, distance, from) => {
  for (let sum = 3; sum <= 11; sum++) {
    expect(shoot(atk, distance, sum), `roll ${sum}`).toBe(from !== null && sum >= from);
  }
});

it.each([2, 12])('a roll of %i never hits (5.3.4)', sum => {
  expect(shoot(5, 1, sum)).toBe(false);
});
