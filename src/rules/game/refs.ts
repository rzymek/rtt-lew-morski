import {ref} from "@rzymek/rally-the-troops-module/rules"
import type {PlaneInstance} from "../types"

/** A plane as named in the log: the client links it to the counter. */
export const planeRef = (plane: PlaneInstance) => ref("p", plane.id, plane.plane.nazwa)

/** A hex as named in the log: the client links it to the hex. */
export const hexRef = (hex: string) => ref("h", hex, hex)
