import {onInit} from "./on_init";
import {onUpdate} from "./on_update";

const R_Niem = 0
const R_Bryt = 1

declare var on_update: () => void;
declare var on_init: (scenario: string, options: unknown, static_view: unknown) => void

on_init = onInit
on_update = onUpdate;