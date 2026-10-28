import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const temp=await mkdtemp(join(tmpdir(),'boardhub-download-'));
const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','dev','--config','dist/server/wrangler.json','--local','--persist-to',join(temp,'state'),'--ip','127.0.0.1','--port','8804','--inspector-port','0'],{env:{...process.env,WRANGLER_SEND_METRICS:'false'},stdio:['ignore','pipe','pipe']});
try{
 await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Worker startup timeout: '+log.slice(-1000))),45000);const collect=b=>{log+=b;if(log.includes('Ready on')){clearTimeout(timer);resolve()}};child.stdout.on('data',collect);child.stderr.on('data',collect);child.once('exit',code=>{clearTimeout(timer);reject(Error('Worker exit '+code+': '+log.slice(-1000)))})});
 const page=await fetch('http://127.0.0.1:8804/studio/code');if(!page.ok||!(await page.text()).includes('/api/code-kits/isleworks'))throw Error('Code studio route failed');
 const response=await fetch('http://127.0.0.1:8804/api/code-kits/isleworks');if(!response.ok||!response.headers.get('content-type')?.includes('application/zip'))throw Error('Kit download failed');
 const path=join(temp,'kit.zip'),out=join(temp,'kit');await writeFile(path,new Uint8Array(await response.arrayBuffer()));
 execFileSync('python',['-c','import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; z.extractall(sys.argv[2])',path,out],{stdio:'pipe'});
 execFileSync(process.execPath,['--test','contract.test.ts'],{cwd:out,stdio:'pipe'});
 console.log('PASS: production Worker serves code studio, valid source ZIP and independently runnable game tests.');
}finally{await new Promise(resolve=>{child.once('exit',resolve);child.kill();setTimeout(resolve,3000).unref()});await rm(temp,{recursive:true,force:true})}
