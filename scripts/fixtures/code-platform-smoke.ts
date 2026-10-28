import {isleworksFiles} from '../../code-kit/bundle.ts';
import {createCodeProject,publishRelease,type CodeStore,type CodeProject,type CodeRelease} from '../../server/code-platform/model.ts';
import {sourceOperation,processPush} from '../../server/code-platform/sources.ts';
import {sandboxCall,compileCode} from '../../server/code-platform/compiler.ts';
import {createCodeRoom,actCodeRoom,getCodeRoom,type CodeRoom,type CodeRoomStore} from '../../server/code-platform/rooms.ts';
import {CodeGitHub} from '../../server/code-platform/github.ts';
function assert(value:unknown,message:string){if(!value)throw Error(message)}
export default {async fetch(request:Request,env:{CODE_LOADER:WorkerLoader}){try{
 const projects=new Map<string,CodeProject>(),releases=new Map<string,CodeRelease>(),roomMap=new Map<string,CodeRoom>(),delivery=new Set<string>();
 const clone=<T>(x:T):T=>structuredClone(x);
 const store:CodeStore={async getProject(id){return clone(projects.get(id)||null)},async createProject(p){projects.set(p.id,clone(p))},async replaceProject(p,revision){if(projects.get(p.id)?.revision!==revision)return false;projects.set(p.id,clone(p));return true},async listProjects(owner){return [...projects.values()].filter(p=>owner?p.owner===owner:p.listed).map(clone)},async getRelease(project,id){const r=releases.get(id);return r&&r.project===project?clone(r):null},async saveRelease(r){if(releases.get(r.id)?.status!=='ready')releases.set(r.id,clone(r))},async listReleases(project){return [...releases.values()].filter(r=>r.project===project).map(r=>{const {files,ui,modules,...v}=r;return clone(v)})},async claimDelivery(id){if(delivery.has(id))return false;delivery.add(id);return true},async forgetDelivery(id){delivery.delete(id)},async repositoryProjects(name){return [...projects.values()].filter(p=>p.repository?.fullName===name).map(clone)}};
 const rooms:CodeRoomStore={async get(id){return clone(roomMap.get(id)||null)},async create(r){roomMap.set(r.id,clone(r))},async replace(r,revision){if(roomMap.get(r.id)?.revision!==revision)return false;roomMap.set(r.id,clone(r));return true}};
 const files=isleworksFiles();delete files['runtime/server.mjs'];
 let pushed=0,remote=files,commit='a'.repeat(40);
 class FakeGitHub extends CodeGitHub {constructor(){super({})}async managed(p:CodeProject){return {fullName:'test/game-storage',branch:'main',directory:'projects/'+p.id,installation:1,managed:true}}async upload(repository:any,next:any){pushed++;remote=clone(next);return commit}async read(){return {files:clone(remote),commit,tree:'b'.repeat(40)}}}
 const github=new FakeGitHub(),owner={id:'owner',name:'Author'},p=await createCodeProject(store,owner,'コード作品');
 const uploaded=await sourceOperation(store,github,env.CODE_LOADER,p.id,owner.id,{type:'upload',files,expectedRevision:1});
 assert(pushed===1,'upload must commit to GitHub');assert(uploaded.release.status==='ready','upload not ready: '+uploaded.release.error);
 const first=uploaded.release;
 await publishRelease(store,p.id,owner.id,{release:first.id,listed:true,expectedRevision:uploaded.project.revision});
 const a=await createCodeRoom(store,rooms,env.CODE_LOADER,p.id,first.id,'alice',2),b=await actCodeRoom(store,rooms,env.CODE_LOADER,a.id,first.id,'bob','',{type:'join'});
 assert(a.token&&'token' in b&&b.token,'tokens required');
 const current=b.state.currentPlayer,token=current==='0'?a.token:('token' in b?b.token:''),name=current==='0'?'alice':'bob';
 const command={type:'suggest',id:'smoke-action-1',expectedRevision:b.state.revision};
 const next=await actCodeRoom(store,rooms,env.CODE_LOADER,a.id,first.id,name,token,command);
 assert(next.state.revision===b.state.revision+1,'revision must advance');
 const retry=await actCodeRoom(store,rooms,env.CODE_LOADER,a.id,first.id,name,token,command);assert(retry.state.revision===next.state.revision,'retry duplicated');
 const spectator=await getCodeRoom(store,rooms,env.CODE_LOADER,a.id,first.id,'','viewer');assert(spectator.playerID===null&&spectator.state.events.length===0,'private projection failed');assert(!JSON.stringify(spectator).includes(a.token),'token leaked');
 const updated=clone(files);updated['ui.html']=updated['ui.html'].replace('コード試遊','派生版の試遊');updated['game.ts']+='\ngame.definition={...game.definition,id:"sea-expansion",version:"1.0.0"};\n';remote=updated;commit='c'.repeat(40);
 await processPush(store,github,env.CODE_LOADER,{installation:{id:1},repository:{full_name:'test/game-storage'},ref:'refs/heads/main'});
 const versions=await store.listReleases(p.id);assert(versions.length===2,'push did not create release');assert((await store.getProject(p.id))?.published===first.id,'push must not auto-publish');
 const second=versions.find(r=>r.id!==first.id)!;assert(second.status==='ready','fork failed');const np=(await store.getProject(p.id))!;
 await publishRelease(store,p.id,owner.id,{release:second.id,listed:true,expectedRevision:np.revision});
 const old=await getCodeRoom(store,rooms,env.CODE_LOADER,a.id,first.id,a.token,'alice');assert(old.state.gameID==='frontier','old room changed code');
 const fresh=await createCodeRoom(store,rooms,env.CODE_LOADER,p.id,second.id,'alice',2);assert(fresh.state.gameID==='sea-expansion','new release not used');
 let externalRejected=false;try{compileCode({...files,'game.ts':"import fs from 'node:fs'; export default fs;"})}catch{externalRejected=true}assert(externalRejected,'external module accepted');
 const isolated=await sandboxCall(env.CODE_LOADER,{digest:'isolation-check',modules:{'__boardhub_host.js':{js:'export default {async fetch(r,env){let blocked=false;try{await fetch("https://example.com")}catch{blocked=true}return Response.json({blocked,bindings:Object.keys(env)})}}'}}},{type:'metadata'});assert(isolated.blocked&&isolated.bindings.length===0,'network or bindings exposed');

 return Response.json({ok:true,checks:['GitHub upload commit','real isolated TypeScript execution','publish','two authenticated seats','idempotence','hidden projection','push creates preview','old release pinned','new code used','external imports rejected','network and bindings blocked']});
}catch(e){return Response.json({error:(e as Error).stack},{status:500})}}};
