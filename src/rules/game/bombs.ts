import type {PlaneInstance} from "../types";

// 7.0: one series of bombs per point of the plane's bomb load.
export function bombsLeft(plane: PlaneInstance): number {
  return (plane.plane.udzwig_bomb ?? 0) - (plane.bombs_dropped ?? 0)
}
