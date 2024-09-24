import { AxiosInstance } from 'axios';
import { getResult, Sensor } from '../shared';
import { buildRulesButton, Rule } from './create-rules-button';
import { buildRulesSwitch } from './create-rules-switch';
import { SwitchSide } from './hue-mapping';
import { Scenes } from '../shared/scene';

export interface CreateRules {
  (
    client: AxiosInstance,
    sensor: Sensor,
    side: SwitchSide | undefined,
    groupId: string,
    scenes: Scenes
  ): Promise<string[]>
}

async function toIter(func: any, args: any[]) {
  const results = [];
  for (const arg of args) {
    const result = await func(arg);
    results.push(result);
  }
  return results;
}

export const createRules: CreateRules = async (client, sensor, side, groupId, scenes) => {
  const rules = buildRules(sensor, side, groupId, scenes);
  const callback = async (r: any) => getResult(await client.post('/rules', r));
  const results = await toIter(callback, rules);
  return results;
};

export const buildRules = (
  sensor: Sensor,
  side: SwitchSide | undefined,
  groupId: string,
  scenes: Scenes
): Rule[] => {
  switch (sensor.productName) {
    case 'Hue Smart button':
      return buildRulesButton(sensor.id, groupId, scenes);
    case 'Friends of Hue Switch':
      if (side == null) { throw new Error(`Switch requires side ${JSON.stringify(sensor)}`); }
      return buildRulesSwitch(sensor.id, side, groupId, scenes);
    default: throw new Error(`Sensor not supported. ${JSON.stringify(sensor)}`);
  }
};
