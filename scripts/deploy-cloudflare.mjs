import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const base=JSON.parse(readFileSync('wrangler.json','utf8'));
if(base.d1_databases.some(d=>d.database_id==='00000000-0000-4000-8000-000000000000'))throw Error('Set the real D1 database_id in wrangler.json before deployment. See DEPLOY.md.');
const releaseConfig='dist/server/wrangler.json';
if(!existsSync(releaseConfig))throw Error('Run npm run build first.');
// Cloudflare Builds variables are process environment, not runtime bindings.
// Copy only these public settings; the Google secret never enters this file.
const release=JSON.parse(readFileSync(releaseConfig,'utf8'));
release.vars={...release.vars};release.keep_vars=true;
for(const key of ['GOOGLE_CLIENT_ID','BOARDHUB_ORIGIN','TABLE_ADMIN_EMAIL']){const value=process.env[key]?.trim();if(value)release.vars[key]=value}
writeFileSync(releaseConfig,JSON.stringify(release,null,2)+'\n',{mode:0o600});
const cli='node_modules/wrangler/bin/wrangler.js';
function run(args,input){const r=spawnSync(process.execPath,[cli,...args],{stdio:input?['pipe','inherit','inherit']:'inherit',...(input?{input}:{}),env:process.env});if(r.status!==0)process.exit(r.status||1)}
run(['d1','migrations','apply','DB','--remote','--config','wrangler.json']);
// Pass the existing build secret straight to Wrangler's stdin, never arguments/logs.
if(process.env.GOOGLE_CLIENT_SECRET?.trim())run(['secret','put','GOOGLE_CLIENT_SECRET','--config',releaseConfig],process.env.GOOGLE_CLIENT_SECRET.trim()+'\n');
run(['deploy','--config',releaseConfig]);
