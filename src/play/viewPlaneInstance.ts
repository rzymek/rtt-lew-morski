export interface ViewPlaneInstance {
  id: string;
  plane: { img: string, udzwig_bomb: number | null }
  at: string
  direction: number
  altitude?: number
  damaged?: boolean
  destroyed?: boolean
  jammed?: boolean
  bombs_dropped?: number
}