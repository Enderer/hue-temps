import { CreateResult, isCreateSuccess } from './create-result';

export const getResult = (result: CreateResult): string => {
  const data = result?.data[0];
  if (isCreateSuccess(data)) { return data.success.id; }
  throw new Error(`Invalid create result ${JSON.stringify(result)}`);
};
