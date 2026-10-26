import {createStore} from './d1.ts';
import type {Board,Action} from '../games/tabletop/index.ts';
import type {Seat} from '../games/frontier/index.ts';
export const tabletopStore=createStore<Board,Action,Seat>();
