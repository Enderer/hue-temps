import { Light } from '../../api/fetch-lights.js';
import { Store } from '../../api/store.js';
import { createLogger } from '../../shared/logger.js';

const logger = createLogger('commands.alert');

export const alert =
  (store: Store) =>
  async (id: string): Promise<void> => {
    logger.debug(`Alert light ${id} - start`);
    const lights = await store.lights();
    const light = matchLight(lights, id);
    if (light == null) {
      throw new Error(`No light found matching '${id}'`);
    }
    const response = await store.api.alert(light.id);
    logger.info(`Alert light ${id} - complete: ${JSON.stringify(response)}`);
  };

const matchLight = (lights: Light[], id: string): Light | undefined => {
  // Find by id
  const lightsById = lights.filter((l) => l.id === id);
  if (lightsById.length > 1) {
    throw new Error(`Multiple lights found with id ${id}`);
  }
  if (lightsById.length === 1) {
    return lightsById[0];
  }

  // Find by exact name
  const lightsByName = lights.filter((l) => l.name === id);
  if (lightsByName.length > 1) {
    throw new Error(`Multiple lights found with name ${id}`);
  }
  if (lightsByName.length === 1) {
    return lightsByName[0];
  }

  // Find by fuzzy name
  const fuzzyMatch = (l: Light) => l.name.toLocaleLowerCase() === id.toLocaleLowerCase();
  const lightsByFuzzyName = lights.filter(fuzzyMatch);
  if (lightsByFuzzyName.length > 1) {
    throw new Error(`Multiple lights found with name ${id} (case insensitive)`);
  }
  if (lightsByFuzzyName.length === 1) {
    return lightsByFuzzyName[0];
  }

  return undefined;
};
