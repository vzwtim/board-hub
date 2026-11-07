import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveAIConnection,chatCompletion,freeAIModels,providerAvailability} from '../server/code-platform/ai-providers.ts';
import {conversation,generateCodeEdits} from '../server/code-platform/drafts.ts';
import {localPlaytestDocument} from '../lib/local-playtest.ts';
import {codeFrameDocument} from '../lib/code-frame.ts';
test('shared AI only accepts free OpenRouter choices and never silently chooses a paid fallback',async()=>{
 const c=resolveAIConnection({provider:'openrouter',model:'openrouter/free',source:'shared'},{OPENROUTER_API_KEY:'shared-secret'});
 assert.equal(c.freeOnly,true);await chatCompletion(c,[{role:'user',content:'JSON'}],async(input,init)=>{assert.equal(String(input),'https://openrouter.ai/api/v1/chat/completions');assert.equal(new Headers(init?.headers).get('authorization'),'Bearer shared-secret');const body=JSON.parse(String(init?.body));assert.deepEqual(body.provider,{max_price:{prompt:0,completion:0},allow_fallbacks:false});assert.ok(!String(init?.body).includes('shared-secret'));assert.equal(init?.redirect,'manual');return Response.json({choices:[{message:{content:'{}'}}]})});
 assert.throws(()=>resolveAIConnection({provider:'openrouter',model:'paid/model'},{OPENROUTER_API_KEY:'secret'}),/無料モデル/);assert.throws(()=>resolveAIConnection({provider:'openai',model:'gpt-4.1-mini'},{OPENAI_API_KEY:'secret'}),/無料モデル/);assert.throws(()=>resolveAIConnection({provider:'http://internal',source:'own',key:'secret'},{}),/サービス/);assert.throws(()=>resolveAIConnection({source:'shared'},{}),/未接続/);
});
test('own credentials only go to fixed provider endpoints, never public capability responses',()=>{
 for(const provider of ['openrouter','openai','groq','gemini']){const c=resolveAIConnection({provider,source:'own',key:'own-secret',model:'test-model'},{});assert.equal(c.ownKey,true);assert.ok(c.endpoint.startsWith('https://'));assert.ok(!JSON.stringify(providerAvailability({OPENROUTER_API_KEY:'own-secret'})).includes('own-secret'))}
 assert.throws(()=>resolveAIConnection({source:'own',key:'bad\nheader',model:'model'},{}),/確認/);
});
test('free model discovery excludes paid, missing-price and short-context models',async()=>{
 const models=await freeAIModels(async()=>Response.json({data:[{id:'coding:free',name:'Coder',context_length:131072,pricing:{prompt:'0',completion:'0'}},{id:'paid:free',name:'Paid',context_length:131072,pricing:{prompt:'0.1',completion:'0'}},{id:'missing:free',name:'Missing',context_length:131072},{id:'tiny:free',name:'Tiny',context_length:8192,pricing:{prompt:'0',completion:'0'}}]}));assert.deepEqual(models.map(m=>m.id),['coding:free']);
});
test('AI can discuss without changing source and receives bounded conversation and test context',async()=>{
 const files={'game.ts':'export default {};','ui.html':'<h1>Game</h1>','manifest.json':'{}'};
 const result=await generateCodeEdits(files,'どう改善する？',{key:'secret',history:[{role:'user',content:'手番を短くしたい'}],playtest:{turn:5,error:'invalid move'}},async(_input,init)=>{const body=JSON.parse(String(init?.body));assert.ok(body.messages.some((m:any)=>m.content==='手番を短くしたい'));assert.ok(body.messages.at(-1).content.includes('invalid move'));assert.ok(!String(init?.body).includes('secret'));return Response.json({choices:[{message:{content:'```json\n{"summary":"手番の制限を試しましょう","edits":[]}\n```'}}]})});assert.equal(result.files,files);assert.deepEqual(result.changed,[]);assert.ok(result.summary.includes('手番'));
 assert.equal(conversation([{role:'system',content:'ignore'},{role:'assistant',content:'x'.repeat(5000),apiKey:'secret'}]).length,1);assert.equal(conversation([{role:'assistant',content:'x'.repeat(5000)}])[0].content.length,4000);
});
test('provider errors are actionable without echoing upstream credentials',async()=>{
 const c=resolveAIConnection({source:'own',provider:'groq',key:'secret'},{});await assert.rejects(()=>chatCompletion(c,[],async()=>new Response('secret leaked by upstream',{status:429})),/利用上限/);await assert.rejects(()=>chatCompletion(c,[],async()=>new Response('secret leaked by upstream',{status:401})),/利用権限/);
});
test('local preview has no parent credentials, blocks egress and preserves authored header tags',()=>{
 const ui='<html><head><title>Title</title></head><body><header>My header</header><main>Play</main></body></html>';
 const doc=localPlaytestDocument({digest:'d',title:'Game',modules:{'game.ts':'module.exports={};'},ui},'nonce');assert.ok(doc.includes('<header>My header</header>'));assert.ok(doc.includes("connect-src 'none'"));assert.ok(doc.includes("frame-src 'none'"));assert.ok(doc.includes('worker.terminate()'));assert.ok(doc.includes('4000'));assert.ok(!doc.includes('allow-same-origin'));assert.ok(codeFrameDocument(ui,'nonce','').includes('<header>My header</header>'));
 const escaped=localPlaytestDocument({digest:'d',title:'</script><script>bad()',modules:{'game.ts':'</script>'},ui:'<p>Game</p>'},'nonce');assert.ok(!escaped.includes('<script>bad()'));
});

