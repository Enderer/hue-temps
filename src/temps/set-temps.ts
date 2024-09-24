import { AxiosInstance } from 'axios';
import { CalendarDate, Light } from '../shared';
import { getLightsToChange } from './get-lights-to-change';
import { TargetTemp } from './target-temp';
import { updateLight } from './update-light';

export interface SetTempParams {
  isImmediate: boolean;
  deltaRate: number;
  offset: number;
  zone: string;
  client: AxiosInstance;
  now: CalendarDate;
  targetTemp: TargetTemp;
}

export const setTemps = async (params: SetTempParams): Promise<any[]> => {
  const { deltaRate, isImmediate, zone, client, targetTemp, now } = params;
  const target = targetTemp(now.time);
  const lights = await getLightsToChange(client, zone);
  const ul = (l: Light) => updateLight(isImmediate, deltaRate, target, client, l);
  const results = await Promise.all(lights.map(ul));
  return results;
};
