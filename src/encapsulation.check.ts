// Type-level encapsulation assertions: only checked by `tsc`, never executed.
// Each import below must fail to resolve; if one starts compiling, `tsc` reports an unused directive.

// @ts-expect-error -- rules internals are not exported
import {hexId as e1} from "@rally-the-troops/module/rules/hex.ts"
// @ts-expect-error -- the rules entry point is only reachable as ".../rules"
import {hexId as e2} from "@rally-the-troops/module/rules/index.ts"
// @ts-expect-error -- client internals are not exported
import {createLayer as e3} from "@rally-the-troops/module/client/createLayer.ts"
// @ts-expect-error -- plugins are internal to ".../vite"
import {covers as e4} from "@rally-the-troops/module/plugins/covers-plugin.ts"
// @ts-expect-error -- there is no root entry point: rules, client and build code run in different places
import {hexId as e5} from "@rally-the-troops/module"
// @ts-expect-error -- the package's own dependency is not accessible
import e6 from "sharp"

export {e1, e2, e3, e4, e5, e6}