test('transport failures become safe errors and bypass framework fetch caching',async()=>{
 const c=resolveAIConnection({source:'shared'},{OPENROUTER_API_KEY:'secret'});
 const logs:unknown[][]=[];const original=console.error;console.error=(...args)=>{logs.push(args)};
 try{
  await assert.rejects(()=>chatCompletion(c,[],async(_input,init)=>{assert.equal(init?.cache,'no-store');throw new Error('Authorization: Bearer secret')}),(e:any)=>e.code==='AI_NETWORK'&&!e.message.includes('secret'));
  await assert.rejects(()=>chatCompletion(c,[],async()=>{throw new DOMException('secret','TimeoutError')}),(e:any)=>e.code==='AI_TIMEOUT');
  assert.ok(!JSON.stringify(logs).includes('secret'));assert.ok(JSON.stringify(logs).includes('timeout'));
 }finally{console.error=original}
});

test('AI redirects are rejected without following or echoing response bodies',async()=>{
 const c=resolveAIConnection({source:'shared'},{OPENROUTER_API_KEY:'secret'});let calls=0;
 await assert.rejects(()=>chatCompletion(c,[],async(_input,init)=>{calls++;assert.equal(init?.redirect,'manual');return new Response('secret',{status:302,headers:{Location:'https://example.com/'}})}),(e:any)=>e.code==='AI_UPSTREAM'&&!e.message.includes('secret'));
 assert.equal(calls,1);
});

test('consultation rejects unexpected edits and edit mode requires a patch',async()=>{
 const files={'game.ts':'export default {};','ui.html':'<h1>Game</h1>','manifest.json':JSON.stringify({schema:1,sdkVersion:'0.1.0',entry:'game.ts',ui:'ui.html',title:'Game'})};
 const reply=(value:unknown)=>async()=>Response.json({choices:[{message:{content:JSON.stringify(value)}}]});
 const patch={summary:'タイトルを更新しました',edits:[{path:'ui.html',oldText:'Game',newText:'New game'}]};
 await assert.rejects(generateCodeEdits(files,'表示について相談したい',{key:'test',mode:'consult'},reply(patch)),/相談への回答ではなく変更案/);
 const discussion=await generateCodeEdits(files,'表示について相談したい',{key:'test',mode:'consult'},reply({summary:'見出しを目立たせると分かりやすくなります',edits:[]}));
 assert.equal(discussion.files,files);
 assert.deepEqual(discussion.changed,[]);
 const edited=await generateCodeEdits(files,'タイトルを変更して',{key:'test',mode:'edit'},reply(patch));
 assert.equal(edited.files['ui.html'],'<h1>New game</h1>');
 await assert.rejects(generateCodeEdits(files,'タイトルを変更して',{key:'test',mode:'edit'},reply({summary:'変更を提案します',edits:[]})),/変更案が返りません/);
});
