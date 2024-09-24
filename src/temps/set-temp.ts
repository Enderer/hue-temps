import { AxiosInstance, AxiosResponse } from 'axios';
import { Light } from '../shared';
import { kelvinToMired } from '../shared/kelvin-to-mired';
import { setState } from './set-state';

export async function setTemp(
  transition: number,
  client: AxiosInstance,
  temp: number,
  light: Light
): Promise<AxiosResponse<any>> {

  const ct = light?.capabilities?.control?.ct;
  const max = ct?.max ?? 500;
  const min = ct?.min ?? 153;
  const mired = kelvinToMired(temp, min, max);
  const result = await setState(client, light.id, mired, transition);
  return result;
}
