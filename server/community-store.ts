import {createStore} from './d1.ts';
import type {Board,Action} from '../games/community/index.ts';
export const communityStore=createStore<Board,Action>();
