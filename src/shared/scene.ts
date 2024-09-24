export enum SceneLabel { Day = 'day', Evening = 'evening', Night = 'night' }
export type Scenes = { [label in SceneLabel]: string }
export type SceneSettings = { temp: number, brightness?: number }
export type SceneTemps = { [label in SceneLabel]: SceneSettings }
