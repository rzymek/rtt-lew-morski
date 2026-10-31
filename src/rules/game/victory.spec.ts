import {beforeEach, describe, expect, it, vi} from "vitest";
import {G, planes, R_Bryt, R_Niem} from "../globals";
import type {PlaneInstance} from "../types";
import {applyHit} from "./combat";
import {checkGameEnd, endingGame, winner} from "./victory";
import {canLeaveSouth} from "./hex";
import {dropBomb} from "../procedures/bombers";

vi.mock("../globals", async importOriginal => ({
  ...await importOriginal<typeof import("../globals")>(),
  G: {},
}));

const finish = vi.fn();

function plane(id: string, type: keyof typeof planes, overrides: Partial<PlaneInstance> = {}): PlaneInstance {
  return {id, plane: planes[type], at: "A20.B20", direction: 0, ...overrides}
}

beforeEach(() => {
  finish.mockClear();
  vi.stubGlobal("finish", finish);
  vi.stubGlobal("log", vi.fn());
  vi.stubGlobal("set_has", (set: unknown[], item: unknown) => set.includes(item));
  vi.stubGlobal("set_add", (set: unknown[], item: unknown) => set.push(item));
  for (const key of Object.keys(G)) delete (G as any)[key];
  Object.assign(G, {
    vp: {[R_Niem]: 0, [R_Bryt]: 0},
    min_vp: {[R_Niem]: 35, [R_Bryt]: 23},
    board: {planes: {[R_Niem]: [plane("0.0", "HE111")], [R_Bryt]: [plane("1.0", "Spit")]}},
    targets: ["A01.B01", "A02.B02"],
    flown_over: {},
    bombed: [],
    aa_guns: [],
  });
});

describe('table 1', () => {
  it.each([
    ["1.0", "Spit", {[R_Niem]: 2, [R_Bryt]: -1}],
    ["1.0", "HurL", {[R_Niem]: 2, [R_Bryt]: -1}],
    ["0.0", "HE111", {[R_Niem]: -2, [R_Bryt]: 4}],
    ["0.0", "JU88", {[R_Niem]: -2, [R_Bryt]: 4}],
    ["0.0", "ME109", {[R_Niem]: -1, [R_Bryt]: 2}],
    ["0.0", "ME110", {[R_Niem]: -1, [R_Bryt]: 2}],
  ] as const)('losing plane %s %s', (id, type, expected) => {
    applyHit(plane(id, type, {damaged: true}));
    expect(G.vp).toEqual(expected);
  });

  it('a damaged plane scores nothing', () => {
    applyHit(plane("1.0", "Spit"));
    expect(G.vp).toEqual({[R_Niem]: 0, [R_Bryt]: 0});
  });

  it('every series of bombs on a target counts, also on one bombed before (7.0.8)', () => {
    const bomber = plane("0.0", "JU88");
    G.flown_over = {"0.0": ["A01.B01"]};
    dropBomb(bomber, "A01.B01");
    G.flown_over = {"0.0": ["A01.B01"]};
    dropBomb(bomber, "A01.B01");
    expect(G.vp![R_Niem]).toBe(6);
  });

  it('bombs elsewhere than on a target score nothing', () => {
    G.flown_over = {"0.0": ["A05.B05"]};
    dropBomb(plane("0.0", "JU88"), "A05.B05");
    expect(G.vp![R_Niem]).toBe(0);
  });

  it('the score can go below zero (8.0)', () => {
    applyHit(plane("0.0", "HE111", {damaged: true}));
    expect(G.vp![R_Niem]).toBe(-2);
  });
});

describe('9.2: bonus for all the targets', () => {
  const bomb = (hex: string) => {
    G.flown_over = {"0.0": [hex]};
    dropBomb(plane("0.0", "JU88"), hex);
  };

  beforeEach(() => {
    G.all_targets_vp = 5;
  });

  it('is not given for a part of them', () => {
    bomb("A01.B01");
    bomb("A01.B01");
    expect(G.vp![R_Niem]).toBe(6);
  });

  it('is given once, on top of the points for the series', () => {
    bomb("A01.B01");
    bomb("A02.B02");
    expect(G.vp![R_Niem]).toBe(3 + 3 + 5);
    bomb("A02.B02");
    expect(G.vp![R_Niem]).toBe(3 + 3 + 5 + 3);
  });
});

