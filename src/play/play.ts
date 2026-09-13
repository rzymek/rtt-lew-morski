import {onInit} from "./on_init";
import {onUpdate} from "./on_update";

declare var on_update: unknown;
declare var on_init: unknown;

on_init = onInit;
on_update = onUpdate;