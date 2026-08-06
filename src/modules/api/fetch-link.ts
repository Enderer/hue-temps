import { Mapper } from './fetch-resource.js';

export interface Link {
  id: string;
}

export const mapLink: Mapper<Link> = ({ id, o }) => {
  const a = o as any;
  return { id, ...a };
};
