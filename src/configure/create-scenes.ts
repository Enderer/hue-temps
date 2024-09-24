import { AxiosInstance } from 'axios';
import { getResult, Light, LightState } from '../shared';
import { kelvinToMired } from '../shared/kelvin-to-mired';
import { SceneLabel, Scenes, SceneTemps } from '../shared/scene';

export interface CreateScenes {
  (
    sceneTemps: SceneTemps,
    client: AxiosInstance,
    groupId: string,
    lights: Light[],
    bri?: number
  ): Promise<Scenes>
}

const getState = (brightness: number, temp: number, light: Light): LightState => {
  const state: LightState = { on: true };

  // Check if the bulb allows you to set the brightness
  if (light?.capabilities?.control?.maxlumen) {
    const MAX_BRIGHTNESS = 254;
    let bri = Number.isNaN(brightness) ? MAX_BRIGHTNESS : brightness;
    bri = Math.min(MAX_BRIGHTNESS, bri);
    bri = Math.max(0, bri);
    state.bri = bri;
  }

  // Check if the bulb lets you set the color temperature
  if (light?.capabilities?.control?.ct) {
    state.ct = kelvinToMired(temp);
  }
  return state;
};

const getScene = (
  group: string,
  lights: Light[],
  label: SceneLabel,
  brightness: number,
  temp: number
) => {

  const ls = (states: any, l: Light) => ({ ...states, [l.id]: getState(brightness, temp, l) });
  const lightstates = lights.reduce(ls, {});

  return {
    name: `scene-group-${group}-${label}`,
    type: 'GroupScene',
    recycle: true,
    appdata: { version: 1, data: '6464' },
    group,
    lightstates
  };
};

export interface SceneEntry {
  label: SceneLabel,
  sceneId: string;
}

export const getSceneEntries = (scenes: Scenes): SceneEntry[] => {
  return Object.entries(scenes).map(e => ({ label: e[0] as SceneLabel, sceneId: e[1] }));
};

export const createScenes: CreateScenes = async (
  sceneTemps,
  client,
  groupId,
  lights,
  bri?: number
): Promise<Scenes> => {
  const entries = Object.entries(sceneTemps).map(e => ({ l: e[0] as SceneLabel, t: e[1] }));
  const scenes = {} as Scenes;
  for (const e of entries) {
    const label = e.l;
    const brightness = bri ?? e.t.brightness ?? 254;
    const { temp } = e.t;
    const scene = getScene(groupId, lights, label, brightness, temp);
    const sceneId = getResult(await client.post('/scenes', scene));
    scenes[e.l] = sceneId;
  }
  return scenes;
};
