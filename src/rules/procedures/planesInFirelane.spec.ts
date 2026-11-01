import {G} from "../globals";
import {describe, expect, it, vi} from "vitest";
import {planesInFirelane} from "./planesInFirelane";

vi.mock("../globals", async importOriginal => ({
  ...await importOriginal<typeof import("../globals")>(),
  G: {},
}));

describe('planesInFirelane', () => {
  it('example', () => {
    G.board = {
      "planes": {
        "0": [{
          "plane": {
            "nazwa": "Me 110 C",
            "predkosc_max": 5,
            "predkosc_min": 3,
            "sila_ataku": 4,
            "zwrotnosc": 1,
            "udzwig_bomb": 1,
            "img": "planes/u_ME110",
            "reduced": {"predkosc_max": 4, "predkosc_min": 3, "sila_ataku": 3, "zwrotnosc": 1}
          }, "at": "A35.B30", "direction": 4, "id": "0.0"
        }, {
          "plane": {
            "nazwa": "Me 110 C",
            "predkosc_max": 5,
            "predkosc_min": 3,
            "sila_ataku": 4,
            "zwrotnosc": 1,
            "udzwig_bomb": 1,
            "img": "planes/u_ME110",
            "reduced": {"predkosc_max": 4, "predkosc_min": 3, "sila_ataku": 3, "zwrotnosc": 1}
          }, "at": "A36.B31", "direction": 3, "id": "0.1"
        }, {
          "plane": {
            "nazwa": "He 111 H-3",
            "predkosc_max": 4,
            "predkosc_min": 3,
            "sila_ataku": 2,
            "zwrotnosc": 2,
            "udzwig_bomb": 2,
            "img": "planes/u_HE111",
            "reduced": {"predkosc_max": 3, "predkosc_min": 3, "sila_ataku": 1, "zwrotnosc": 2}
          }, "at": "A37.B31", "direction": 4, "id": "0.2"
        }, {
          "plane": {
            "nazwa": "He 111 H-3",
            "predkosc_max": 4,
            "predkosc_min": 3,
            "sila_ataku": 2,
            "zwrotnosc": 2,
            "udzwig_bomb": 2,
            "img": "planes/u_HE111",
            "reduced": {"predkosc_max": 3, "predkosc_min": 3, "sila_ataku": 1, "zwrotnosc": 2}
          }, "at": "A38.B31", "direction": 4, "id": "0.3"
        }, {
          "plane": {
            "nazwa": "He 111 H-3",
            "predkosc_max": 4,
            "predkosc_min": 3,
            "sila_ataku": 2,
            "zwrotnosc": 2,
            "udzwig_bomb": 2,
            "img": "planes/u_HE111",
            "reduced": {"predkosc_max": 3, "predkosc_min": 3, "sila_ataku": 1, "zwrotnosc": 2}
          }, "at": "A35.B31", "direction": 4, "id": "0.4"
        }, {
          "plane": {
            "nazwa": "He 111 H-3",
            "predkosc_max": 4,
            "predkosc_min": 3,
            "sila_ataku": 2,
            "zwrotnosc": 2,
            "udzwig_bomb": 2,
            "img": "planes/u_HE111",
            "reduced": {"predkosc_max": 3, "predkosc_min": 3, "sila_ataku": 1, "zwrotnosc": 2}
          }, "at": "A34.B31", "direction": 4, "id": "0.5"
        }],
        "1": [{
          "plane": {
            "nazwa": "Supermarine Spitfire MK I (Lider)",
            "lider": true,
            "predkosc_max": 6,
            "predkosc_min": 2,
            "sila_ataku": 5,
            "zwrotnosc": 0,
            "udzwig_bomb": null,
            "img": "planes/u_SpitL",
            "reduced": {"predkosc_max": 5, "predkosc_min": 2, "sila_ataku": 4, "zwrotnosc": 1}
          }, "at": "A10.B08", "direction": 0, "id": "1.0"
        }, {
          "plane": {
            "nazwa": "Supermarine Spitfire MK I",
            "predkosc_max": 6,
            "predkosc_min": 2,
            "sila_ataku": 4,
            "zwrotnosc": 0,
            "udzwig_bomb": null,
            "img": "planes/u_Spit",
            "reduced": {"predkosc_max": 5, "predkosc_min": 2, "sila_ataku": 3, "zwrotnosc": 1}
          }, "at": "A11.B08", "direction": 1, "id": "1.1"
        }, {
          "plane": {
            "nazwa": "Supermarine Spitfire MK I",
            "predkosc_max": 6,
            "predkosc_min": 2,
            "sila_ataku": 4,
            "zwrotnosc": 0,
            "udzwig_bomb": null,
            "img": "planes/u_Spit",
            "reduced": {"predkosc_max": 5, "predkosc_min": 2, "sila_ataku": 3, "zwrotnosc": 1}
          }, "at": "A09.B08", "direction": 2, "id": "1.2"
        }]
      }
    }

    expect(planesInFirelane(1)).toEqual([])
  })
});
