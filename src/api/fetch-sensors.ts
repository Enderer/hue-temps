import { fetchResource } from './fetch-resource.js';

export interface Sensor {
  id: string;
  name: string;
  productName: string;
}

export const fetchSensors = fetchResource('sensors', ({ id, o }): Sensor => {
  const { name, productname: productName } = o as any;
  return { id, name, productName };
});
