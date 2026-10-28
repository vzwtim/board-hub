import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,generateKeyPairSync,verify} from 'node:crypto';
import {CodeGitHub,verifyWebhook} from '../server/code-platform/github.ts';
import {createCodeProject,publishRelease,validateFiles,repositoryInput,type CodeStore,type CodeProject} from '../server/code-platform/model.ts';
const source={'game.ts':'export default {};','ui.html':'<h1>Game</h1>','manifest.json':JSON.stringify({schema:1,sdkVersion:'0.1.0',entry:'game.ts',ui:'ui.html',title:'Game'})};
test('code sources reject traversal, private settings, workflows and unsupported manifests',()=>{
 assert.equal(validateFiles(source)['game.ts'],source['game.ts']);
 for(const path of ['../escape.ts','.env.json','.github/workflows/run.js','folder/../../escape.ts','folder\\game.ts'])assert.throws(()=>validateFiles({...source,[path]:'bad'}));
 assert.throws(()=>validateFiles({...source,'manifest.json':'{}'}));
 assert.throws(()=>repositoryInput({fullName:'https://evil.invalid/repo',branch:'main',directory:''}));
 assert.throws(()=>repositoryInput({fullName:'owner/repo',branch:'main',directory:'../outside'}));
});
test('GitHub App signs JWTs, verifies repo challenge and commits only into game directory',async()=>{
 const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048}),calls:{path:string;body:any}[]=[],challenge='proof-value';
 const project={id:'project-1',challenge} as CodeProject;
 const request:typeof fetch=async(input,init)=>{const path=new URL(String(input)).pathname,headers=new Headers(init?.headers),body=init?.body?JSON.parse(String(init.body)):undefined;calls.push({path,body});
  if(path.endsWith('/installation')){const jwt=headers.get('authorization')!.slice(7).split('.');assert.ok(verify('RSA-SHA256',Buffer.from(jwt[0]+'.'+jwt[1]),publicKey,Buffer.from(jwt[2],'base64url')));return Response.json({id:9})}
  if(path.endsWith('/access_tokens'))return Response.json({token:'test-installation-token'});
  assert.equal(headers.get('authorization'),'Bearer test-installation-token');
  if(path.includes('/git/ref/heads/'))return Response.json({object:{sha:'a'.repeat(40)}});
  if(path.endsWith('/git/commits/'+'a'.repeat(40)))return Response.json({tree:{sha:'b'.repeat(40)}});
  if(path.endsWith('/git/trees/'+'b'.repeat(40)))return Response.json({tree:[{path:'game/boardhub-link.json',mode:'100644',type:'blob',sha:'proof',size:100}]});
  if(path.endsWith('/git/blobs/proof'))return Response.json({encoding:'base64',content:Buffer.from(JSON.stringify({project:project.id,challenge})).toString('base64')});
  if(path.endsWith('/git/trees')){assert.ok(body.tree.every((e:any)=>e.path.startsWith('game/')));return Response.json({sha:'c'.repeat(40)})}
  if(path.endsWith('/git/commits'))return Response.json({sha:'d'.repeat(40)});
  if(path.includes('/git/refs/heads/')){assert.equal(body.force,false);return Response.json({})}
  throw Error('Unexpected GitHub endpoint '+path);
 };
 const client=new CodeGitHub({appID:'123',privateKey:privateKey.export({type:'pkcs8',format:'pem'}).toString()},request);
 const repo=await client.connect(project,{fullName:'owner/repo',branch:'main',directory:'game'});assert.equal(repo.installation,9);
 assert.equal(await client.upload(repo,source,{'obsolete.ts':'old'}),'d'.repeat(40));
 const tree=calls.find(x=>x.path.endsWith('/git/trees'))!.body.tree;assert.ok(tree.some((x:any)=>x.path==='game/obsolete.ts'&&x.sha===null));
 await assert.rejects(()=>client.connect({...project,challenge:'wrong'},{fullName:'owner/repo',branch:'main',directory:'game'}),/接続ファイル/);
});
test('webhooks need exact HMAC over raw body',()=>{const body='{"ref":"refs/heads/main"}',secret='webhook-secret',signature='sha256='+createHmac('sha256',secret).update(body).digest('hex');assert.equal(verifyWebhook(secret,body,signature),true);assert.equal(verifyWebhook(secret,body+' ',signature),false);assert.equal(verifyWebhook(undefined,body,signature),false)});
test('publication requires ownership, a ready release and current revision',async()=>{
 let saved:CodeProject|undefined;const store={async listProjects(){return []},async createProject(p:CodeProject){saved=structuredClone(p)},async getProject(){return saved?structuredClone(saved):null},async getRelease(project:string,id:string){return id==='ready'?{id,status:'ready'}:{id,status:'failed'}},async replaceProject(p:CodeProject,revision:number){if(saved?.revision!==revision)return false;saved=structuredClone(p);return true}} as unknown as CodeStore;
 const p=await createCodeProject(store,{id:'owner',name:'Author'},'New game');
 await assert.rejects(()=>publishRelease(store,p.id,'other',{release:'ready',listed:true,expectedRevision:1}));
 await assert.rejects(()=>publishRelease(store,p.id,'owner',{release:'failed',listed:true,expectedRevision:1}));
 await assert.rejects(()=>publishRelease(store,p.id,'owner',{release:'ready',listed:true,expectedRevision:0}));
 const next=await publishRelease(store,p.id,'owner',{release:'ready',listed:true,expectedRevision:1});assert.equal(next.published,'ready');assert.equal(next.revision,2);
});
