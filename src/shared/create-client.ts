import axios, { AxiosInstance } from 'axios';

export const createClient = (ipAddress: string, user: string): AxiosInstance => {
  const client = axios.create({ baseURL: `http://${ipAddress}/api/${user}` });
  return client;
};
