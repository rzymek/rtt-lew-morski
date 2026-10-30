import {PlaneInstance} from "../types";
import {G} from "../globals";
import {fireLineHexes} from "../game/combat";
import {altitudeOf} from "../game/altitude";
import {otherSide} from "../lifecycle/changeSide";

export function planesInFirelane(side: number): PlaneInstance[] {
  const shooting = (G.board.planes[otherSide(side)] ?? [])
    .filter((p): p is PlaneInstance => !!p && !p.destroyed);

  return G.board.planes[side]
    .filter((p): p is PlaneInstance => !!p && !p.destroyed && shooting.some(shooter =>
      altitudeOf(shooter) === altitudeOf(p) && fireLineHexes(shooter).includes(p.at)
    ));
}
