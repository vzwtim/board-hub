import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GameAudio} from '../lib/game-audio.ts';
test('sound requires interaction unlock; mute and hidden tabs emit no cues; volume routes through gain',()=>{
 const originalCtx=globalThis.AudioContext,originalDocument=globalThis.document;let starts=0,contexts=0;const gains:number[]=[];
 const param={setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(v:number){gains.push(v)}};
 class FakeContext {state='running';currentTime=0;destination={};constructor(){contexts++}createGain(){return {gain:{...param,value:0},connect(){},disconnect(){}}}createOscillator(){return {type:'sine',frequency:param,connect(){},disconnect(){},start(){starts++},stop(){},onended:null}}}
 globalThis.AudioContext=FakeContext as unknown as typeof AudioContext;
 Object.defineProperty(globalThis,'document',{value:{hidden:false},configurable:true});
 try{const audio=new GameAudio();audio.play('sow');assert.equal(contexts,0);assert.equal(starts,0);audio.unlock();audio.play('sow');assert.equal(contexts,1);assert.equal(starts,2);audio.preferences(false,.35);audio.play('capture');assert.equal(starts,2);assert.equal(gains.at(-1),0);audio.preferences(true,.2);assert.equal(gains.at(-1),.2);audio.play('extra');assert.equal(starts,4);Object.defineProperty(globalThis,'document',{value:{hidden:true},configurable:true});audio.play('finish');assert.equal(starts,4);audio.stop()}finally{globalThis.AudioContext=originalCtx;Object.defineProperty(globalThis,'document',{value:originalDocument,configurable:true})}
});
