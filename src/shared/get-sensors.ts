import { Sensor } from './sensor';
import { getResource } from './get-resource';

export const getSensors = getResource('sensors', ({ id, o }): Sensor => {
  const group = o as any;
  const { name, productname: productName } = group;
  return { id, name, productName };
});
