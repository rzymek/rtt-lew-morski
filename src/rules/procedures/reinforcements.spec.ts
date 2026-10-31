import {beforeEach, expect, it, vi} from "vitest";
import {G, planes, R_Bryt, R_Niem} from "../globals";
import {endCombat} from "./phases";

vi.mock("../globals", async importOriginal => ({
  ...await importOriginal<typeof import("../globals")>(),
  G: {},
}));

vi.stubGlobal("goto", vi.fn());
vi.stubGlobal("log", vi.fn());

beforeEach(() => {
  Object.assign(G, {
    active: R_Niem,
    stage: 3,
    board: {
      planes: {
        [R_Niem]: [{id: "0.0", plane: planes.HE111, at: "A20.B20", direction: 0}],
        [R_Bryt]: [{id: "1.0", plane: planes.Spit, at: "A01.B09", direction: 0}],
      }
    },
    reinforcements: {
      [R_Niem]: [],
      [R_Bryt]: [
        {stage: 3, plane: planes.Spit, at: "A01.B09", direction: 1},
        {stage: 5, plane: planes.Spit, at: "A06.B30", direction: 3},
      ],
    },
  });
});

it('enters on its stage, in the movement phase of its side, next to an occupied hex', () => {
  endCombat();

  expect(G.active).toBe(R_Bryt);
  expect(G.stage).toBe(3);
  const entered = G.board.planes[R_Bryt];
  expect(entered).toHaveLength(2);
  expect(entered[1]).toMatchObject({id: "1.1", direction: 1});
  expect(entered[1].at).not.toBe("A01.B09");
});

it('the stage ends after the combat phase of the British', () => {
  G.active = R_Bryt;
  endCombat();

  expect(G.active).toBe(R_Niem);
  expect(G.stage).toBe(4);
  expect(G.board.planes[R_Bryt]).toHaveLength(1);
});
