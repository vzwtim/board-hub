import {isleworksFiles} from '../../code-kit/bundle.ts';
import {compileLocalPreview} from '../../server/code-platform/local-preview.ts';
import {localPlaytestDocument} from '../../lib/local-playtest.ts';
import {createContext,runInContext} from 'node:vm';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const files=isleworksFiles();delete files['runtime/server.mjs'];
const preview=compileLocalPreview(files),html=localPlaytestDocument(preview,'smoke');
assert.ok(html.includes("connect-src 'none'"));assert.ok(html.includes('new Worker('));
// Run the exact browser-worker payload against the actual starter, without a
// browser or server bindings. This verifies CJS linking and the game contract.
const bootstrap=html.match(/<script>([\s\S]*?)<\/script>/)![1];
const workerLiteral=bootstrap.match(/new Blob\(\[("(?:[^"\\]|\\.)*")\]/)![1],workerSource=JSON.parse(workerLiteral);
const replies:any[]=[];const context=createContext({Request,Response,crypto,structuredClone,postMessage:(v:any)=>replies.push(v)});runInContext(workerSource,context);
async function call(path:string,body?:unknown){const id=replies.length+1;runInContext('onmessage('+JSON.stringify({data:{id,path,body}})+')',context);for(let i=0;i<100&&!replies.some(v=>v.id===id);i++)await new Promise(r=>setTimeout(r,5));const response=replies.find(v=>v.id===id);assert.ok(response,'worker did not answer');assert.equal(response.status,200,JSON.stringify(response));return response.value}
const metadata=await call('/api/release');assert.equal(metadata.id,'frontier');const start=await call('/api/rooms',{players:2});assert.equal(start.joined,2);assert.equal(start.state.phase,'playing');const next=await call('/api/rooms/local',{type:'suggest',expectedRevision:start.state.revision});assert.equal(next.state.revision,start.state.revision+1);assert.equal(next.playerID,next.state.currentPlayer);assert.equal(next.state.events.length,0);assert.ok(!('DB' in context));
if(process.argv.includes('--fixture'))writeFileSync('work/vibe-fixture-data.json',JSON.stringify({preview,files}));
console.log('PASS: compiled starter runs in browser-worker payload, switches active seats, advances revision and projects views without server bindings');
