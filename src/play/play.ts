import {onInit} from "./on_init";
import {onUpdate} from "./on_update";

// Globals read by the RTT client, so assigning them is the whole point.
// oxlint-disable-next-line no-unused-vars
declare var on_update: unknown;
// oxlint-disable-next-line no-unused-vars
declare var on_init: unknown;

on_init = onInit;
on_update = onUpdate;