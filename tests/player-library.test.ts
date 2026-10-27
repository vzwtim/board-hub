import test from 'node:test';
import assert from 'node:assert/strict';
import {parseVisits,recentVisits} from '../lib/player-library.ts';
test('play history ignores damaged storage and removed games',()=>{for(const v of [null,{},'bad',7])assert.deepEqual(parseVisits(v),[]);assert.deepEqual(parseVisits([null,{},'bad',{id:'unknown',date:'2026-10-27'},{id:'kalah',date:99},{id:'kalah',date:'yesterday'},{id:'kalah',date:'2026-10-27'}]),[{id:'kalah',date:'2026-10-27'}])});
test('recent games use the latest date and last played order within a day',()=>{const visits=[{id:'kalah',date:'2026-10-26'},{id:'connect4',date:'2026-10-27'},{id:'kalah',date:'2026-10-27'},{id:'reversi',date:'2026-10-25'}];assert.deepEqual(recentVisits(visits),[{id:'kalah',date:'2026-10-27'},{id:'connect4',date:'2026-10-27'},{id:'reversi',date:'2026-10-25'}]);assert.equal(visits.length,4)});
