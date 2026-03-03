import { init as alertInit } from './alert.js';
import { init as connectInit } from './connect.js';
import { init as listInit } from './list.js';
export * from './init.js';

export const alert = { init: alertInit };
export const connect = { init: connectInit };
export const list = { init: listInit };
