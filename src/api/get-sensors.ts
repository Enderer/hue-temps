import { getResource } from './get-resource.js';
import { Sensor } from './sensor.js';

export const getSensors = getResource('sensors', ({ id, o }): Sensor => {
  const { name, productname: productName } = o as any;
  return { id, name, productName };
});
