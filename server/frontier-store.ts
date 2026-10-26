import {createStore} from './d1.ts';
import type {Board,Action,Seat} from '../games/frontier/index.ts';
export const frontierStore=createStore<Board,Action,Seat>();
