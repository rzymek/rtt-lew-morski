import {planesInFirelane} from "./planesInFirelane";
import {otherSide} from "../lifecycle/changeSide";
import {G} from "../globals";
import {select_plane} from "./select_plane";

export const movedIntoFirelane = {
  inactive: "krzyżowanie się linii ognia",

  prompt() {
    prompt(`krzyżowanie się linii ognia`)
    button("done");
    planesInFirelane(otherSide(G.active)).forEach(plane => {
      action("select_plane", plane.id)
    })
  },

  select_plane,

  done() {
    goto("combat")
  }
}