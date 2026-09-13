import {PlaneInstance} from "../types";
import {G} from "../globals";
import {fireLineHexes} from "../game/combat";
import {otherSide} from "../lifecycle/changeSide";

export function planesInFirelane(side: number): PlaneInstance[] {
  const shooting = G.board.planes[otherSide(side)] ?? [];
  const fireHexes = new Set<string>(
    shooting
      .filter((p): p is PlaneInstance => !!p && !p.destroyed)
      .flatMap(p => fireLineHexes(p))
  );

  return G.board.planes[side]
    .filter((p): p is PlaneInstance => !!p && !p.destroyed && fireHexes.has(p.at));
}