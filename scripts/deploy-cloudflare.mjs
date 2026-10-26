import {readFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const base=JSON.parse(readFileSync('wrangler.json','utf8'));
if(base.d1_databases.some(d=>d.database_id==='00000000-0000-4000-8000-000000000000'))throw Error('Set the real D1 database_id in wrangler.json before deployment. See DEPLOY.md.');
if(!existsSync('dist/server/wrangler.json'))throw Error('Run npm run build first.');
const cli='node_modules/wrangler/bin/wrangler.js';
for(const args of [['d1','migrations','apply','DB','--remote','--config','wrangler.json'],['deploy','--config','dist/server/wrangler.json']]){const r=spawnSync(process.execPath,[cli,...args],{stdio:'inherit',env:process.env});if(r.status!==0)process.exit(r.status||1)}
