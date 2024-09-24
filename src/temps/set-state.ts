import { AxiosInstance, AxiosResponse } from 'axios';

/**
 * Set the state for a given light
 * @param client Client to connect to hue api
 * @param id Light id
 * @param ct Color temperature
 * @param t Amount of time to transition state
 */
export const setState = async (
  client: AxiosInstance,
  id: string,
  ct: number,
  t: number
): Promise<AxiosResponse<any>> => {

  const url = `/lights/${id}/state`;
  const transition = t / 100;
  const isValidTransition = transition > 0 && !Number.isNaN(transition);
  const transitiontime = isValidTransition ? transition : undefined;
  const state = { ct, transitiontime };
  const result = await client.put(url, state);
  return result;
};
