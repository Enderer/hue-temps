import { Mapper } from './fetch-resource.js';

export interface Sensor {
  id: string;
  name: string;
  productName: string;
}

export const mapSensors: Mapper<Sensor> = ({ id, o }) => {
  const { name, productname: productName } = o as any;
  return { id, name, productName };
};
