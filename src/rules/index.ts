import "./rtt/framework.d.ts"

import {P} from "./globals";
import {movePlanes} from "./procedures/move_planes";
import {combat} from "./procedures/combat";
import {movedIntoFirelane, returnFire} from "./procedures/moved_into_firelane";

export * from "./lifecycle";

P.move_planes = movePlanes;
P.combat = combat;
P.moved_into_firelane = movedIntoFirelane;
P.return_fire = returnFire;
