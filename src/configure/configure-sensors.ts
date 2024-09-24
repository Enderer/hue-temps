import { AxiosInstance } from 'axios';
import { createGroup } from './create-group';
import { createLink } from './create-link';
import { createRules } from './create-rules';
import { createScenes } from './create-scenes';
import { HueGroupItem, HueMapping, isGroupItem, isLightItem } from './hue-mapping';
import { SceneLabel, SceneTemps } from '../shared/scene';
import { getSensors } from '../shared/get-sensors';
import { Group, Light } from '../shared';
import { getGroups } from '../shared/get-group';
import { getLights } from '../shared/get-lights';

const sceneTemps: SceneTemps = {
  [SceneLabel.Day]: { temp: 4000 },
  [SceneLabel.Evening]: { temp: 2700 },
  [SceneLabel.Night]: { temp: 2500, brightness: 100 }
};

export const lookupLights = (lookup: Map<string, Light>, lightIds: string[]): Light[] => {
  const lightEntries = lightIds.map(l => ({ l, light: lookup.get(l) }));
  const missing = lightEntries.filter(({ light }) => light == null);
  if (missing.length > 0) {
    const missingIds = missing.map(({ l }) => l);
    throw new Error(`Missing lights data ${JSON.stringify(missingIds)}`);
  }
  return lightEntries.map(({ light }) => light) as Light[];
};

export const lookupGroup = (lookup: Map<string, Group>, groupId: string): Group => {
  const group = lookup.get(groupId);
  if (group == null) { throw new Error(`Missing group ${groupId}`); }
  return group;
};

export const configureSensors = async (
  client: AxiosInstance,
  mapping: HueMapping
): Promise<string[]> => {

  // Load all lights and groups from the hub
  const allLights = await getLights(client);
  const allGroups = await getGroups(client);
  const allSensors = await getSensors(client);

  const lightsLookup = new Map(allLights.map(l => [l.id, l]));
  const groupsLookup = new Map(allGroups.map(g => [g.id, g]));
  const sensorsLookup = new Map(allSensors.map(s => [s.id, s]));

  // Create a new group to wrap each light.
  // Lights cannot have rules and scenes directly attached to them
  // so this group will act as a container to attach rules and scenes.
  const lightItems = mapping.filter(isLightItem);
  const lightIds = [...new Set(lightItems.map(i => i.light))];
  const lightGroups = new Map<string, string>();
  for (const lightId of lightIds) {
    const group = await createGroup(client, lightId);
    groupsLookup.set(group.id, group);
    lightGroups.set(lightId, group.id);
  }
  const lightGroupItems = lightItems.map(({ sensor, side, light: lightId, bri }): HueGroupItem => {
    const group = lightGroups.get(lightId);
    if (group == null) { throw new Error(`Missing group for light ${lightId}`); }
    return { sensor, group, side, bri };
  });

  const groupItems = mapping.filter(isGroupItem);
  const items = [...groupItems, ...lightGroupItems];

  const links: string[] = [];
  for (const item of items) {
    const { sensor: sensorId, group, side } = item;
    const sensor = sensorsLookup.get(sensorId);
    if (sensor == null) { throw new Error(`Missing sensor ${sensorId}`); }
    const group1 = lookupGroup(groupsLookup, group);
    const lights = lookupLights(lightsLookup, group1.lightIds);
    const scenes = await createScenes(sceneTemps, client, group1.id, lights, item.bri);
    const ruleIds = await createRules(client, sensor, side, group1.id, scenes);
    const link = await createLink(client, sensorId, group1.id, group1.lightIds, scenes, ruleIds);
    links.push(link);
  }
  return links;
};
