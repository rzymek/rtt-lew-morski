export interface PlaneReducedStats {
	predkosc_max: number
	predkosc_min: number
	sila_ataku: number
	zwrotnosc: number
	predkosc_max_bez_bomb?: number
}

export interface PlaneData {
	nazwa: string
	lider?: boolean
	predkosc_max: number
	predkosc_min: number
	sila_ataku: number
	zwrotnosc: number
	udzwig_bomb: number | null
	img: string
	predkosc_max_bez_bomb?: number
	reduced: PlaneReducedStats
}

const data: { planes: Record<string, PlaneData> } = {
	planes: {
		Hur: {
			"nazwa": "Hawker Hurricane MK I",
			"predkosc_max": 5,
			"predkosc_min": 2,
			"sila_ataku": 4,
			"zwrotnosc": 0,
			"udzwig_bomb": null,
			"img": "planes/u_Hur",
			"reduced": {
				"predkosc_max": 4,
				"predkosc_min": 2,
				"sila_ataku": 3,
				"zwrotnosc": 1
			}
		},
		HurL: {
			"nazwa": "Hawker Hurricane MK I (Lider)",
			"lider": true,
			"predkosc_max": 5,
			"predkosc_min": 2,
			"sila_ataku": 5,
			"zwrotnosc": 0,
			"udzwig_bomb": null,
			"img": "planes/u_HurL",
			"reduced": {
				"predkosc_max": 4,
				"predkosc_min": 2,
				"sila_ataku": 4,
				"zwrotnosc": 1
			}
		},
		Spit: {
			"nazwa": "Supermarine Spitfire MK I",
			"predkosc_max": 6,
			"predkosc_min": 2,
			"sila_ataku": 4,
			"zwrotnosc": 0,
			"udzwig_bomb": null,
			"img": "planes/u_Spit",
			"reduced": {
				"predkosc_max": 5,
				"predkosc_min": 2,
				"sila_ataku": 3,
				"zwrotnosc": 1
			}
		},
		SpitL: {
			"nazwa": "Supermarine Spitfire MK I (Lider)",
			"lider": true,
			"predkosc_max": 6,
			"predkosc_min": 2,
			"sila_ataku": 5,
			"zwrotnosc": 0,
			"udzwig_bomb": null,
			"img": "planes/u_SpitL",
			"reduced": {
				"predkosc_max": 5,
				"predkosc_min": 2,
				"sila_ataku": 4,
				"zwrotnosc": 1
			}
		},
		ME109: {
			"nazwa": "Me 109 E",
			"predkosc_max": 6,
			"predkosc_min": 2,
			"sila_ataku": 4,
			"zwrotnosc": 0,
			"udzwig_bomb": null,
			"img": "planes/u_ME109",
			"reduced": {
				"predkosc_max": 5,
				"predkosc_min": 2,
				"sila_ataku": 2,
				"zwrotnosc": 1
			}
		},
		ME109L: {
			"nazwa": "Me 109 E (Lider)",
			"lider": true,
			"predkosc_max": 6,
			"predkosc_min": 2,
			"sila_ataku": 4,
			"zwrotnosc": 0,
			"udzwig_bomb": null,
			"img": "planes/u_ME109L",
			"reduced": {
				"predkosc_max": 5,
				"predkosc_min": 2,
				"sila_ataku": 3,
				"zwrotnosc": 1
			}
		},
		ME110: {
			"nazwa": "Me 110 C",
			"predkosc_max": 5,
			"predkosc_min": 3,
			"sila_ataku": 4,
			"zwrotnosc": 1,
			"udzwig_bomb": 1,
			"img": "planes/u_ME110",
			"reduced": {
				"predkosc_max": 4,
				"predkosc_min": 3,
				"sila_ataku": 3,
				"zwrotnosc": 1
			}
		},
		ME110L: {
			"nazwa": "Me 110 C (Lider)",
			"lider": true,
			"predkosc_max": 5,
			"predkosc_min": 3,
			"sila_ataku": 5,
			"zwrotnosc": 1,
			"udzwig_bomb": 1,
			"img": "planes/u_ME110L",
			"reduced": {
				"predkosc_max": 4,
				"predkosc_min": 3,
				"sila_ataku": 4,
				"zwrotnosc": 1
			}
		},
		HE111: {
			"nazwa": "He 111 H-3",
			"predkosc_max": 4,
			"predkosc_min": 3,
			"sila_ataku": 2,
			"zwrotnosc": 2,
			"udzwig_bomb": 2,
			"img": "planes/u_HE111",
			"reduced": {
				"predkosc_max": 3,
				"predkosc_min": 3,
				"sila_ataku": 1,
				"zwrotnosc": 2
			}
		},
		JU88: {
			"nazwa": "Ju 88 A-4",
			"predkosc_max": 4,
			"predkosc_min": 3,
			"sila_ataku": 1,
			"zwrotnosc": 2,
			"udzwig_bomb": 3,
			"img": "planes/u_JU88",
			"predkosc_max_bez_bomb": 5,
			"reduced": {
				"predkosc_max": 3,
				"predkosc_max_bez_bomb": 4,
				"predkosc_min": 3,
				"sila_ataku": 1,
				"zwrotnosc": 2
			}
		}
	}
}

export default data
