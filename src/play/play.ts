import {onInit} from "./on_init";
import {onUpdate} from "./on_update";
import {onLog} from "./onLog";

on_init = onInit;
on_update = onUpdate;
// head.html declares only on_update/on_init, so a bare assignment throws in a strict-mode module.
(window as unknown as {on_log: typeof onLog}).on_log = onLog;

add_main_menu_item_link("Rules", "/lew-morski/info/rules.pdf");

add_icon_button(1, "pieces_button", "earth-africa-europe", () => document.body.classList.toggle("hide-pieces"));
