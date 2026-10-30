import {beforeEach, describe, expect, it, vi} from "vitest";
import {G, planes, R_Bryt, R_Niem} from "../globals";
import type {PlaneInstance} from "../types";
import {maxSpeedAt} from "../game/altitude";
import {flightsFor} from "../game/hex";
import {combat} from "./combat";
import {movePlanes} from "./move_planes";

vi.mock("../globals", async importOriginal => ({
  ...await importOriginal<typeof import("../globals")>(),
  G: {},
  L: {},
  V: {unmoved: []},
}));

const goto = vi.fn();
const log = vi.fn();

function he111(overrides: Partial<PlaneInstance> = {}): PlaneInstance {
  return {id: "0.0", plane: planes.HE111, at: "A20.B20", direction: 0, ...overrides}
}

function spit(overrides: Partial<PlaneInstance> = {}): PlaneInstance {
  return {id: "1.0", plane: planes.Spit, at: "A01.B01", direction: 0, ...overrides}
}

function setup(niem: PlaneInstance[], flownOver: Record<string, string[]> = {}) {
  Object.assign(G, {
    active: R_Niem,
    shot: [],
    moved: [],
    targets: ["A20.B21", "A20.B22", "A20.B23", "A30.B30"],
    bombed: [],
    flown_over: flownOver,
    board: {planes: {[R_Niem]: niem, [R_Bryt]: [spit()]}},
  });
  delete G.selected_plane;
}

function actionsOf(prompt: () => void) {
  const action = vi.fn();
  vi.stubGlobal("prompt", vi.fn());
  vi.stubGlobal("button", vi.fn());
  vi.stubGlobal("action", action);
  prompt();
  return action.mock.calls;
}

beforeEach(() => {
  goto.mockClear();
  log.mockClear();
  vi.stubGlobal("goto", goto);
  vi.stubGlobal("log", log);
  vi.stubGlobal("push_undo", vi.fn());
  vi.stubGlobal("clear_undo", vi.fn());
  vi.stubGlobal("set_has", (set: unknown[], item: unknown) => set.includes(item));
  vi.stubGlobal("set_add", (set: unknown[], item: unknown) => set.push(item));
});

describe('flight path', () => {
  it('lists the hexes entered, without the starting one', () => {
    const flights = flightsFor(he111(), {[R_Niem]: [he111()]});
    expect(flights["A20.B23"]).toEqual({direction: 0, path: ["A20.B21", "A20.B22", "A20.B23"]});
  });

  it('follows the turn', () => {
    const flights = flightsFor(he111(), {[R_Niem]: [he111()]});
    expect(flights["A21.B23"]).toEqual({direction: 1, path: ["A20.B21", "A20.B22", "A21.B23"]});
  });
});

describe('moving', () => {
  it('remembers the hexes flown over (7.0.2)', () => {
    const plane = he111();
    setup([plane]);
    G.selected_plane = plane.id;
    movePlanes.move_hex("A20.B23");
    expect(G.flown_over).toEqual({"0.0": ["A20.B21", "A20.B22", "A20.B23"]});
  });
});

describe('entering the attack phase', () => {
  it('stops there for a plane that can still bomb (7.0.3)', () => {
    setup([he111()], {"0.0": ["A20.B21"]});
    movePlanes.done();
    expect(goto).toHaveBeenCalledWith("combat");
  });

  it('skips it for a plane that flew over no strategic object', () => {
    setup([he111()], {"0.0": ["A25.B25"]});
    movePlanes.done();
    expect(goto).toHaveBeenCalledWith("move_planes");
  });

  it('skips it for a plane that has no bombs left', () => {
    setup([he111({bombs_dropped: 2})], {"0.0": ["A20.B21"]});
    movePlanes.done();
    expect(goto).toHaveBeenCalledWith("move_planes");
  });

  it('skips it for a plane without a bomb load', () => {
    setup([he111({plane: planes.ME109})], {"0.0": ["A20.B21"]});
    movePlanes.done();
    expect(goto).toHaveBeenCalledWith("move_planes");
  });

  it('forgets the flown over hexes with the end of the phase', () => {
    setup([he111()], {"0.0": ["A20.B21"]});
    combat.done();
    expect(G.flown_over).toEqual({});
  });
});

