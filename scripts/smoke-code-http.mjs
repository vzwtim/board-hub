import {createRequire} from 'node:module';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,readFile,writeFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.resolve('wrangler/package.json')),{build}=require('esbuild');
const temp=await mkdtemp(join(tmpdir(),'boardhub-code-http-')),persist=join(temp,'state'),seedPath=resolve('outputs/code-http-seed.mjs'),configPath=resolve('dist/server/wrangler.code-http.json');let child;
function assert(value,message){if(!value)throw Error(message)}
try{
 await mkdir(dirname(seedPath),{recursive:true});await build({entryPoints:['scripts/fixtures/code-platform-seed.ts'],outfile:seedPath,bundle:true,platform:'node',format:'esm',external:['typescript','node:*'],plugins:[{name:'raw',setup(b){b.onResolve({filter:/\?raw$/},args=>({path:resolve(args.resolveDir,args.path.slice(0,-4)),namespace:'raw'}));b.onLoad({filter:/.*/,namespace:'raw'},async args=>({contents:'export default '+JSON.stringify(await readFile(args.path,'utf8')),loader:'js'}))}}]});const {artifact}=await import(pathToFileURL(seedPath).href);
 const config=JSON.parse(await readFile('dist/server/wrangler.json','utf8'));config.worker_loaders=[{binding:'CODE_LOADER'}];config.vars={...config.vars,BOARDHUB_CODE_ENABLED:'true'};await writeFile(configPath,JSON.stringify(config));
 child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','dev','--config',configPath,'--local','--persist-to',persist,'--ip','127.0.0.1','--port','8806','--inspector-port','0'],{env:{...process.env,WRANGLER_SEND_METRICS:'false'},stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('startup timeout '+log.slice(-1000))),45000);const collect=b=>{log+=b;if(log.includes('Ready on')){clearTimeout(timer);resolve()}};child.stdout.on('data',collect);child.stderr.on('data',collect);child.once('exit',code=>{clearTimeout(timer);reject(Error('Worker exit '+code+' '+log.slice(-1000)))})});
 const base='http://127.0.0.1:8806';async function api(path,body,cookie='',token=''){const response=await fetch(base+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json',Origin:base}:{}),...(cookie?{Cookie:cookie}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});const value=await response.json();return {status:response.status,value,cookie:(response.headers.get('set-cookie')||'').split(';')[0]||cookie}}
 const owner=await api('/api/code-projects');assert(owner.status===200,'project list failed '+JSON.stringify(owner.value));assert(!owner.value.capabilities.upload,'missing GitHub must not be available');assert(owner.value.capabilities.runtime,'test Loader not enabled');
 const created=await api('/api/code-projects',{title:'HTTP code game'},owner.cookie);assert(created.status===201,JSON.stringify(created.value));const p=created.value;
 const failed=await api('/api/code-projects/'+p.id+'/source',{type:'upload',expectedRevision:p.revision,files:artifact.files},owner.cookie);assert(failed.status===503,'unconfigured GitHub must fail explicitly');
 const opened=await api('/api/code-projects/'+p.id+'/draft',undefined,owner.cookie);assert(opened.status===200&&opened.value.files['game.ts'],'starter draft was not prepared automatically');
 const edited={...opened.value.files,'ui.html':opened.value.files['ui.html'].replace('コード試遊','アプリ内試遊')};
 const saved=await api('/api/code-projects/'+p.id+'/draft',{type:'save',files:edited,request:'船を追加したい',expectedRevision:opened.value.revision},owner.cookie);assert(saved.status===200&&saved.value.draft.revision===2,'native draft save failed '+JSON.stringify(saved.value));
 const reloaded=await api('/api/code-projects/'+p.id+'/draft',undefined,owner.cookie);assert(reloaded.value.files['ui.html'].includes('アプリ内試遊')&&reloaded.value.request==='船を追加したい','draft reload lost edits');
 const noAI=await api('/api/code-projects/'+p.id+'/draft',{type:'generate',instruction:'船を追加',expectedRevision:2},owner.cookie);assert(noAI.status===503,'missing AI provider must be explicit');
 const preview=await api('/api/code-projects/'+p.id+'/draft',{type:'preview',expectedRevision:2},owner.cookie);assert(preview.status===200&&preview.value.release.status==='ready','in-app preview failed '+JSON.stringify(preview.value));const release=preview.value.release;
 const ready=await api('/api/code-projects/'+p.id+'/releases/'+release.id);assert(ready.status===200&&ready.value.metadata.minPlayers===2,'release metadata failed '+JSON.stringify(ready.value));
 const a=await api('/api/code-projects/'+p.id+'/rooms',{release:release.id,players:2},owner.cookie);assert(a.status===201,JSON.stringify(a.value));const viewer=await api('/api/code-projects');
 const b=await api('/api/code-rooms/'+a.value.id,{release:release.id,type:'join'},viewer.cookie);assert(b.status===200&&b.value.playerID==='1','join failed '+JSON.stringify(b.value));
 const actor=a.value.state.currentPlayer==='0'?{cookie:owner.cookie,token:a.value.token}:{cookie:viewer.cookie,token:b.value.token};
 const moved=await api('/api/code-rooms/'+a.value.id,{release:release.id,type:'suggest',id:'http-smoke-action',expectedRevision:b.value.state.revision},actor.cookie,actor.token);assert(moved.status===200&&moved.value.state.revision===b.value.state.revision+1,'move failed '+JSON.stringify(moved.value));
 const denied=await api('/api/code-projects/'+p.id+'/publish',{release:release.id,listed:true,expectedRevision:1},viewer.cookie);assert(denied.status===401,'other author published');
 const published=await api('/api/code-projects/'+p.id+'/publish',{release:release.id,listed:true,expectedRevision:1},owner.cookie);assert(published.status===200,'publication failed');const community=await api('/api/code-projects?scope=community');assert(community.value.projects.some(x=>x.id===p.id),'not listed');
 const page=await fetch(base+'/code-games/'+p.id);const html=await page.text();assert(page.ok&&html.includes(p.id),'public game page failed');assert(page.headers.get('content-security-policy')?.includes("frame-src 'self'"),'frame navigation policy missing');
 console.log('PASS: in-app starter, draft save/reload, missing AI handled, native preview without GitHub, D1, real Loader, two seats, author-only publish and listing.');
}finally{if(child)await new Promise(resolve=>{child.once('exit',resolve);child.kill();setTimeout(resolve,3000).unref()});await rm(temp,{recursive:true,force:true});await rm(seedPath,{force:true});await rm(configPath,{force:true})}
