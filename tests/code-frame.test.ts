import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {MessageChannel} from 'node:worker_threads';
import {codeFrameDocument} from '../lib/code-frame.ts';
test('opaque game frame waits for matching parent channel and proxies only API data',async()=>{
 const events=new Map<string,Function[]>(),nonce='test-nonce',ports:MessagePort[]=[],messages:any[]=[];
 const parent={postMessage(message:any){assert.equal(message.nonce,nonce);const channel=new MessageChannel();ports.push(channel.port1 as unknown as MessagePort,channel.port2 as unknown as MessagePort);channel.port1.on('message',(data:any)=>{messages.push(data);channel.port1.postMessage({id:data.id,status:200,value:{joined:2}})});queueMicrotask(()=>{for(const listener of events.get('message')||[])listener({source:parent,data:{type:'boardhub-connect',nonce},ports:[channel.port2]})})}};
 const timers=new Set<ReturnType<typeof setTimeout>>();const intervals=new Set<ReturnType<typeof setInterval>>();const context:any={parent,Response,Promise,Map,JSON,Error,document:{getElementById(){return null}},addEventListener(type:string,fn:Function){events.set(type,[...(events.get(type)||[]),fn])},setTimeout(fn:()=>void,time:number){const t=setTimeout(fn,time);timers.add(t);return t},setInterval(fn:()=>void,time:number){const t=setInterval(fn,time);intervals.add(t);return t},clearInterval};
 try{
 const html=codeFrameDocument('<h1>Custom game</h1>','test-nonce','room-1');assert.ok(html.includes("connect-src 'none'"));assert.ok(html.includes('Custom game'));assert.ok(!html.includes('<\\/script>'));
 const script=html.match(/<script>([\s\S]*?)<\/script>/)![1];runInNewContext(script,context);
 const response=await context.fetch('/api/rooms',{method:'POST',body:JSON.stringify({players:2}),headers:{Authorization:'Bearer must-not-forward'}});
 assert.deepEqual(await response.json(),{joined:2});assert.equal(messages[0].path,'/api/rooms');assert.equal(messages[0].body.players,2);assert.equal(messages[0].headers,undefined);assert.equal(context.boardhubRoom,'room-1');
 }finally{for(const t of timers)clearTimeout(t);for(const t of intervals)clearInterval(t);for(const p of ports)p.close()}
});
