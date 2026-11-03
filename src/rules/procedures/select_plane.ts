import {G} from "../globals";

// Unlike select_plane, never deselects: for the "next plane" button.
export function next_plane(planeId: string) {
  delete G.selected_altitude
  delete G.leaving
  G.selected_plane = planeId
}

export function select_plane(planeId: string) {
  delete G.selected_altitude
  delete G.leaving
  if (G.selected_plane === planeId) {
    delete G.selected_plane
  } else {
    G.selected_plane = planeId
  }
}