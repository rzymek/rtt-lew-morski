export const roles = ["Niemcy", "Brytyjczycy"] as const;
export type Player = typeof roles[number];