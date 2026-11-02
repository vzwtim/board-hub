import {createRequire} from 'node:module';
import {readFile,mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
const require=createRequire(import.meta.resolve('wrangler/package.json')),{build}=require('esbuild');
const dir=await mkdtemp(join(tmpdir(),'boardhub-playtest-'));
try{await mkdir('work',{recursive:true});await build({entryPoints:['scripts/fixtures/local-playtest-smoke.ts'],bundle:true,format:'esm',platform:'node',target:'es2022',outfile:join(dir,'test.mjs'),external:['typescript','node:*'],plugins:[{name:'raw',setup(b){b.onResolve({filter:/\?raw$/},args=>({path:new URL(args.path.slice(0,-4),'file://'+args.resolveDir+'/').pathname,namespace:'raw'}));b.onLoad({filter:/.*/,namespace:'raw'},async args=>({contents:'export default '+JSON.stringify(await readFile(args.path,'utf8')),loader:'js'}))}}]});
// Resolve TypeScript from the project, preserving its native CJS wrapper.
const code=await readFile(join(dir,'test.mjs'),'utf8');await import('node:fs/promises').then(fs=>fs.writeFile(join(dir,'test.mjs'),code.replace(/from "typescript"/g,'from '+JSON.stringify(require.resolve('typescript')))));
const result=spawnSync(process.execPath,[join(dir,'test.mjs'),...process.argv.slice(2)],{stdio:'inherit'});if(result.status!==0)process.exitCode=result.status||1;
}finally{await rm(dir,{recursive:true,force:true})}
