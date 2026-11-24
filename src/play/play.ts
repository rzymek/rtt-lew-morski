import {add_main_menu_item_link_newtab} from "@rzymek/rally-the-troops-module/client";
import {onInit} from "./on_init";
import {onUpdate} from "./on_update";
import {onLog} from "./onLog";

on_init = onInit;
on_update = onUpdate;
on_log = onLog;

add_main_menu_item_link_newtab("Rules", "/lew-morski/info/rules.html");

add_icon_button(1, "pieces_button", "earth-africa-europe", () => document.body.classList.toggle("hide-pieces"));
