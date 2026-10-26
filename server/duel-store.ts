import {createStore} from './d1.ts';
import type {Board,Action} from '../games/duels/index.ts';
export const duelStore=createStore<Board,Action>();
