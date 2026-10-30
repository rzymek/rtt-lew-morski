import {describe, expect, it, vi} from "vitest";
import {G, planes, R_Bryt, R_Niem} from "../globals";
import type {PlaneInstance} from "../types";
import {ALT_HIGH, ALT_LOW, ALT_VERY_LOW, canChangeAltitude, maxSpeedAt} from "./altitude";
import {firstOnFireLine} from "./combat";
import {movesMapFor} from "./hex";
import {planesInFirelane} from "../procedures/planesInFirelane";

vi.mock("../globals", async importOriginal => ({
  ...await importOriginal<typeof import("../globals")>(),
  G: {},
}));

function spit(overrides: Partial<PlaneInstance> = {}): PlaneInstance {
  return {id: "1.0", plane: planes.Spit, at: "A20.B20", direction: 0, ...overrides}
}

function he111(overrides: Partial<PlaneInstance> = {}): PlaneInstance {
  return {id: "0.0", plane: planes.HE111, at: "A20.B22", direction: 3, ...overrides}
}

describe('canChangeAltitude', () => {
  it('allows only one level down at a time', () => {
    expect(canChangeAltitude(spit(), ALT_LOW)).toBe(true);
    expect(canChangeAltitude(spit(), ALT_VERY_LOW)).toBe(false);
  });

  it('allows only one level up at a time', () => {
    expect(canChangeAltitude(spit({altitude: ALT_VERY_LOW}), ALT_LOW)).toBe(true);
    expect(canChangeAltitude(spit({altitude: ALT_VERY_LOW}), ALT_HIGH)).toBe(false);
  });

  it('forbids a climb that would drop the limit below the minimum speed', () => {
    expect(canChangeAltitude(he111({altitude: ALT_LOW}), ALT_HIGH)).toBe(true);
    // damaged He 111: max 3, min 3
    expect(canChangeAltitude(he111({altitude: ALT_LOW, damaged: true}), ALT_HIGH)).toBe(false);
    expect(canChangeAltitude(he111({altitude: ALT_LOW, damaged: true}), ALT_VERY_LOW)).toBe(true);
    expect(canChangeAltitude(he111({altitude: ALT_LOW, damaged: true}), ALT_LOW)).toBe(true);
  });

  it('rejects levels that do not exist', () => {
    expect(canChangeAltitude(spit(), -1)).toBe(false);
    expect(canChangeAltitude(spit({altitude: ALT_VERY_LOW}), 3)).toBe(false);
  });
});

describe('maxSpeedAt', () => {
  it('adds 1 when descending and subtracts 1 when climbing', () => {
    expect(maxSpeedAt(spit({altitude: ALT_LOW}), ALT_VERY_LOW)).toBe(7);
    expect(maxSpeedAt(spit({altitude: ALT_LOW}), ALT_LOW)).toBe(6);
    expect(maxSpeedAt(spit({altitude: ALT_LOW}), ALT_HIGH)).toBe(5);
  });
});

describe('movesMapFor', () => {
  it('range follows the chosen altitude', () => {
    // direction 0 advances B by one per hex
    expect(movesMapFor(spit())).not.toHaveProperty(["A20.B27"]);
    expect(movesMapFor(spit(), ALT_LOW)).toHaveProperty(["A20.B27"]);
    expect(movesMapFor(spit({altitude: ALT_LOW}))).toHaveProperty(["A20.B26"]);
    expect(movesMapFor(spit({altitude: ALT_LOW}), ALT_HIGH)).not.toHaveProperty(["A20.B26"]);
  });
});

describe('fire across altitudes', () => {
  it('firstOnFireLine ignores planes at another altitude', () => {
    const target = he111({altitude: ALT_LOW});
    const board = {[R_Bryt]: [spit()], [R_Niem]: [target]};
    expect(firstOnFireLine(spit(), board)).toBeNull();
    expect(firstOnFireLine(spit({altitude: ALT_LOW}), board)?.plane).toBe(target);
  });

  it('a plane at another altitude does not block the line', () => {
    const blocker = he111({id: "0.1", at: "A20.B21", altitude: ALT_LOW});
    const target = he111();
    const board = {[R_Bryt]: [spit()], [R_Niem]: [blocker, target]};
    expect(firstOnFireLine(spit(), board)?.plane).toBe(target);
  });

  it('planesInFirelane counts only shooters at the same altitude', () => {
    G.board = {planes: {[R_Bryt]: [spit()], [R_Niem]: [he111({altitude: ALT_LOW})]}};
    expect(planesInFirelane(R_Niem)).toEqual([]);
    G.board = {planes: {[R_Bryt]: [spit({altitude: ALT_LOW})], [R_Niem]: [he111({altitude: ALT_LOW})]}};
    expect(planesInFirelane(R_Niem).map(it => it.id)).toEqual(["0.0"]);
  });
});
