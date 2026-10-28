import {RuleError} from '../../engine/types.ts';
import {compileCode,sandboxCall,type SandboxLoader} from './compiler.ts';
import {requireProject,validateFiles,digest,type CodeStore,type CodeRelease} from './model.ts';
export async function prepareRelease(store:CodeStore,loader:SandboxLoader|undefined,project:string,owner:string,input:unknown,source:CodeRelease['source']){
 await requireProject(store,project,owner);const files=validateFiles(input);let compiled:ReturnType<typeof compileCode>,compileError='';
 try{compiled=compileCode(files)}catch(e){compileError=(e as Error).message.slice(0,300);compiled={files,modules:{},title:JSON.parse(files['manifest.json']).title,ui:files['ui.html'],digest:digest('invalid:'+JSON.stringify(Object.entries(files).sort(([a],[b])=>a.localeCompare(b))))}}
 const id=project+'-'+compiled.digest.slice(0,24),existing=await store.getRelease(project,id);if(existing?.status==='ready')return existing;
 if(!existing&&(await store.listReleases(project)).length>=40)throw new RuleError('LIMIT','コード版は40件までです');
 const release:CodeRelease={...compiled,id,project,status:compileError?'failed':'ready',error:compileError,source,createdAt:Date.now()};
 if(!compileError){if(loader)try{const metadata=await sandboxCall(loader,release,{type:'metadata'});if(typeof metadata.id!=='string'||metadata.id.length>80||typeof metadata.version!=='string'||!Number.isInteger(metadata.minPlayers)||!Number.isInteger(metadata.maxPlayers)||metadata.minPlayers<2||metadata.maxPlayers>4||metadata.minPlayers>metadata.maxPlayers)throw Error('ゲームの人数・ID・版を確認してください');const {state}=await sandboxCall(loader,release,{type:'start',players:metadata.minPlayers});checkState(state,undefined,metadata.minPlayers);await sandboxCall(loader,release,{type:'view',state,player:null});}catch(e){release.status='failed';release.error=(e as Error).message.slice(0,300)}
 else {release.status='failed';release.error='ソースは検証済みです。コード試遊の実行環境が未接続のため、接続後に再取り込みしてください。'}}
 await store.saveRelease(release);return release;
}
export function checkState(state:any,previous?:any,count?:number){
 if(!state||typeof state!=='object'||state.schemaVersion!==1||typeof state.gameID!=='string'||typeof state.gameVersion!=='string'||!Array.isArray(state.players)||state.players.length<2||count!==undefined&&state.players.length!==count||state.players.length>4||!['playing','finished'].includes(state.phase)||!Number.isInteger(state.revision)||!Number.isInteger(state.turn)||state.turn<0||!state.players.every((p:any,i:number)=>p.id===String(i)&&typeof p.name==='string')||!state.players.some((p:any)=>p.id===state.currentPlayer)||state.winner!==null&&state.winner!=='draw'&&!state.players.some((p:any)=>p.id===state.winner)||!Array.isArray(state.events)||JSON.stringify(state).length>400000)throw new RuleError('INPUT','ゲームが不正な状態を返しました');
 if(previous&&(state.revision!==previous.revision+1||state.gameID!==previous.gameID||state.gameVersion!==previous.gameVersion||JSON.stringify(state.players)!==JSON.stringify(previous.players)))throw new RuleError('INPUT','ゲームの版・席・revisionを変更できません');
}
