export interface ViewPlaneInstance {
  id: string;
  plane: { img: string }
  at: string
  direction: number
  altitude?: number
  damaged?: boolean
  destroyed?: boolean
  jammed?: boolean
}