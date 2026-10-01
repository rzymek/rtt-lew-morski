import {describe, expect, it, vi} from "vitest";
import {G, R_Bryt, R_Niem} from "../globals";
import {changeSide, otherSide} from "./changeSide";

vi.mock("../globals", async importOriginal => ({
  ...await importOriginal<typeof import("../globals")>(),
  G: {},
}));

describe('otherSide', () => {
  it('returns the opposite side', () => {
    expect(otherSide(R_Niem)).toBe(R_Bryt);
    expect(otherSide(R_Bryt)).toBe(R_Niem);
  });
});

describe('changeSide', () => {
  it('toggles G.active', () => {
    G.active = R_Niem;
    changeSide();
    expect(G.active).toBe(R_Bryt);
    changeSide();
    expect(G.active).toBe(R_Niem);
  });
});
