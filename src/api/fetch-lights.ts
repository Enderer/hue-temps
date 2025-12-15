import { fetchResource } from './fetch-resource.js';
const TEMP_MIRED_DEFAULT = 370;

export interface Light {
  id: string;
  name: string;
  productName: string;
  on: boolean;
  reachable?: boolean;
  temp: number;
  tempMin: number;
  tempMax: number;
}

/**
 * Retrieves lights from the Hue api
 */
export const fetchLights = fetchResource('lights', ({ id, o }) => {
  const row = o as any;
  const name = row.name;
  const productName = row.productname ?? '';
  const reachable = row.state?.reachable ?? true;
  const on = row.state?.on ?? false;
  const temp = row.state?.ct ?? TEMP_MIRED_DEFAULT;
  const tempMin = row.capabilities?.control?.ct?.min ?? temp;
  const tempMax = row.capabilities?.control?.ct?.max ?? temp;
  const light: Light = { id, name, productName, reachable, on, temp, tempMin, tempMax };
  return light;
});