describe('8.1: end of the game', () => {
  it('goes on while both sides have planes', () => {
    checkGameEnd();
    expect(finish).not.toHaveBeenCalled();
  });

  it('ends when the Germans have no planes left', () => {
    G.board.planes[R_Niem][0].destroyed = true;
    checkGameEnd();
    expect(finish).toHaveBeenCalled();
  });

  it('goes on while the British have guns left', () => {
    G.board.planes[R_Bryt][0].destroyed = true;
    G.aa_guns = ["A05.B05"];
    checkGameEnd();
    expect(finish).not.toHaveBeenCalled();
  });

  it('goes on while reinforcements are to come', () => {
    G.board.planes[R_Bryt][0].destroyed = true;
    G.reinforcements = {[R_Niem]: [], [R_Bryt]: [{stage: 9, plane: planes.Spit, at: "A01.B01", direction: 0}]};
    checkGameEnd();
    expect(finish).not.toHaveBeenCalled();
  });

  it('ends when the British have neither planes nor guns', () => {
    G.board.planes[R_Bryt][0].destroyed = true;
    checkGameEnd();
    expect(finish).toHaveBeenCalled();
  });

  it('ends when both sides are gone at once, drawn at equal scores', () => {
    G.min_vp = {[R_Niem]: 10, [R_Bryt]: 10};
    G.board.planes[R_Niem][0].destroyed = true;
    G.board.planes[R_Bryt][0].destroyed = true;
    checkGameEnd();
    expect(finish.mock.calls[0][0]).toBe("Draw");
  });

  it('is checked after an action of a state, but not for its prompt', () => {
    G.board.planes[R_Niem][0].destroyed = true;
    const state = endingGame({inactive: "x", prompt: vi.fn(), done: vi.fn()});
    state.prompt();
    expect(finish).not.toHaveBeenCalled();
    state.done();
    expect(finish).toHaveBeenCalled();
    expect(state.inactive).toBe("x");
  });

  it('names the winner and the kind of the victory', () => {
    G.vp = {[R_Niem]: 35, [R_Bryt]: 0};
    G.board.planes[R_Bryt][0].destroyed = true;
    checkGameEnd();
    expect(finish).toHaveBeenCalledWith(R_Niem, "Wygrywają Niemcy (pełne zwycięstwo): Niemcy 35/35 PZ, Brytyjczycy 0/23 PZ");
  });
});

describe('8.2: the winner', () => {
  const min = {[R_Niem]: 35, [R_Bryt]: 23};
  const scores = (niem: number, bryt: number) => ({[R_Niem]: niem, [R_Bryt]: bryt});

  it('the one who reached the minimum', () => {
    expect(winner(scores(35, 10), min)).toBe(R_Niem);
    expect(winner(scores(10, 23), min)).toBe(R_Bryt);
  });

  it('the one closer to the minimum (the example from the manual)', () => {
    expect(winner(scores(27, 19), min)).toBe(R_Bryt);
  });

  it('at equal points missing, the larger percentage (the example from the manual)', () => {
    expect(winner(scores(31, 19), min)).toBe(R_Niem);
  });

  it('with both minimums reached, the larger surplus', () => {
    expect(winner(scores(40, 24), min)).toBe(R_Niem);
  });

  it('a draw when the requirements and the scores are the same', () => {
    expect(winner(scores(5, 5), {[R_Niem]: 10, [R_Bryt]: 10})).toBeNull();
  });
});

describe('8.1: leaving through the south edge', () => {
  const S = 3, NE = 1, N = 0;
  const canLeave = (it: PlaneInstance) => canLeaveSouth(it, {[R_Niem]: [it]});

  it('straight ahead, from the edge', () => {
    expect(canLeave(plane("0.0", "ME109", {at: "A20.B10", direction: S}))).toBe(true);
  });

  it('straight ahead, within the range', () => {
    expect(canLeave(plane("0.0", "ME109", {at: "A20.B15", direction: S}))).toBe(true);
  });

  it('not beyond the range', () => {
    expect(canLeave(plane("0.0", "ME109", {at: "A20.B16", direction: S}))).toBe(false);
  });

  it('not when flying away from the edge', () => {
    expect(canLeave(plane("0.0", "ME109", {at: "A20.B10", direction: N}))).toBe(false);
  });

  it('after a turn', () => {
    expect(canLeave(plane("0.0", "ME109", {at: "A20.B10", direction: NE}))).toBe(true);
  });

  it('not through a plane at the same altitude', () => {
    const bomber = plane("0.0", "HE111", {at: "A20.B12", direction: S});
    expect(canLeave(bomber)).toBe(true);
    expect(canLeaveSouth(bomber, {[R_Niem]: [bomber, plane("0.1", "ME109", {at: "A20.B11"})]})).toBe(false);
  });
});
