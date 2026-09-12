export interface ViewPlaneInstance {
  plane: { img: string }
  at: string
  direction: number
  damaged?: boolean
  destroyed?: boolean
  jammed?: boolean
}