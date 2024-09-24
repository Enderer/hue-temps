import { AxiosInstance } from 'axios';
import { getGroups, getLights, Light } from '../shared';

/**
 * Get all the lights that should have their color temperature updated.
 * This will be any light that is part of the defined group that is currenlty turned on
 */
export async function getLightsToChange(
  client: AxiosInstance,
  zone: string
): Promise<Light[]> {
  const groups = await getGroups(client);
  const group = groups.filter(g => g.name === zone);
  if (!(group.length === 1)) {
    throw new InvalidGroupError(zone);
  }

  const hueGroup = group[0];
  const groupLights = hueGroup.lightIds;
  const allLights = await getLights(client);
  const filter = filterAll(groupLights);
  const lights = allLights.filter(filter);
  return lights;
}

export class InvalidGroupError extends Error {
  constructor(zone: string) {
    super(`Falied to find group. ${zone}`);
    Object.setPrototypeOf(this, InvalidGroupError.prototype);
  }
}
const filterAll = (g: string[]) => (l: Light) => l?.capabilities?.control?.ct != null
  && l?.state?.on === true
  && g.includes(l.id);
