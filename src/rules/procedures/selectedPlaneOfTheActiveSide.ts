import {G} from "../globals";

export function selectedPlaneOfTheActiveSide() {
  if (G.selected_plane === undefined) {
    return undefined;
  }
  return G.board.planes[G.active]
    .find(it => it.id === G.selected_plane);
}