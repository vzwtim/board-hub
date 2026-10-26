import {createStore} from './d1.ts';
import type {IslandBoard,IslandAction} from '../games/isleworks/index.ts';
export const islandStore=createStore<IslandBoard,IslandAction>();
