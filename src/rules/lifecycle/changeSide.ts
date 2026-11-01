import {nextActiveRole} from "@rally-the-troops/module/rules";
import {G, ROLES} from "../globals";

export function changeSide() {
  G.active = otherSide(G.active);
}

export function otherSide(active: number) {
  return nextActiveRole(active, ROLES.length)
}
