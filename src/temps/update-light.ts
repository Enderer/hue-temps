import { AxiosInstance } from 'axios';
import { Light } from '../shared';
import { getCurrentTemp } from './get-current-temp';
import { getTransitionTime } from './get-transition-time';
import { setTemp } from './set-temp';

export const updateLight = async (
  isImmediate: boolean,
  deltaRate: number,
  targetTemp: number,
  client: AxiosInstance,
  l: Light
): Promise<any> => {
  const currentTemp = getCurrentTemp(l);
  const transition = getTransitionTime(deltaRate, targetTemp, currentTemp);
  const t = isImmediate ? 0 : transition;
  if (targetTemp === currentTemp) { return true; }
  const result = await setTemp(t, client, targetTemp, l);
  return result;
};
