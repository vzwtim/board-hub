import {workerTypeScriptSource} from './typescript-worker-plugin.mjs';
import {dirname} from 'node:path';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const require=createRequire(import.meta.resolve('wrangler/package.json'));
const {build}=require('esbuild'),{Miniflare}=require('miniflare');
const result=await build({entryPoints:['scripts/fixtures/code-platform-smoke.ts'],bundle:true,write:false,format:'esm',platform:'node',target:'es2022',external:['node:*','cloudflare:workers'],plugins:[{name:'typescript-worker',setup(b){b.onLoad({filter:/[\/]typescript[\/]lib[\/]typescript\.js$/},async args=>({contents:workerTypeScriptSource(await readFile(args.path,'utf8')),loader:'js',resolveDir:dirname(args.path)}))}},{name:'raw',setup(b){b.onResolve({filter:/\?raw$/},args=>({path:new URL(args.path.slice(0,-4),'file://'+args.resolveDir+'/').pathname,namespace:'raw'}));b.onLoad({filter:/.*/,namespace:'raw'},async args=>({contents:'export default '+JSON.stringify(await readFile(args.path,'utf8')),loader:'js'}))}}]});
const mf=new Miniflare({modules:true,script:result.outputFiles[0].text,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],workerLoaders:{CODE_LOADER:{}}});
try{const response=await mf.dispatchFetch('https://test.invalid');const text=await response.text();if(!response.ok)throw Error(text);console.log('PASS: '+text)}finally{await mf.dispose()}
