import { init as alertInit } from './alert.js';
import { init as configInit } from './config.js';
import { init as connectInit } from './connect.js';
import { init as listInit } from './list.js';
export * from './init.js';

export const alert = { init: alertInit };
export const config = { init: configInit };
export const connect = { init: connectInit };
export const list = { init: listInit };
