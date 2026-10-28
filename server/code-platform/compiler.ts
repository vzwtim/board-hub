import ts from 'typescript';
import core from '../../engine/core.ts?raw';
import types from '../../engine/types.ts?raw';
import sdk from '../../sdk/code-game.ts?raw';
import host from './sandbox-host.js?raw';
import {RuleError} from '../../engine/types.ts';
import {validateFiles,digest,type SourceFiles,type CodeRelease} from './model.ts';

function normalize(from:string,to:string){if(!to.startsWith('./')&&!to.startsWith('../'))throw new RuleError('INPUT','外部ライブラリのimportにはまだ対応していません: '+to);const parts=from.split('/').slice(0,-1);for(const part of to.split('/')){if(part==='..'){if(!parts.length)throw new RuleError('INPUT','フォルダ外へのimportはできません');parts.pop()}else if(part!=='.'&&part)parts.push(part)}return parts.join('/')}
export function compileCode(input:unknown){
 const files=validateFiles(input);for(const [path,trusted] of Object.entries({'engine/core.ts':core,'engine/types.ts':types,'sdk/code-game.ts':sdk}))if(files[path]!==undefined&&files[path]!==trusted)throw new RuleError('INPUT','共通SDKは変更できません。ゲーム側で拡張してください: '+path);if(files['__boardhub_host.js'])throw new RuleError('INPUT','予約されたファイル名です');const sources:SourceFiles={...files,'engine/core.ts':core,'engine/types.ts':types,'sdk/code-game.ts':sdk,'__boardhub_host.js':host};
 const modules:CodeRelease['modules']={};
 for(const [path,source] of Object.entries(sources).sort(([a],[b])=>a.localeCompare(b))){
  if(!/\.(ts|js|json)$/.test(path)||path==='manifest.json'||path==='package.json'||/\.test\.ts$/.test(path))continue;
  if(path.endsWith('.json')){try{modules[path]={json:JSON.parse(source)}}catch{throw new RuleError('INPUT','JSONを確認してください: '+path)}continue}
  const ast=ts.createSourceFile(path,source,ts.ScriptTarget.ES2022,true,path.endsWith('.ts')?ts.ScriptKind.TS:ts.ScriptKind.JS);
  const check=(node:ts.Node)=>{
   if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier)){
    if(ts.isImportDeclaration(node)&&node.importClause?.isTypeOnly)return;
    if(ts.isExportDeclaration(node)&&node.isTypeOnly)return;
    const target=normalize(path,node.moduleSpecifier.text);if(!sources[target])throw new RuleError('INPUT','import先が見つかりません: '+target);
   }
   if(ts.isImportEqualsDeclaration(node)||ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||ts.isIdentifier(node.expression)&&node.expression.text==='require'))throw new RuleError('INPUT','動的importとrequireは未対応です');
   ts.forEachChild(node,check);
  };check(ast);
  const result=ts.transpileModule(source,{fileName:path,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,isolatedModules:true,verbatimModuleSyntax:false}});
  const error=result.diagnostics?.find(d=>d.category===ts.DiagnosticCategory.Error);if(error)throw new RuleError('INPUT',path+': '+ts.flattenDiagnosticMessageText(error.messageText,' '));
  modules[path]={js:result.outputText};
 }
 const title=JSON.parse(files['manifest.json']).title;
 const fingerprint=digest(JSON.stringify({sdk:'0.1.0',host:'1',modules,ui:files['ui.html']}));
 return {files,modules,title,ui:files['ui.html'],digest:fingerprint};
}
export interface SandboxLoader {get(id:string,callback:()=>WorkerLoaderWorkerCode):{getEntrypoint(name?:string,options?:WorkerStubEntrypointOptions):{fetch(request:Request):Promise<Response>}}}
export async function sandboxCall(loader:SandboxLoader|undefined,release:Pick<CodeRelease,'digest'|'modules'>,command:unknown):Promise<any>{
 if(!loader)throw new RuleError('SETUP','コード試遊の実行環境が未接続です');
 const worker=loader.get('boardhub:'+release.digest,()=>({compatibilityDate:'2026-05-15',mainModule:'__boardhub_host.js',modules:release.modules as Record<string,WorkerLoaderModule>,env:{},globalOutbound:null,limits:{cpuMs:50,subRequests:0}}));
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{
 const response=await Promise.race([worker.getEntrypoint(undefined,{limits:{cpuMs:50,subRequests:0}}).fetch(new Request('https://game.invalid/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(command)})),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new RuleError('LIMIT','ゲームの処理が時間内に完了しませんでした')),5000)})]);
 const reader=response.body?.getReader();if(!reader)throw new RuleError('INPUT','ゲームの応答が空です');let text='',size=0;const decoder=new TextDecoder();for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>500000){await reader.cancel();throw new RuleError('LIMIT','ゲームの状態が大きすぎます')}text+=decoder.decode(value,{stream:true})}text+=decoder.decode();
 const data=JSON.parse(text);if(!response.ok)throw new RuleError('INPUT',String(data.error||'ゲーム処理に失敗しました').slice(0,300));return data;
 }finally{if(timer)clearTimeout(timer)}
}