describe('bombing', () => {
  it('offers only the hexes flown over by the selected plane (7.0.3)', () => {
    setup([he111(), he111({id: "0.1"})], {"0.0": ["A20.B21", "A20.B22"], "0.1": ["A30.B30"]});
    expect(actionsOf(combat.prompt)).toEqual([["select_plane", "0.0"], ["select_plane", "0.1"]]);
    G.selected_plane = "0.0";
    expect(actionsOf(combat.prompt).filter(it => it[0] === "bomb")).toEqual([["bomb", "A20.B21"], ["bomb", "A20.B22"]]);
  });

  it('uses up one series and the hex (7.0, 7.0.4)', () => {
    const plane = he111();
    setup([plane], {"0.0": ["A20.B21", "A20.B22"]});
    G.selected_plane = "0.0";
    combat.bomb("A20.B21");
    expect(plane.bombs_dropped).toBe(1);
    expect(G.flown_over!["0.0"]).toEqual(["A20.B22"]);
    combat.bomb("A20.B21");
    expect(plane.bombs_dropped).toBe(1);
  });

  it('is limited by the bomb load (7.0.5)', () => {
    const plane = he111();
    setup([plane], {"0.0": ["A20.B21", "A20.B22", "A20.B23"]});
    G.selected_plane = "0.0";
    combat.bomb("A20.B21");
    combat.bomb("A20.B22");
    expect(G.selected_plane).toBeUndefined();
    G.selected_plane = "0.0";
    combat.bomb("A20.B23");
    expect(plane.bombs_dropped).toBe(2);
  });

  it('does not use up the shot', () => {
    setup([he111()], {"0.0": ["A20.B21"]});
    G.selected_plane = "0.0";
    combat.bomb("A20.B21");
    expect(G.shot).toEqual([]);
  });

  it('is allowed only on strategic objects, which get marked (7.0.7)', () => {
    const plane = he111();
    setup([plane], {"0.0": ["A20.B21", "A25.B25"]});
    G.selected_plane = "0.0";
    expect(actionsOf(combat.prompt).filter(it => it[0] === "bomb")).toEqual([["bomb", "A20.B21"]]);
    combat.bomb("A25.B25");
    expect(plane.bombs_dropped).toBeUndefined();
    expect(G.bombed).toEqual([]);
    combat.bomb("A20.B21");
    expect(plane.bombs_dropped).toBe(1);
    expect(G.bombed).toEqual(["A20.B21"]);
  });

  it('a shot down plane loses its bombs (7.0.9)', () => {
    setup([he111({destroyed: true})], {"0.0": ["A20.B21"]});
    expect(actionsOf(combat.prompt)).toEqual([]);
    G.selected_plane = "0.0";
    combat.bomb("A20.B21");
    expect(G.board.planes[R_Niem][0].bombs_dropped).toBeUndefined();
  });

  it('the selected plane can be deselected', () => {
    setup([he111()], {"0.0": ["A20.B21"]});
    G.selected_plane = "0.0";
    combat.deselect();
    expect(G.selected_plane).toBeUndefined();
  });
});

describe('speed without bombs (2.1)', () => {
  const ju88 = (overrides: Partial<PlaneInstance> = {}) => he111({plane: planes.JU88, ...overrides});

  it('stays the same while any bombs are left', () => {
    expect(maxSpeedAt(ju88({bombs_dropped: 2}), 0)).toBe(4);
  });

  it('rises after the last series', () => {
    expect(maxSpeedAt(ju88({bombs_dropped: 3}), 0)).toBe(5);
  });

  it('uses the reduced value on a damaged plane (2.1.1)', () => {
    expect(maxSpeedAt(ju88({bombs_dropped: 3, damaged: true}), 0)).toBe(4);
  });

  it('does not change for other planes', () => {
    expect(maxSpeedAt(he111({bombs_dropped: 2}), 0)).toBe(4);
  });
});
