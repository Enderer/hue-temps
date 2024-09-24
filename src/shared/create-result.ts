export interface CreateResult {
  data: (CreateSuccess | CreateError)[]
}

export interface CreateError {
  error: {
      address: string,
      description: string,
      type: string
  }
}

export const isCreateError = (r: unknown): r is CreateError => {
  const result = r as CreateError;
  return result?.error !== null;
};

export interface CreateSuccess {
  success: { id: string }
}

export const isCreateSuccess = (r: unknown): r is CreateSuccess => {
  const result = r as CreateSuccess;
  return result?.success != null;
};
