import {G, ROLES} from "../globals";

export function changeSide() {
  G.active = otherSide(G.active);
}

export function otherSide(active: number) {
  return (G.active + 1) % ROLES.length
}