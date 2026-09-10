import "./rtt/framework.d.ts"

import {P} from "./globals";
import {movePlanes} from "./procedures/move_planes";
import {combatInitiative} from "./procedures/combat_initiative";
import {combatReaction} from "./procedures/combat_reaction";

export * from "./lifecycle";

P.move_planes = movePlanes;
P.combat_initiative = combatInitiative;
P.combat_reaction = combatReaction;

